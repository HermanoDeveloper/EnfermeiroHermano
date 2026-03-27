import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

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

  // API route to create a payment request
  app.post("/api/create-payment", express.json(), async (req, res) => {
    const { amount, method, userId, planId, durationDays, phone } = req.body;

    if (!amount || !userId || !planId || !durationDays) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const PAYSUITE_API_KEY = process.env.PAYSUITE_API_KEY;
    const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || "http://localhost:3000";

    if (!PAYSUITE_API_KEY) {
      console.error("PAYSUITE_API_KEY is not configured");
      return res.status(500).json({ error: "Payment provider not configured" });
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
        console.error("Error storing pending subscription:", upsertError);
        // We continue anyway, but it might fail at webhook if columns are missing
      }

      const response = await fetch("https://paysuite.tech/api/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PAYSUITE_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method: method === 'card' ? 'credit_card' : method,
          reference,
          description: `Subscrição Biblioteca da Saúde - Plano ${planId}`,
          callback_url: `${APP_URL}/webhook`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("PaySuite API error:", data);
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
    const signature = req.headers["x-webhook-signature"];
    const secret = process.env.PAYSUITE_WEBHOOK_SECRET;

    // In a real app, verify the signature here
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
  });
}

startServer();
