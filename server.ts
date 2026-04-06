import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// =============================================================================
// CONFIGURAÇÃO DE CREDENCIAIS (Pode preencher aqui se as variáveis de ambiente falharem)
// =============================================================================
const CONFIG = {
  E2PAYMENTS: {
    CLIENT_ID: process.env.E2PAYMENTS_CLIENT_ID || "huiOQn2L3dvnIZ7f2vbG6E6033bvoHUnetXPLWlr",
    CLIENT_SECRET: process.env.E2PAYMENTS_CLIENT_SECRET || "a1682097-7429-4bb2-80a1-c941f776a487",
    WALLET_ID: process.env.E2PAYMENTS_WALLET_ID || "243004",
    MPESA_WALLET_ID: process.env.E2PAYMENTS_MPESA_WALLET_ID || "243004",
    EMOLA_WALLET_ID: process.env.E2PAYMENTS_EMOLA_WALLET_ID || "243004",
    MKESH_WALLET_ID: process.env.E2PAYMENTS_MKESH_WALLET_ID || "243004",
    CALLBACK_URL: process.env.E2PAYMENTS_CALLBACK_URL || ""
  },
  SUPABASE: {
    URL: process.env.VITE_SUPABASE_URL || "",
    SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  },
  APP_URL: process.env.APP_URL || ""
};
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = CONFIG.SUPABASE.URL;
const supabaseServiceKey = CONFIG.SUPABASE.SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("CRITICAL: Supabase environment variables are missing!");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

let e2Token: string | null = null;
let e2TokenExpiry: number = 0;

async function getE2Token() {
  const now = Date.now();
  if (e2Token && now < e2TokenExpiry) {
    return e2Token;
  }

  const clientId = CONFIG.E2PAYMENTS.CLIENT_ID;
  const clientSecret = CONFIG.E2PAYMENTS.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais e2Payments não configuradas no servidor. Verifique o objeto CONFIG no server.ts");
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
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Non-JSON response from e2Payments token API:", responseText);
      throw new Error(`Erro na resposta do servidor de token (não-JSON): ${responseText.slice(0, 100)}`);
    }

    if (!response.ok) {
      console.error("e2Payments token error:", data);
      throw new Error(`Erro ao obter token: ${response.status} ${data.message || response.statusText}`);
    }

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
    hasSupabaseUrl: !!CONFIG.SUPABASE.URL,
    hasSupabaseKey: !!CONFIG.SUPABASE.SERVICE_KEY,
    hasE2Credentials: !!CONFIG.E2PAYMENTS.CLIENT_ID && !!CONFIG.E2PAYMENTS.CLIENT_SECRET,
    appUrl: CONFIG.APP_URL,
    callbackUrl: CONFIG.E2PAYMENTS.CALLBACK_URL || (CONFIG.APP_URL ? `${CONFIG.APP_URL}/webhook` : null)
  });

  // Enable CORS for all origins
  app.use(cors());

  // Global request logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Global JSON parsing middleware
  app.use(express.json());

  // =============================================================================
  // ROTAS DA API (Prioridade Máxima)
  // =============================================================================
  const apiRouter = express.Router();

  // API Health check
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Debug check
  apiRouter.get("/debug/config", (req, res) => {
    res.json({
      hasClientId: !!CONFIG.E2PAYMENTS.CLIENT_ID,
      hasSecret: !!CONFIG.E2PAYMENTS.CLIENT_SECRET,
      hasWalletId: !!CONFIG.E2PAYMENTS.WALLET_ID,
      walletId: CONFIG.E2PAYMENTS.WALLET_ID,
      hasSupabaseUrl: !!CONFIG.SUPABASE.URL,
      hasSupabaseKey: !!CONFIG.SUPABASE.SERVICE_KEY,
      env: process.env.NODE_ENV || "development"
    });
  });

  // API route to process a payment (Create reference + STK Push)
  apiRouter.post("/v1/payments/process", async (req, res) => {
    console.log("API: Processing payment request", { method: req.body.method, amount: req.body.amount });
    const { amount, method, userId, planId, durationDays, phone } = req.body;

    if (!amount || !userId || !planId || !durationDays || !method || !phone) {
      return res.status(400).json({ error: "Campos obrigatórios em falta" });
    }

    try {
      const isDevUser = userId === '00000000-0000-0000-0000-000000000000';
      const reference = crypto.randomBytes(8).toString('hex').substring(0, 15);

      if (!isDevUser) {
        await supabase.from("profiles").upsert({
          id: userId,
          pending_plan: planId,
          pending_days: durationDays,
          pending_reference: reference
        });
      }

      const token = await getE2Token();
      const walletId = CONFIG.E2PAYMENTS[`${method.toUpperCase()}_WALLET_ID`] || CONFIG.E2PAYMENTS.WALLET_ID;
      
      if (!walletId) {
        return res.status(400).json({ error: "Configuração de carteira em falta" });
      }

      const paymentMethod = method === 'mpesa' ? 'mpesa' : (method === 'emola' ? 'emola' : 'mkesh');
      const endpoint = `https://e2payments.explicador.co.mz/v1/c2b/${paymentMethod}-payment/${walletId}`;
      
      const payload = {
        client_id: CONFIG.E2PAYMENTS.CLIENT_ID,
        amount: amount.toString(),
        phone: phone.replace(/\D/g, '').slice(-9),
        reference: reference,
        callback_url: CONFIG.E2PAYMENTS.CALLBACK_URL || (CONFIG.APP_URL ? `${CONFIG.APP_URL}/webhook` : null)
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data: any;
      try { data = JSON.parse(responseText); } catch (e) { data = { message: responseText }; }

      if (!response.ok) {
        return res.status(response.status === 403 ? 400 : response.status).json({
          error: "Erro no STK Push",
          message: data.message || data.error || "A API recusou o pedido.",
          details: data
        });
      }

      res.json({ status: "success", reference, data });
    } catch (error: any) {
      console.error("Payment critical error:", error);
      res.status(500).json({ error: "Erro Interno", message: error.message });
    }
  });

  // API route to create a payment request (Legacy)
  apiRouter.post("/v1/payments", async (req, res) => {
    const { amount, method, userId, planId, durationDays, phone } = req.body;
    const reference = crypto.randomBytes(8).toString('hex').substring(0, 15);
    res.json({ status: "success", data: { reference, amount, method, userId, planId, phone } });
  });

  // API route to confirm and trigger the STK push (Legacy)
  apiRouter.post("/v1/payments/confirm", async (req, res) => {
    res.status(410).json({ error: "Endpoint depreciado. Use /process" });
  });

  // Mount API Router
  app.use("/api", apiRouter);

  // Health check (Root level)
  app.get("/health", (req, res) => res.json({ status: "ok" }));

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
  app.post("/webhook", async (req, res) => {
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

  // =============================================================================
  // SERVIDOR DE FICHEIROS ESTÁTICOS (Apenas se não for API)
  // =============================================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Servir ficheiros estáticos (CSS, JS, Imagens)
    app.use(express.static(distPath, { index: false }));
    
    // Catch-all para SPA: Apenas para GET e caminhos que NÃO começam por /api
    app.get("*", async (req, res, next) => {
      if (req.url.startsWith("/api") || req.url.startsWith("/webhook")) {
        return next();
      }
      
      try {
        const fs = await import('fs/promises');
        let html = await fs.readFile(path.join(distPath, "index.html"), 'utf-8');
        
        // Inject runtime environment variables
        const runtimeEnv = {
          GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
          VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || ''
        };
        
        const scriptTag = `<script>window.__RUNTIME_ENV__ = ${JSON.stringify(runtimeEnv)};</script>`;
        html = html.replace('</head>', `${scriptTag}</head>`);
        
        res.send(html);
      } catch (err) {
        console.error("Error serving index.html:", err);
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  // 404 para API (Garante que nunca devolve HTML para /api)
  app.use("/api/*", (req, res) => {
    res.status(404).json({ 
      error: "API Route Not Found", 
      message: `O endpoint ${req.method} ${req.originalUrl} não existe.` 
    });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global error handler caught:", err);
    res.status(err.status || 500).json({ 
      error: "Internal Server Error", 
      message: err.message || "An unexpected error occurred",
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!CONFIG.E2PAYMENTS.CLIENT_ID || !CONFIG.E2PAYMENTS.CLIENT_SECRET) {
      console.warn("WARNING: E2PAYMENTS credentials are not fully set in CONFIG. Payments will not work.");
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
