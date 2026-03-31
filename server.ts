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

  const responseText = await response.text().catch(() => "");
  if (!response.ok) {
    console.error("e2Payments token error:", responseText);
    throw new Error(`Failed to get e2Payments token: ${response.statusText}`);
  }

  const data = JSON.parse(responseText);
  const tokenType = data.token_type || 'Bearer';
  e2Token = `${tokenType} ${data.access_token}`;
  e2TokenExpiry = now + (data.expires_in - 60) * 1000;
  return e2Token;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log('Server initialization:', {
    hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasE2Credentials: !!process.env.E2PAYMENTS_CLIENT_ID && !!process.env.E2PAYMENTS_CLIENT_SECRET
  });

  // Enable CORS for all origins
  app.use(cors());

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString()
    });
  });

  // Local Paylink UI Route
  app.get("/paylink", (req, res) => {
    const { amount, reference, userId, method, planId, phone } = req.query;
    
    res.send(`
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pagamento Seguro - Paylink</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #f9fafb; }
          .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); }
        </style>
      </head>
      <body class="flex items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-md glass rounded-3xl shadow-2xl overflow-hidden">
          <div class="bg-orange-500 p-6 text-white text-center">
            <h1 class="text-2xl font-bold">Paylink</h1>
            <p class="text-orange-100 text-sm mt-1">Pagamento Seguro e Rápido</p>
          </div>
          
          <div class="p-8">
            <div class="text-center mb-8">
              <span class="text-gray-500 text-sm uppercase tracking-wider font-semibold">Valor a Pagar</span>
              <div class="text-4xl font-black text-gray-900 mt-1">${amount} MT</div>
            </div>

            <form id="paymentForm" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Número de Telefone</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+258</span>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    value="${phone || ''}"
                    placeholder="84XXXXXXX" 
                    required
                    class="w-full pl-16 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium"
                  >
                </div>
                <p class="text-xs text-gray-400 mt-2">Introduza o número da sua conta ${method?.toString().toUpperCase() || 'Mobile Money'}</p>
              </div>

              <button 
                type="submit" 
                id="submitBtn"
                class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <span>Pagar Agora</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </form>

            <div id="status" class="hidden mt-6 p-4 rounded-xl text-center font-medium"></div>
          </div>

          <div class="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p class="text-xs text-gray-400">Referência: <span class="font-mono">${reference}</span></p>
          </div>
        </div>

        <script>
          const form = document.getElementById('paymentForm');
          const submitBtn = document.getElementById('submitBtn');
          const statusDiv = document.getElementById('status');

          form.onsubmit = async (e) => {
            e.preventDefault();
            const phone = document.getElementById('phone').value;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Processando...</span>';
            
            try {
              const response = await fetch('/api/v1/payments/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: "${amount}",
                  reference: "${reference}",
                  userId: "${userId}",
                  method: "${method}",
                  phone: phone
                })
              });

              const result = await response.json();
              
              if (response.ok) {
                statusDiv.className = 'mt-6 p-4 rounded-xl text-center font-medium bg-green-50 text-green-700 border border-green-100';
                statusDiv.innerHTML = '✅ Pedido enviado! Por favor, confirme no seu telemóvel.';
                statusDiv.classList.remove('hidden');
                
                // Close popup after a short delay
                setTimeout(() => {
                  if (window.opener) {
                    window.opener.postMessage({ type: 'PAYMENT_INITIATED' }, '*');
                    window.close();
                  }
                }, 3000);
              } else {
                throw new Error(result.message || 'Erro ao processar pagamento');
              }
            } catch (err) {
              statusDiv.className = 'mt-6 p-4 rounded-xl text-center font-medium bg-red-50 text-red-700 border border-red-100';
              statusDiv.innerHTML = '❌ ' + err.message;
              statusDiv.classList.remove('hidden');
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<span>Tentar Novamente</span>';
            }
          };
        </script>
      </body>
      </html>
    `);
  });

  // API route to create a payment request
  app.post("/api/v1/payments", express.json(), async (req, res) => {
    const { amount, method, userId, planId, durationDays, phone } = req.body;

    if (!amount || !userId || !planId || !durationDays) {
      console.error("Missing required fields in create-payment:", { amount, userId, planId, durationDays });
      return res.status(400).json({ error: "Campos obrigatórios em falta" });
    }

    const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || "http://localhost:3000";

    console.log(`Payment request: method=${method}, amount=${amount}, userId=${userId}`);

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

      // Construct a unique reference
      const encodedUserId = Buffer.from(userId.replace(/-/g, ''), 'hex').toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      const reference = `${encodedUserId}${crypto.randomBytes(4).toString('hex')}`;

      // Internal Paylink URL
      const paylinkUrl = new URL(`${APP_URL}/paylink`);
      paylinkUrl.searchParams.append('amount', amount.toString());
      paylinkUrl.searchParams.append('reference', reference);
      paylinkUrl.searchParams.append('userId', userId);
      paylinkUrl.searchParams.append('method', method);
      paylinkUrl.searchParams.append('planId', planId);
      paylinkUrl.searchParams.append('phone', phone || '');
      
      console.log(`Redirecting to Internal Paylink: ${paylinkUrl.toString()}`);

      return res.json({
        status: "success",
        message: "Redirecionando para o formulário de pagamento",
        data: {
          checkout_url: paylinkUrl.toString(),
          reference: reference
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

    try {
      const token = await getE2Token();
      const walletId = process.env[`E2PAYMENTS_${method.toUpperCase()}_WALLET_ID`] || process.env.E2PAYMENTS_WALLET_ID;
      
      if (!walletId) {
        return res.status(400).json({ error: "Wallet ID not configured for this method" });
      }

      const paymentMethod = method === 'mpesa' ? 'mpesa' : (method === 'emola' ? 'emola' : 'mkesh');
      const endpoint = `https://e2payments.explicador.co.mz/v1/c2b/${paymentMethod}-payment/${walletId}`;
      const formattedPhone = phone.replace(/\D/g, '').slice(-9);

      const payload = {
        client_id: process.env.E2PAYMENTS_CLIENT_ID,
        amount: amount.toString(),
        phone: formattedPhone,
        reference: reference,
        walletId: walletId
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: "Erro no Pagamento",
          message: data.message || "A API de pagamentos recusou o pedido."
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
