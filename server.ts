import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("CRITICAL: Supabase environment variables are missing!");
  console.log("VITE_SUPABASE_URL:", supabaseUrl ? "Present" : "Missing");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "Present" : "Missing");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

let e2Token: string | null = null;
let e2TokenExpiry: number = 0;

async function getE2Token() {
  const now = Date.now();
  if (e2Token && now < e2TokenExpiry) {
    return e2Token;
  }

  const clientId = process.env.E2PAYMENTS_CLIENT_ID;
  const clientSecret = process.env.E2PAYMENTS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("e2Payments credentials missing (E2PAYMENTS_CLIENT_ID or E2PAYMENTS_CLIENT_SECRET)");
  }

  const response = await fetch('https://e2payments.explicador.co.mz/oauth/token', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("e2Payments token error:", errorData);
    throw new Error(`Failed to get e2Payments token: ${response.statusText}`);
  }

  const data = await response.json();
  e2Token = `${data.token_type} ${data.access_token}`;
  // Token expires in data.expires_in seconds. Buffer by 60 seconds.
  e2TokenExpiry = now + (data.expires_in - 60) * 1000;
  return e2Token;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API route to create a payment request
  app.post("/api/v1/payments", express.json(), async (req, res) => {
    const { amount, method, userId, planId, durationDays, phone } = req.body;

    if (!amount || !userId || !planId || !durationDays) {
      console.error("Missing required fields in create-payment:", { amount, userId, planId, durationDays });
      return res.status(400).json({ error: "Campos obrigatórios em falta" });
    }

    const E2_CLIENT_ID = process.env.E2PAYMENTS_CLIENT_ID;
    const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || "http://localhost:3000";

    if (!E2_CLIENT_ID) {
      console.error("E2PAYMENTS_CLIENT_ID is not configured");
      return res.status(500).json({ 
        error: "Configuração Incompleta", 
        message: "As credenciais da e2Payments não estão configuradas. Por favor, adicione E2PAYMENTS_CLIENT_ID às variáveis de ambiente." 
      });
    }

    // Determine wallet ID based on method or use generic one
    let walletId = process.env.E2PAYMENTS_WALLET_ID || "";
    if (!walletId) {
      if (method === 'emola') walletId = process.env.E2PAYMENTS_EMOLA_WALLET_ID || "";
      else if (method === 'mpesa') walletId = process.env.E2PAYMENTS_MPESA_WALLET_ID || "";
      else if (method === 'mkesh') walletId = process.env.E2PAYMENTS_MKESH_WALLET_ID || "";
    }

    if (!walletId && method !== 'card') {
      console.error(`Wallet ID missing for method: ${method}`);
      return res.status(400).json({ error: "Configuração da carteira incompleta." });
    }

    // Construct a unique reference (max 27 chars)
    // Encode UUID (32 hex -> 22 base64) + random suffix
    const cleanId = userId.replace(/-/g, '');
    const encodedId = Buffer.from(cleanId, 'hex').toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const suffix = Math.random().toString(36).substring(2, 7);
    const reference = (encodedId + suffix).substring(0, 27);

    try {
      const isDevUser = userId === '00000000-0000-0000-0000-000000000000';
      
      // Store pending subscription details in the profile
      if (!isDevUser) {
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            pending_plan: planId,
            pending_days: durationDays
          });

        if (upsertError) {
          console.error("Error storing pending subscription:", upsertError);
          if (upsertError.code === '23503' || upsertError.code === '22P02') {
            console.warn("Database storage failed but continuing:", upsertError.message);
          } else {
            return res.status(500).json({ error: "Erro de Base de Dados", details: upsertError.message });
          }
        }
      }

      // Get e2Payments token
      let token;
      try {
        token = await getE2Token();
      } catch (tokenErr: any) {
        return res.status(500).json({ error: "Erro de Autenticação", message: tokenErr.message });
      }

      // Construct endpoint based on user's provided snippet pattern
      // Pattern: https://e2payments.explicador.co.mz/v1/c2b/{method}-payment/{walletId}
      const paymentMethod = method === 'mpesa' ? 'mpesa' : (method === 'emola' ? 'emola' : 'mkesh');
      const endpoint = `https://e2payments.explicador.co.mz/v1/c2b/${paymentMethod}-payment/${walletId}`;

      // e2Payments usually expects 9 digits for mobile money in Mozambique (e.g., 84XXXXXXX)
      const formattedPhone = phone.replace(/\D/g, '').slice(-9);

      console.log(`Initiating ${paymentMethod} payment for ${formattedPhone} (Wallet: ${walletId}) at ${endpoint}`);

      // Construct payload according to official e2Payments documentation
      const payload = {
        client_id: E2_CLIENT_ID,
        amount: amount.toString(),
        phone: phone.replace(/\D/g, ''), // Ensure only digits
        reference: reference.substring(0, 27)
      };
      
      console.log("Sending payload to e2Payments (v2):", JSON.stringify(payload));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("e2Payments non-JSON response:", responseText);
        return res.status(500).json({ error: "Erro na API de Pagamentos", message: "A API retornou uma resposta inválida." });
      }

      if (!response.ok) {
        console.error("FULL e2Payments API error response:", JSON.stringify(data, null, 2));
        return res.status(response.status).json({
          error: "Erro no Pagamento",
          message: data.message || "A API de pagamentos recusou o pedido.",
          details: data.errors || data
        });
      }

      // e2Payments response usually indicates if the request was sent to the phone
      res.json({
        status: "success",
        message: "Pedido de pagamento enviado para o telemóvel",
        data: data
      });
    } catch (error) {
      console.error("Failed to create payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Payment callback route to handle external redirects in an iframe
  app.get("/payment/callback", (req, res) => {
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/?payment=success';
            }
          </script>
          <p>Pagamento processado com sucesso. Esta janela fechará automaticamente.</p>
        </body>
      </html>
    `);
  });

  // Webhook endpoint for payment notifications
  app.post("/webhook", express.json(), async (req, res) => {
    try {
      const event = req.body;
      console.log("Received Payment Webhook:", JSON.stringify(event, null, 2));

      // Try to extract reference and status from various possible formats
      const reference = event.reference || (event.data && event.data.reference);
      const status = event.status || event.event || (event.data && event.data.status);
      
      const isSuccess = status === 'completed' || status === 'payment.success' || status === 'success';

      if (isSuccess && reference) {
        // Extract userId from reference (first 22 chars are base64 encoded UUID)
        let userId = "";
        try {
          const encodedId = reference.substring(0, 22);
          let base64 = encodedId.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) base64 += '=';
          const hex = Buffer.from(base64, 'base64').toString('hex');
          
          // Reconstruct UUID format (8-4-4-4-12)
          userId = [
            hex.substring(0, 8),
            hex.substring(8, 12),
            hex.substring(12, 16),
            hex.substring(16, 20),
            hex.substring(20)
          ].join("-");
        } catch (e) {
          console.error("Error decoding userId from reference:", reference, e);
          return res.status(400).json({ error: "Invalid reference format" });
        }
        
        if (!userId || userId.length !== 36) {
          console.error("Could not reconstruct userId from reference:", reference);
          return res.status(400).json({ error: "Invalid reference" });
        }

        console.log(`Processing successful payment for user: ${userId}`);

        // Handle dev user gracefully
        if (userId === '00000000-0000-0000-0000-000000000000') {
          console.log("Dev user payment success - skipping database update");
          return res.json({ status: "ok", message: "Dev user handled" });
        }

        // Fetch the pending subscription details from the profile
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("pending_plan, pending_days")
          .eq("id", userId)
          .single();

        if (fetchError || !profile || !profile.pending_plan) {
          console.error("Could not find pending subscription for user:", userId, fetchError);
          return res.status(404).json({ error: "Pending subscription not found" });
        }

        const planId = profile.pending_plan;
        const durationDays = profile.pending_days;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        console.log(`Updating subscription for user ${userId} to plan ${planId} until ${expiryDate.toISOString()}`);

        // Update the profile with active subscription and clear pending info
        const { data, error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_expiry: expiryDate.toISOString(),
            subscription_plan: planId,
            pending_plan: null,
            pending_days: null
          })
          .eq("id", userId)
          .select();

        if (error) {
          console.error("Supabase Error updating subscription:", JSON.stringify(error, null, 2));
          
          if (error.code === '42703') {
            console.error("CRITICAL: The 'profiles' table is missing subscription columns!");
          } else if (error.code === '42P01') {
            console.error("CRITICAL: The 'profiles' table does not exist!");
          }

          return res.status(500).json({ 
            error: "Failed to update subscription", 
            details: error.message,
            code: error.code
          });
        }

        console.log("Subscription updated successfully:", data);
        return res.status(200).json({ status: "success" });
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!process.env.E2PAYMENTS_CLIENT_ID) {
      console.warn("WARNING: E2PAYMENTS_CLIENT_ID is not set. Payments will not work.");
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
