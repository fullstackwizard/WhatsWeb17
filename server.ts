import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for demo purposes (use a database in production)
  const messages: any[] = [];

  // --- WHATSAPP WEBHOOK ---

  // Verification (Meta requires this to enable the webhook)
  app.get("/api/webhook/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  });

  // Receiving messages
  app.post("/api/webhook/whatsapp", (req, res) => {
    const body = req.body;

    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from;
        const text = message.text?.body;

        if (text) {
          console.log(`Received message from ${from}: ${text}`);
          messages.push({
            id: message.id,
            from,
            text,
            timestamp: new Date().toISOString(),
            processed: false
          });
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  // API to get pending messages for the frontend to process
  app.get("/api/whatsapp/pending", (req, res) => {
    const pending = messages.filter(m => !m.processed);
    res.json(pending);
  });

  // API to mark a message as processed
  app.post("/api/whatsapp/mark-processed", (req, res) => {
    const { id } = req.body;
    const msg = messages.find(m => m.id === id);
    if (msg) {
      msg.processed = true;
      res.json({ status: "ok" });
    } else {
      res.status(404).json({ error: "Message not found" });
    }
  });

  // API to send a message via WhatsApp
  app.post("/api/whatsapp/send", async (req, res) => {
    const { to, text } = req.body;

    if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return res.status(500).json({ error: "WhatsApp credentials not configured" });
    }

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      console.error("Error sending WhatsApp message:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // --- STRIPE BILLING ---

  app.post("/api/stripe/checkout", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const { planName, priceId, amount } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `atendemosWhats - ${planName}`,
              },
              unit_amount: amount * 100, // in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL || "http://localhost:3000"}/dashboard?success=true`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/pricing?canceled=true`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error.message);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // --- VITE MIDDLEWARE ---

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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
