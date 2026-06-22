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

  // End point para OCR de placas de veículos ao vivo
  app.post("/api/ocr-plate", async (req, res) => {
    try {
      const { image, registeredPlates } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Nenhuma imagem foi recebida." });
      }

      // Remover prefixo de dados da URL base64 se presente
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

      const ai = getAiClient();
      
      const platesListStr = registeredPlates && Array.isArray(registeredPlates) && registeredPlates.length > 0
        ? `Você tem uma lista de placas cadastradas de veículos da frota real: [${registeredPlates.join(", ")}]. ` +
          "Sua principal missão é identificar visualmente se a placa na imagem se assemelha ou corresponde à alguma desta lista, mesmo " +
          "que haja uma leve imperfeição ou distorção visual na câmera (como confundir a letra 'O' com '0', 'I' ou 'L' com '1', 'B' com '8', etc.). " +
          "Se houver uma combinação muito próxima com uma placa cadastrada da frota, você DEVE retornar exatamente o texto da placa cadastrada. "
        : "";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
              },
            },
            {
              text: "Você é um classificador e leitor óptico especializado em OCR de placas de veículos de alta precisão. " +
                    "Analise a imagem da câmera e extraia os caracteres da placa do veículo brasileiro. " +
                    "A placa pode estar no padrão antigo cinza (exemplo: 'ABC1234' ou 'ABC-1234') ou no padrão Mercosul (exemplo: 'ABC1D23'). " +
                    platesListStr +
                    "Retorne como resultado APENAS a placa identificada em letras maiúsculas, sem hífen, espaços, traços ou qualquer outro tipo de texto. " +
                    "Exemplo de saída correta: 'ABC1D23'. " +
                    "Se você não encontrar absolutamente nenhuma placa de veículo na imagem que pareça legível, retorne exatamente 'NOT_FOUND'.",
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
