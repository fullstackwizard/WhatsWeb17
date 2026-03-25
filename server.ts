import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import Stripe from "stripe";
import dotenv from "dotenv";
import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  ConnectionState
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import pino from "pino";

import { GoogleGenAI } from "@google/genai";

import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "clients_data.json");

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    clients: [
      { id: '1', name: 'Imobiliária Silva', prompt: 'Você é um assistente virtual da Imobiliária Silva. Seja cordial, ajude a qualificar leads interessados em comprar ou alugar imóveis. Pergunte o nome, telefone e que tipo de imóvel procuram.' },
      { id: '2', name: 'Dr. Marcos (Dentista)', prompt: 'Você é a secretária virtual do Dr. Marcos. Ajude os pacientes a agendarem consultas. Pergunte o nome, o motivo da consulta e sugira horários comerciais.' }
    ],
    flows: [
      { id: '1', name: 'Boas-vindas & Qualificação', clientId: '1', triggers: 'Oi, Olá', status: 'Ativo' },
      { id: '2', name: 'Agendamento de Consulta', clientId: '2', triggers: 'Agendar', status: 'Ativo' }
    ],
    team: [
      { id: '1', name: 'Flávio Ribeiro', role: 'Admin', email: 'flavio@vendedor.com', status: 'Online' }
    ],
    activeClientId: '1'
  }));
}

function getStoredData() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  // Ensure all collections exist
  if (!data.clients) data.clients = [];
  if (!data.flows) data.flows = [];
  if (!data.team) data.team = [];
  return data;
}

function updateStoredData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// --- WHATSAPP MULTI-SESSION MANAGER ---

interface WhatsAppSession {
  sock: any;
  qr: string | null;
  status: "connecting" | "open" | "close" | "qr";
  clientId: string;
}

const sessions: Record<string, WhatsAppSession> = {};
const messages: any[] = [];

async function getAIResponse(text: string, clientContext: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return "Erro de configuração: Chave de API não encontrada. Por favor, configure a GEMINI_API_KEY nos segredos.";
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3.1-flash-lite-preview"; 
    
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `Pergunta do Cliente: ${text}` }]
        }
      ],
      config: {
        systemInstruction: `Você é um assistente de atendimento via WhatsApp para a empresa com o seguinte contexto: ${clientContext}. Responda de forma curta, objetiva e amigável. Use emojis moderadamente. Não invente informações que não estão no contexto.`,
      }
    });
    
    if (!response.text) {
      console.error("Gemini returned empty response text. Full response:", JSON.stringify(response));
      return "Desculpe, não consegui processar sua mensagem agora. Pode tentar novamente?";
    }
    
    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error details:", {
      message: error.message,
      stack: error.stack,
      clientContextLength: clientContext?.length,
      textLength: text?.length,
      model: "gemini-3.1-flash-lite-preview"
    });
    
    // Fallback to a simpler call if systemInstruction fails or model is not found
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Contexto: ${clientContext}\n\nPergunta: ${text}`,
        });
        return fallbackResponse.text || "Desculpe, estou passando por uma manutenção técnica.";
      }
    } catch (fallbackError) {
      console.error("Fallback Gemini API Error:", fallbackError);
    }

    return "Desculpe, estou passando por uma manutenção técnica. Poderia repetir em instantes?";
  }
}

async function connectClient(clientId: string) {
  const authFolder = `auth_info_client_${clientId}`;
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();
  
  console.log(`[Client ${clientId}] Initializing WhatsApp session...`);

  // Cleanup existing session if any
  if (sessions[clientId]?.sock) {
    try { sessions[clientId].sock.ev.removeAllListeners(); } catch (e) {}
  }

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    logger: pino({ level: 'silent' }),
  });

  sessions[clientId] = {
    sock,
    qr: null,
    status: "connecting",
    clientId
  };

  sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      sessions[clientId].qr = await QRCode.toDataURL(qr);
      sessions[clientId].status = "qr";
      console.log(`[Client ${clientId}] QR Code generated.`);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`[Client ${clientId}] Connection closed. Reconnecting: ${shouldReconnect}`);
      
      sessions[clientId].status = "close";
      sessions[clientId].qr = null;

      if (shouldReconnect) {
        connectClient(clientId);
      } else {
        // Logged out - cleanup
        delete sessions[clientId];
        if (fs.existsSync(authFolder)) {
          fs.rmSync(authFolder, { recursive: true, force: true });
        }
      }
    } else if (connection === 'open') {
      console.log(`[Client ${clientId}] Connection opened successfully.`);
      sessions[clientId].status = "open";
      sessions[clientId].qr = null;
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m: any) => {
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        if (!msg.key.fromMe && msg.message) {
          const from = msg.key.remoteJid;
          const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
          
          if (text) {
            console.log(`[Client ${clientId}] Message from ${from}: ${text}`);
            
            const data = getStoredData();
            // Ensure we match the ID as a string
            const client = data.clients.find((c: any) => c.id.toString() === clientId.toString());
            
            if (client) {
              console.log(`[Client ${clientId}] Found client context: ${client.name}`);
              const aiResponse = await getAIResponse(text, client.prompt);
              
              if (aiResponse && sessions[clientId]?.sock) {
                await sessions[clientId].sock.sendMessage(from, { text: aiResponse });
                console.log(`[Client ${clientId}] Sent AI response to ${from}`);
              }
            } else {
              console.warn(`[Client ${clientId}] Client not found in data for message processing`);
            }
          }
        }
      }
    }
  });
}

// Auto-reconnect existing sessions on startup
const initialData = getStoredData();
initialData.clients.forEach((client: any) => {
  const authFolder = `auth_info_client_${client.id}`;
  if (fs.existsSync(authFolder)) {
    connectClient(client.id);
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- CLIENTS API ---

  app.get("/api/clients", (req, res) => {
    const data = getStoredData();
    // Enrich clients with their connection status
    const enrichedClients = data.clients.map((client: any) => ({
      ...client,
      status: sessions[client.id]?.status || "close",
      qr: sessions[client.id]?.qr || null
    }));
    res.json({ ...data, clients: enrichedClients });
  });

  app.post("/api/clients", (req, res) => {
    const { name, prompt, whatsappToken, whatsappPhoneNumberId, whatsappVerifyToken } = req.body;
    const data = getStoredData();
    const newClient = {
      id: Date.now().toString(),
      name,
      prompt,
      whatsappToken,
      whatsappPhoneNumberId,
      whatsappVerifyToken
    };
    data.clients.push(newClient);
    updateStoredData(data);
    res.json(newClient);
  });

  app.put("/api/clients/:id", (req, res) => {
    const { id } = req.params;
    const { name, prompt, whatsappToken, whatsappPhoneNumberId, whatsappVerifyToken } = req.body;
    const data = getStoredData();
    const index = data.clients.findIndex((c: any) => c.id === id);
    if (index !== -1) {
      data.clients[index] = { 
        ...data.clients[index], 
        name, 
        prompt,
        whatsappToken,
        whatsappPhoneNumberId,
        whatsappVerifyToken
      };
      updateStoredData(data);
      res.json(data.clients[index]);
    } else {
      res.status(404).json({ error: "Client not found" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    const { id } = req.params;
    const data = getStoredData();
    const index = data.clients.findIndex((c: any) => c.id === id);
    
    if (index !== -1) {
      // Logout session if active
      if (sessions[id]?.sock) {
        try { await sessions[id].sock.logout(); } catch (e) {}
      }
      
      data.clients.splice(index, 1);
      // Also delete associated flows
      data.flows = data.flows.filter((f: any) => f.clientId !== id);
      
      updateStoredData(data);
      
      // Cleanup auth folder
      const authFolder = `auth_info_client_${id}`;
      if (fs.existsSync(authFolder)) {
        fs.rmSync(authFolder, { recursive: true, force: true });
      }
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Client not found" });
    }
  });

  // --- FLOWS API ---

  app.get("/api/flows", (req, res) => {
    const data = getStoredData();
    res.json(data.flows);
  });

  app.post("/api/flows", (req, res) => {
    const { name, clientId, triggers, status } = req.body;
    const data = getStoredData();
    const newFlow = {
      id: Date.now().toString(),
      name,
      clientId,
      triggers,
      status: status || 'Ativo'
    };
    data.flows.push(newFlow);
    updateStoredData(data);
    res.json(newFlow);
  });

  app.put("/api/flows/:id", (req, res) => {
    const { id } = req.params;
    const { name, clientId, triggers, status } = req.body;
    const data = getStoredData();
    const index = data.flows.findIndex((f: any) => f.id === id);
    if (index !== -1) {
      data.flows[index] = { ...data.flows[index], name, clientId, triggers, status };
      updateStoredData(data);
      res.json(data.flows[index]);
    } else {
      res.status(404).json({ error: "Flow not found" });
    }
  });

  app.delete("/api/flows/:id", (req, res) => {
    const { id } = req.params;
    const data = getStoredData();
    data.flows = data.flows.filter((f: any) => f.id !== id);
    updateStoredData(data);
    res.json({ success: true });
  });

  // --- TEAM API ---

  app.get("/api/team", (req, res) => {
    const data = getStoredData();
    res.json(data.team);
  });

  app.post("/api/team", (req, res) => {
    const { name, role, email, status } = req.body;
    const data = getStoredData();
    const newMember = {
      id: Date.now().toString(),
      name,
      role,
      email,
      status: status || 'Online'
    };
    data.team.push(newMember);
    updateStoredData(data);
    res.json(newMember);
  });

  app.put("/api/team/:id", (req, res) => {
    const { id } = req.params;
    const { name, role, email, status } = req.body;
    const data = getStoredData();
    const index = data.team.findIndex((t: any) => t.id === id);
    if (index !== -1) {
      data.team[index] = { ...data.team[index], name, role, email, status };
      updateStoredData(data);
      res.json(data.team[index]);
    } else {
      res.status(404).json({ error: "Team member not found" });
    }
  });

  app.delete("/api/team/:id", (req, res) => {
    const { id } = req.params;
    const data = getStoredData();
    data.team = data.team.filter((t: any) => t.id !== id);
    updateStoredData(data);
    res.json({ success: true });
  });

  // --- WHATSAPP CONTROL API ---
  
  app.post("/api/whatsapp/connect/:clientId", async (req, res) => {
    const { clientId } = req.params;
    console.log(`[API] Connection request for client ${clientId}`);
    
    if (sessions[clientId]?.status === "open") {
      return res.status(400).json({ error: "Already connected" });
    }
    
    await connectClient(clientId);
    
    // Wait a bit for QR to be generated if it's a new session
    let attempts = 0;
    while (attempts < 10) {
      const s = sessions[clientId];
      if (!s || s.qr || s.status === 'open') break;
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    res.json({ 
      status: sessions[clientId]?.status || "initializing",
      qr: sessions[clientId]?.qr || null
    });
  });

  app.post("/api/whatsapp/logout/:clientId", async (req, res) => {
    const { clientId } = req.params;
    if (sessions[clientId]?.sock) {
      try {
        await sessions[clientId].sock.logout();
        // The connection.update 'close' event will handle the rest
        res.json({ status: "logging_out" });
      } catch (e) {
        console.error(`Logout error for client ${clientId}:`, e);
        res.status(500).json({ error: "Failed to logout" });
      }
    } else {
      res.status(400).json({ error: "No active session" });
    }
  });

  // Support for GET /api/whatsapp/connect/:clientId for backward compatibility or simple triggers
  app.get("/api/whatsapp/connect/:clientId", async (req, res) => {
    const { clientId } = req.params;
    await connectClient(clientId);
    
    let attempts = 0;
    while (!sessions[clientId]?.qr && attempts < 10 && sessions[clientId]?.status !== 'open') {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    res.json({ 
      status: sessions[clientId]?.status || "initializing",
      qr: sessions[clientId]?.qr || null
    });
  });

  // Support for GET /api/whatsapp/disconnect/:clientId
  app.get("/api/whatsapp/disconnect/:clientId", async (req, res) => {
    const { clientId } = req.params;
    if (sessions[clientId]?.sock) {
      try {
        await sessions[clientId].sock.logout();
        res.json({ status: "logging_out" });
      } catch (e) {
        res.status(500).json({ error: "Failed to logout" });
      }
    } else {
      res.status(400).json({ error: "No active session" });
    }
  });

  app.get("/api/whatsapp/status/:clientId", (req, res) => {
    const { clientId } = req.params;
    const session = sessions[clientId];
    res.json({
      status: session?.status || "close",
      qr: session?.qr || null
    });
  });

  // --- DEBUG & META WEBHOOKS (KEEPING FOR BACKWARD COMPATIBILITY) ---

  // Debug endpoint to check configuration status (without leaking secrets)
  app.get("/api/debug/whatsapp", (req, res) => {
    const data = getStoredData();
    const enrichedClients = data.clients.map((client: any) => ({
      ...client,
      status: sessions[client.id]?.status || "close",
      qr: sessions[client.id]?.qr || null
    }));

    res.json({
      tokenSet: !!process.env.WHATSAPP_TOKEN,
      phoneNumberIdSet: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      verifyTokenSet: !!process.env.WHATSAPP_VERIFY_TOKEN,
      geminiKeySet: !!process.env.GEMINI_API_KEY,
      appUrl: process.env.APP_URL || "Not set",
      nodeEnv: process.env.NODE_ENV || "development",
      clients: enrichedClients
    });
  });

  // Verification (Meta requires this to enable the webhook)
  app.get("/api/webhook/whatsapp", (req, res) => {
    console.log("Received WhatsApp Webhook Verification Request:", req.query);
    
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
    const receivedToken = typeof token === 'string' ? token.trim() : token;

    console.log("Verification Attempt:", {
      mode,
      receivedTokenLength: receivedToken?.length || 0,
      expectedTokenLength: expectedToken?.length || 0,
      match: receivedToken === expectedToken
    });

    if (mode === "subscribe" && receivedToken === expectedToken && expectedToken) {
      console.log("WEBHOOK_VERIFIED SUCCESS");
      res.status(200).send(challenge);
    } else {
      console.error("WEBHOOK_VERIFICATION_FAILED", {
        received: receivedToken,
        expected: expectedToken ? "REDACTED" : "NOT_SET",
        match: receivedToken === expectedToken
      });
      res.status(403).send(`Verification failed. Check your WHATSAPP_VERIFY_TOKEN in Secrets.`);
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
