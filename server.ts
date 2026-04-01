import express from "express";
import cors from "cors";
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
    throw new Error("Credenciais e2Payments não configuradas no servidor.");
  }

  try {
    const response = await fetch('https://e2payments.explicador.co.mz/oauth/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://e2payments.explicador.co.mz',
        'Referer': 'https://e2payments.explicador.co.mz/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.error("e2Payments token error:", responseText);
      throw new Error(`Erro ao obter token: ${response.status} ${response.statusText}`);
    }

    const data = JSON.parse(responseText);
    const tokenType = data.token_type || 'Bearer';
    e2Token = `${tokenType} ${data.access_token}`;
    // Buffer de 60 segundos para expiração
    e2TokenExpiry = now + ((data.expires_in || 3600) - 60) * 1000;
    return e2Token;
  } catch (error: any) {
    console.error("getE2Token exception:", error);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log('Server initialization:', {
    hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasE2Credentials: !!process.env.E2PAYMENTS_CLIENT_ID && !!process.env.E2PAYMENTS_CLIENT_SECRET,
    appUrl: process.env.APP_URL,
    callbackUrl: process.env.E2PAYMENTS_CALLBACK_URL || (process.env.APP_URL ? `${process.env.APP_URL}/webhook` : null)
  });

  // Enable CORS for all origins
  app.use(cors());

  // Global request logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString()
    });
  });

  // API route to create a payment request
  app.post("/api/v1/payments", express.json(), async (req, res) => {
    console.log("Received /api/v1/payments request:", req.body);
    const { amount, method, userId, planId, durationDays, phone } = req.body;

    if (!amount || !userId || !planId || !durationDays) {
      console.error("Missing required fields in create-payment:", { amount, userId, planId, durationDays });
      return res.status(400).json({ error: "Campos obrigatórios em falta" });
    }

    console.log(`Payment request: method=${method}, amount=${amount}, userId=${userId}`);

    try {
      const isDevUser = userId === '00000000-0000-0000-0000-000000000000';
      
      // Construct a unique reference (max 20 characters for M-Pesa, e2Payments adds prefix/suffix)
      // We'll use a 15-character alphanumeric string and store it in the database
      const reference = crypto.randomBytes(8).toString('hex').substring(0, 15);

      // Store pending subscription details in the profile
      if (!isDevUser) {
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            pending_plan: planId,
            pending_days: durationDays,
            pending_reference: reference
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

      console.log(`Payment created with reference: ${reference} (length: ${reference.length})`);

      return res.json({
        status: "success",
        message: "Pedido de pagamento criado",
        data: {
          reference: reference,
          amount: amount,
          method: method,
          userId: userId,
          planId: planId,
          phone: phone || ''
        }
      });
    } catch (error) {
      console.error("Failed to create payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API route to confirm and trigger the STK push
  app.post("/api/v1/payments/confirm", express.json(), async (req, res) => {
    const { amount, reference, userId, method, phone } = req.body;
    console.log(`Confirming payment: ${method} for user ${userId}, amount ${amount}, ref ${reference}`);

    try {
      if (!amount || !reference || !userId || !method || !phone) {
        return res.status(400).json({ error: "Dados de pagamento incompletos" });
      }

      if (phone.replace(/\D/g, '').length < 9) {
        return res.status(400).json({ error: "Número de telefone inválido" });
      }

      const token = await getE2Token();
      const walletId = process.env[`E2PAYMENTS_${method.toUpperCase()}_WALLET_ID`] || process.env.E2PAYMENTS_WALLET_ID;
      
      console.log(`Using wallet ID for ${method}: ${walletId}`);
      
      if (!walletId) {
        console.error(`Wallet ID missing for method: ${method}`);
        return res.status(400).json({ error: "Configuração de carteira em falta para este método" });
      }

      const paymentMethod = method === 'mpesa' ? 'mpesa' : (method === 'emola' ? 'emola' : 'mkesh');
      const endpoint = `https://e2payments.explicador.co.mz/v1/c2b/${paymentMethod}-payment/${walletId}`;
      const formattedPhone = phone.replace(/\D/g, '').slice(-9);

      const callbackUrl = process.env.E2PAYMENTS_CALLBACK_URL || (process.env.APP_URL ? `${process.env.APP_URL}/webhook` : null);

      const payload: any = {
        client_id: process.env.E2PAYMENTS_CLIENT_ID,
        amount: amount.toString(),
        phone: formattedPhone,
        reference: reference
      };

      if (callbackUrl) {
        payload.callback_url = callbackUrl;
      }

      console.log(`Sending STK push to ${endpoint} with payload:`, JSON.stringify(payload));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Origin": "https://e2payments.explicador.co.mz",
          "Referer": "https://e2payments.explicador.co.mz/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`e2Payments response (${response.status}):`, responseText);

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // If it's HTML, we'll just use a generic message
        if (responseText.includes('<html')) {
          data = { message: "O servidor de pagamentos recusou o pedido (403 Forbidden). Verifique as configurações de carteira e credenciais." };
        } else {
          data = { message: responseText || "Resposta inválida do servidor de pagamentos" };
        }
      }

      if (!response.ok) {
        // Use 400 instead of 403 to avoid proxy interception
        const statusCode = response.status === 403 ? 400 : response.status;
        return res.status(statusCode).json({
          error: "Erro no Pagamento",
          message: data.message || data.error || "A API de pagamentos recusou o pedido."
        });
      }

      res.json({ status: "success", data });
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
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
        console.log(`Processing successful payment for reference: ${reference}`);

        // Handle dev user gracefully
        if (reference.startsWith('AAAAAAAAAAAAAAAAAAAAAA')) {
          console.log("Dev user payment success - skipping database update");
          return res.json({ status: "ok", message: "Dev user handled" });
        }

        // Fetch the profile by pending_reference
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("id, pending_plan, pending_days")
          .eq("pending_reference", reference)
          .single();

        if (fetchError || !profile || !profile.pending_plan) {
          console.error("Could not find pending subscription for reference:", reference, fetchError);
          
          // Fallback: Try to decode userId from reference if it's the old format (22 chars base64)
          if (reference.length >= 22) {
            try {
              const encodedId = reference.substring(0, 22);
              let base64 = encodedId.replace(/-/g, '+').replace(/_/g, '/');
              while (base64.length % 4) base64 += '=';
              const hex = Buffer.from(base64, 'base64').toString('hex');
              const userId = [
                hex.substring(0, 8),
                hex.substring(8, 12),
                hex.substring(12, 16),
                hex.substring(16, 20),
                hex.substring(20)
              ].join("-");
              
              console.log(`Fallback: Decoded userId ${userId} from old reference format`);
              
              const { data: oldProfile, error: oldFetchError } = await supabase
                .from("profiles")
                .select("id, pending_plan, pending_days")
                .eq("id", userId)
                .single();
                
              if (!oldFetchError && oldProfile && oldProfile.pending_plan) {
                // Continue with oldProfile
                const planId = oldProfile.pending_plan;
                const durationDays = oldProfile.pending_days;
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + durationDays);
                
                await supabase
                  .from("profiles")
                  .update({
                    subscription_status: "active",
                    subscription_expiry: expiryDate.toISOString(),
                    subscription_plan: planId,
                    pending_plan: null,
                    pending_days: null,
                    pending_reference: null
                  })
                  .eq("id", userId);
                  
                return res.json({ status: "ok", message: "Subscription updated via fallback" });
              }
            } catch (e) {
              console.error("Fallback decoding failed:", e);
            }
          }
          
          return res.status(404).json({ error: "Pending subscription not found" });
        }

        const userId = profile.id;
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
            pending_days: null,
            pending_reference: null
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
