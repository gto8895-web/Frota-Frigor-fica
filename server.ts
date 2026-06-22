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

  // End point para OCR de placas de veículos ao vivo (suporta imagem cortada de alta definição)
  app.post("/api/ocr-plate", async (req, res) => {
    try {
      const { image, croppedImage, registeredPlates } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Nenhuma imagem foi recebida." });
      }

      const ai = getAiClient();
      const parts = [];

      // 1. Adicionar imagem aproximada cortada (melhor foco) se houver
      if (croppedImage) {
        const base64Cropped = croppedImage.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: {
            data: base64Cropped,
            mimeType: "image/jpeg"
          }
        });
      }

      // 2. Adicionar imagem panorâmica original de contexto
      const base64Full = image.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          data: base64Full,
          mimeType: "image/jpeg"
        }
      });

      // 3. Montar contexto de frotas e regras do Brasil
      const platesListStr = registeredPlates && Array.isArray(registeredPlates) && registeredPlates.length > 0
        ? `Você tem uma lista de placas reais da frota de veículos cadastrados: [${registeredPlates.join(", ")}]. ` +
          "O veículo sob a câmera deve preferencialmente pertencer a essa lista! " +
          "Sua prioridade máxima é identificar se os caracteres extraídos se assemelham visualmente ou correspondem de perto a alguma dessas placas reais, " +
          "corrigindo distorções ópticas normais de câmeras mobile, reflexos de alumínio ou erros comuns de OCR (por exemplo, confundir a letra 'O' com '0', 'Q' com '0', 'I' ou 'L' com '1', 'B' com '8', 'S' com '5', 'G' com '6', ou vice-versa). " +
          "Se houver uma combinação muito próxima na lista (ex: leu 'ABC1O23' mas existe 'ABC1023' ou 'ABC1D23' na lista), você DEVE retornar o texto exato da placa cadastrada compatível com a imagem. "
        : "";

      const promptText = 
        "Você é um classificador, leitor óptico e especialista de altíssima precisão em placas de veículos brasileiras, atualizado de acordo com a Resolução 969/2022 do Contran.\n" +
        "Você está analisando imagens de uma câmera (uma ampliada ou focada e outra de contexto ampio, dependendo do envio).\n" +
        "Sua missão é extrair com precisão absoluta os caracteres da placa do veículo brasileiro.\n\n" +
        "CONCORRÊNCIA E REGRAS DE SINTAXE OFICIAIS DO BRASIL:\n" +
        "1. PADRÃO MERCOSUL ATUAL (Formatado como LLLNLNN - Letra, Letra, Letra, Número, Letra, Número, Número):\n" +
        "   - Posições 1, 2 e 3: OBRIGATORIAMENTE LETRAS (A-Z).\n" +
        "   - Posição 4: OBRIGATORIAMENTE NÚMERO (0-9).\n" +
        "   - Posição 5: OBRIGATORIAMENTE LETRA (A-Z).\n" +
        "   - Posições 6 e 7: OBRIGATORIAMENTE NÚMEROS (0-9).\n" +
        "   - Exemplo técnico: 'ABC1D23'.\n" +
        "2. PADRÃO ANTIGO CINZA (Formatado como LLLNNNN - Letra, Letra, Letra, Número, Número, Número, Número):\n" +
        "   - Posições 1, 2 e 3: OBRIGATORIAMENTE LETRAS (A-Z).\n" +
        "   - Posições 4, 5, 6 e 7: OBRIGATORIAMENTE NÚMEROS (0-9).\n" +
        "   - Exemplo técnico: 'ABC1234'.\n\n" +
        "DICA DE CONTEXTO TÉCNICO VINCULADO ÀS CORES DOS CARACTERES NO PADRÃO MERCOSUL (Fundo Branco com Faixa Azul Superior):\n" +
        "- Letras/Números Pretos: Veículo Particular.\n" +
        "- Letras/Números Vermelhos: Veículo Comercial / Aluguel (táxis, ônibus, transporte de cargas, autoescola).\n" +
        "- Letras/Números Azuis: Veículo Oficial / Especial d'Estado.\n" +
        "- Letras/Números Verdes: Veículo de Fabricante / Experiência / Testagem.\n" +
        "- Letras/Números Dourados: Veículo Diplomático / Consular.\n" +
        "- Letras/Números Brancos (sob placa de fundo preto): Veículo de Colecionador.\n" +
        "Use essas cores e contraste para auxiliar na correta detecção e decodificação óptica de caracteres desbotados ou com ruídos de sombra.\n\n" +
        "INSTRUÇÕES CRÍTICAS DE OCR:\n" +
        "- Observe estritamente as regras de posições correspondentes de letras e números para desfazer ambiguidades visuais comuns na imagem:\n" +
        "  * Se precisar de um NÚMERO na posição mas o caractere parecer um 'O', 'Q', 'D', 'U' ou 'G', decodifique como '0' (zero).\n" +
        "  * Se precisar de um NÚMERO na posição mas parecer um 'I', 'L', 'T' ou '|', decodifique como '1' (um).\n" +
        "  * Se precisar de um NÚMERO na posição mas parecer um 'B', decodifique como '8' (oito).\n" +
        "  * Se precisar de um NÚMERO na posição mas parecer um 'S', decodifique como '5' (cinco).\n" +
        "  * Se precisar de uma LETRA na posição mas o caractere parecer um '0' (zero), decodifique como 'O' (letra O).\n" +
        "  * Se precisar de uma LETRA na posição mas parecer um '1' (um), decodifique como 'I' ou 'L' (letras I ou L).\n" +
        "  * Se precisar de uma LETRA na posição mas parecer um '8' (oito), decodifique como 'B' (letra B).\n" +
        "  * Se precisar de uma LETRA na posição mas parecer um '5' (cinco), decodifique como 'S' (letra S).\n" +
        "  * Se precisar de uma LETRA na posição mas parecer um '2' (dois), decodifique como 'Z' (letra Z).\n" +
        "  * Se precisar de uma LETRA na posição mas parecer um '6' ou '9' (seis/nove), decodifique como 'G' (letra G).\n" +
        platesListStr + "\n" +
        "FORMA DE RETORNO:\n" +
        "- Retorne APENAS a placa final identificada em LETRAS MAIÚSCULAS limpas, sem emojis, sem espaços, hifens, parênteses ou textos adicionais.\n" +
        "  Exemplo: ABC1D23 ou XYZ9876.\n" +
        "- Se não conseguir encontrar absolutamente nenhuma placa visível ou legível nas fotos sob nenhum padrão acima de forma confiável, responda estritamente 'NOT_FOUND'.";

      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: parts
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
