import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Ensure the persistent data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set body parser limits to support larger base64 images and full sync payloads
  app.use(express.json({ limit: "15mb" }));

  // Allow CORS requests (such as from Vercel deployments)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  let aiClient: GoogleGenAI | null = null;
  function getAiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("A chave de API GEMINI_API_KEY não foi configurada na aba Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Endpoint para Sincronização em Nuvem - Gravar Dados
  app.post("/api/sync/save", (req, res) => {
    try {
      const { codigoFrota, dados } = req.body;
      if (!codigoFrota) {
        return res.status(400).json({ success: false, error: "Código da frota é obrigatório." });
      }
      if (!dados) {
        return res.status(400).json({ success: false, error: "Nenhum dado recebido para sincronização." });
      }

      // Sanitizar o código da frota para evitar path traversal
      const safeCodigo = codigoFrota.replace(/[^a-zA-Z0-9_-]/g, "");
      if (!safeCodigo) {
        return res.status(400).json({ success: false, error: "Código da frota inválido." });
      }

      const filePath = path.join(DATA_DIR, `frota_${safeCodigo}.json`);
      fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), "utf8");

      res.json({ success: true, message: "Dados sincronizados com a nuvem com sucesso!" });
    } catch (error: any) {
      console.error("Erro ao salvar sincronização:", error);
      res.status(500).json({ success: false, error: error.message || "Erro ao salvar dados no servidor." });
    }
  });

  // Endpoint para Sincronização em Nuvem - Carregar Dados
  app.get("/api/sync/load/:codigo", (req, res) => {
    try {
      const { codigo } = req.params;
      if (!codigo) {
        return res.status(400).json({ success: false, error: "Código da frota é obrigatório." });
      }

      const safeCodigo = codigo.replace(/[^a-zA-Z0-9_-]/g, "");
      const filePath = path.join(DATA_DIR, `frota_${safeCodigo}.json`);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: "Código de frota não encontrado no servidor." });
      }

      const dataStr = fs.readFileSync(filePath, "utf8");
      const dados = JSON.parse(dataStr);

      res.json({ success: true, dados });
    } catch (error: any) {
      console.error("Erro ao carregar sincronização:", error);
      res.status(500).json({ success: false, error: error.message || "Erro ao ler dados do servidor." });
    }
  });

  // End point para OCR de placas de veículos
  app.post("/api/ocr-plate", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Nenhuma imagem foi recebida." });
      }

      // Remover prefixo de dados da URL base64 se presente
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

      const ai = getAiClient();
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
              },
            },
            {
              text: "Você é um classificador especializado em OCR de placas de veículos brasileiros de alta precisão. " +
                    "Analise a imagem fornecida e extraia apenas os caracteres da placa do veículo. " +
                    "A placa pode ser no padrão antigo brasileiro (exemplo: 'ABC-1234' ou 'ABC1234') ou no padrão Mercosul (exemplo: 'ABC1D23'). " +
                    "Retorne como resultado APENAS a placa encontrada em letras maiúsculas, sem hífen, espaços, traços ou qualquer outro texto explicativo. " +
                    "Exemplo de saída correta: 'ABC1D23'. " +
                    "Se não for possível encontrar nenhuma placa legível na imagem, responda apenas 'NOT_FOUND'.",
            },
          ],
        },
      });

      const plate = response.text?.trim() || "";
      res.json({ success: true, plate });
    } catch (error: any) {
      console.error("Erro no OCR com Gemini:", error);
      res.status(500).json({ success: false, error: error.message || "Erro interno ao ler placa." });
    }
  });

  // Setup do Vite middleware em modo de desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve build estático em produção
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();
