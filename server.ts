import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set body parser limits to support larger base64 images
  app.use(express.json({ limit: "15mb" }));

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
            }
          ]
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
