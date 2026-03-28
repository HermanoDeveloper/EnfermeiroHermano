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

    const PAYSUITE_API_KEY = process.env.PAYSUITE_API_KEY;
    const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || "http://localhost:3000";
    const PAYSUITE_CALLBACK_URL = process.env.PAYSUITE_CALLBACK_URL || `${APP_URL}/webhook`;

    if (!PAYSUITE_API_KEY || PAYSUITE_API_KEY.trim() === "") {
      console.error("PAYSUITE_API_KEY is not configured in environment variables");
      return res.status(500).json({ 
        error: "Configuração Incompleta", 
        message: "A chave de API da PaySuite não está configurada no servidor. Por favor, adicione PAYSUITE_API_KEY às variáveis de ambiente." 
      });
    }

    // Construct a reference that fits in 50 characters (PaySuite limit)
    // Format: userId (36) + "-" (1) + timestamp_suffix (8) = 45 characters
    const reference = `${userId}-${Date.now().toString().slice(-8)}`;

    try {
      // Store pending subscription details in the profile
      // We use upsert to ensure the profile exists and store the pending info
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          pending_plan: planId,
          pending_days: durationDays
        });

      if (upsertError) {
        console.error("Error storing pending subscription:", JSON.stringify(upsertError, null, 2));
        let message = "Não foi possível guardar os detalhes da subscrição no banco de dados.";
        
        if (upsertError.code === '42703') {
          message = "A tabela 'profiles' está em falta com as colunas 'pending_plan' ou 'pending_days'. Por favor, execute este SQL no Supabase: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pending_plan TEXT, ADD COLUMN IF NOT EXISTS pending_days INTEGER;";
          console.error("CRITICAL: The 'profiles' table is missing pending subscription columns!");
        } else if (upsertError.code === '42P01') {
          message = "A tabela 'profiles' não existe no Supabase.";
        }

        return res.status(500).json({ 
          error: "Erro de Base de Dados", 
          message: message,
          details: upsertError.message,
          code: upsertError.code
        });
      }

      // Construct the payment request body matching the example
      const paymentBody: any = {
        amount: parseFloat(amount).toFixed(2),
        reference,
        description: `Subscrição Biblioteca da Saúde - Plano ${planId}`,
        return_url: `${APP_URL}?payment=success`,
        callback_url: PAYSUITE_CALLBACK_URL,
      };

      // If method is provided and not 'card', we can try to pass it, 
      // but the example didn't show it, so we'll make it optional
      if (method && method !== 'card') {
        paymentBody.method = method === 'mpesa' ? 'mpesa' : (method === 'mkesh' ? 'mkesh' : (method === 'emola' ? 'emola' : method));
        if (phone) {
          paymentBody.phone = phone;
        }
      }

      const response = await fetch("https://paysuite.tech/api/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PAYSUITE_API_KEY.trim()}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(paymentBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("PaySuite API error:", JSON.stringify(data, null, 2));
        if (response.status === 401) {
          return res.status(401).json({ 
            error: "Erro de Autenticação na PaySuite", 
            message: "A chave de API da PaySuite (PAYSUITE_API_KEY) é inválida ou não foi configurada corretamente nas definições do projeto." 
          });
        }
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (error) {
      console.error("Failed to create payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Webhook endpoint for Paysuite
  app.post("/webhook", express.json(), async (req, res) => {
    try {
      const signature = req.headers["x-webhook-signature"] as string;
    const secret = process.env.PAYSUITE_WEBHOOK_SECRET;

    if (secret && signature) {
      const hmac = crypto.createHmac("sha256", secret);
      const body = JSON.stringify(req.body);
      const digest = hmac.update(body).digest("hex");

      if (digest !== signature) {
        console.error("Invalid webhook signature:", { signature, digest });
        return res.status(401).json({ error: "Invalid signature" });
      }
    } else if (secret && !signature) {
      console.warn("Webhook secret configured but no signature received");
    }

    const event = req.body;

    console.log("Received Paysuite Webhook:", JSON.stringify(event, null, 2));

    // PaySuite uses 'event' field in documentation
    const eventType = event.event || event.type;

    if (eventType === "payment.success") {
      const { reference, amount } = event.data;
      
      if (!reference) {
        console.error("Missing reference in webhook data");
        return res.status(400).json({ error: "Missing reference" });
      }

      // Extract userId from reference (format: userId-timestampSuffix)
      const userId = reference.split("-")[0];
      
      if (!userId) {
        console.error("Could not extract userId from reference:", reference);
        return res.status(400).json({ error: "Invalid reference" });
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

      console.log(`Updating subscription for user ${userId} to plan ${planId} until ${expiryDate.toISOString()} (Amount: ${amount})`);

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
          console.log("Please run the following SQL in your Supabase SQL Editor:");
          console.log(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
            ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
            ADD COLUMN IF NOT EXISTS pending_plan TEXT,
            ADD COLUMN IF NOT EXISTS pending_days INTEGER;
          `);
        }
 else if (error.code === '42P01') {
          console.error("CRITICAL: The 'profiles' table does not exist!");
          console.log("Please create the 'profiles' table in your Supabase SQL Editor.");
        }

        return res.status(500).json({ 
          error: "Failed to update subscription", 
          details: error.message,
          code: error.code
        });
      }

      console.log("Subscription updated successfully:", data);
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
    if (!process.env.PAYSUITE_API_KEY) {
      console.warn("WARNING: PAYSUITE_API_KEY is not set. Payments will not work.");
    }
    if (!process.env.PAYSUITE_WEBHOOK_SECRET) {
      console.warn("WARNING: PAYSUITE_WEBHOOK_SECRET is not set. Webhooks will not be verified.");
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
