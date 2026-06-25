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

// Persistent Debug Logging Helper
function logDebug(message: string) {
  const logPath = path.join(DATA_DIR, "sync_debug.log");
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`, "utf8");
    console.log(`[DEBUG] ${message}`);
  } catch (err) {
    console.error("Failed to write to sync_debug.log:", err);
  }
}

// Helper to write to Firestore via REST API
async function saveToFirestoreREST(codigo: string, dados: any): Promise<boolean> {
  try {
    logDebug(`Iniciando salvamento no Firestore via REST para: ${codigo}. Tamanho do payload: ${JSON.stringify(dados).length} caracteres.`);
    const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(firebaseConfigPath)) {
      logDebug("[Firestore REST API] firebase-applet-config.json não localizado.");
      return false;
    }
    
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/frotas/${codigo}?key=${config.apiKey}`;
    
    const body = {
      name: `projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/frotas/${codigo}`,
      fields: {
        dados: {
          stringValue: JSON.stringify(dados)
        },
        updatedAt: {
          stringValue: new Date().toISOString()
        }
      }
    };

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      logDebug(`[Firestore REST API] Falha ao salvar para ${codigo}. Status HTTP: ${res.status}, Erro: ${errText}`);
      return false;
    }

    logDebug(`[Firestore REST API] Sincronização gravada com sucesso para: ${codigo}`);
    return true;
  } catch (error: any) {
    logDebug(`[Firestore REST API] Erro na requisição de salvamento para ${codigo}: ${error.stack || error}`);
    return false;
  }
}

// Helper to read from Firestore via REST API
async function loadFromFirestoreREST(codigo: string): Promise<any | null> {
  try {
    logDebug(`Iniciando carregamento do Firestore via REST para: ${codigo}`);
    const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(firebaseConfigPath)) {
      logDebug("[Firestore REST API] firebase-applet-config.json não localizado.");
      return null;
    }
    
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/frotas/${codigo}?key=${config.apiKey}`;
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (res.status === 404) {
      logDebug(`[Firestore REST API] Código ${codigo} não localizado (404).`);
      return null;
    }

    if (!res.ok) {
      const errText = await res.text();
      logDebug(`[Firestore REST API] Falha ao ler de ${codigo}. Status HTTP: ${res.status}, Erro: ${errText}`);
      return null;
    }

    const docData = await res.json();
    if (docData && docData.fields && docData.fields.dados && docData.fields.dados.stringValue) {
      logDebug(`[Firestore REST API] Dados carregados com sucesso para a frota: ${codigo}`);
      return JSON.parse(docData.fields.dados.stringValue);
    }
    
    logDebug(`[Firestore REST API] Documento para ${codigo} localizado, mas campos 'dados' ou 'stringValue' estão ausentes.`);
    return null;
  } catch (error: any) {
    logDebug(`[Firestore REST API] Erro na requisição de carregamento para ${codigo}: ${error.stack || error}`);
    return null;
  }
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
  app.post("/api/sync/save", async (req, res) => {
    try {
      const { codigoFrota, dados } = req.body;
      if (!codigoFrota) {
        return res.status(400).json({ success: false, error: "Código da frota é obrigatório." });
      }
      if (!dados) {
        return res.status(400).json({ success: false, error: "Nenhum dado recebido para sincronização." });
      }

      // Sanitizar o código da frota
      const safeCodigo = codigoFrota.trim().toUpperCase().replace(/[^a-zA-Z0-9_-]/g, "");
      if (!safeCodigo) {
        return res.status(400).json({ success: false, error: "Código da frota inválido." });
      }

      // Gravar no Firestore (Nuvem Real e Durável via REST API)
      const savedToCloud = await saveToFirestoreREST(safeCodigo, dados);

      // Sempre grava localmente também para redundância e cache local
      try {
        const filePath = path.join(DATA_DIR, `frota_${safeCodigo}.json`);
        fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), "utf8");
      } catch (cacheErr) {
        console.warn("Aviso: Falha ao gravar cache local no servidor:", cacheErr);
      }

      // Atualizar o registro central geral no Firestore para permitir recuperação fácil por lista
      if (savedToCloud && safeCodigo !== "_REGISTRY") {
        try {
          const registry = await loadFromFirestoreREST("_REGISTRY") || { frotas: [] };
          if (!registry.frotas) registry.frotas = [];
          
          const nomeEmpresa = dados.nomeEmpresa || "";
          const existingIndex = registry.frotas.findIndex((f: any) => f.codigo === safeCodigo);
          
          const entry = {
            codigo: safeCodigo,
            nomeEmpresa: nomeEmpresa,
            updatedAt: new Date().toISOString()
          };
          
          if (existingIndex > -1) {
            registry.frotas[existingIndex] = entry;
          } else {
            registry.frotas.push(entry);
          }
          
          await saveToFirestoreREST("_REGISTRY", registry);
        } catch (regErr) {
          console.error("Erro ao atualizar registro geral de frotas:", regErr);
        }
      }

      // Salvar código ativo no servidor de forma persistente
      try {
        fs.writeFileSync(path.join(DATA_DIR, "active_code.txt"), safeCodigo, "utf8");
      } catch (err) {
        console.error("Erro ao salvar active_code.txt:", err);
      }

      if (!savedToCloud) {
        return res.status(500).json({
          success: false,
          error: "Falha ao gravar os dados na nuvem (Firestore). Por favor, verifique a chave de API ou se os dados estão corretos."
        });
      }

      res.json({ 
        success: true, 
        message: "Dados sincronizados com a nuvem (Firestore) com sucesso!"
      });
    } catch (error: any) {
      console.error("Erro ao salvar sincronização:", error);
      res.status(500).json({ success: false, error: error.message || "Erro ao salvar dados no servidor." });
    }
  });

  // Endpoint para obter a lista de todas as frotas registradas na nuvem
  app.get("/api/sync/fleets", async (req, res) => {
    try {
      const registry = await loadFromFirestoreREST("_REGISTRY");
      const frotas = registry && registry.frotas ? registry.frotas : [];
      res.json({ success: true, frotas });
    } catch (error: any) {
      console.error("Erro ao carregar lista de frotas:", error);
      res.status(500).json({ success: false, error: error.message || "Erro ao carregar lista de frotas." });
    }
  });

  // Endpoint para recuperar o código de frota ativo salvo no servidor
  app.get("/api/sync/active-code", async (req, res) => {
    try {
      const filePath = path.join(DATA_DIR, "active_code.txt");
      if (fs.existsSync(filePath)) {
        const codigoFrota = fs.readFileSync(filePath, "utf8").trim();
        if (codigoFrota) {
          return res.json({ success: true, codigoFrota });
        }
      }

      // Fallback robusto: carregar o registro central e obter a última frota atualizada
      console.log("[Active Code API] Arquivo active_code.txt não existe ou está vazio. Buscando última frota no _REGISTRY...");
      const registry = await loadFromFirestoreREST("_REGISTRY");
      if (registry && Array.isArray(registry.frotas) && registry.frotas.length > 0) {
        // Ordena por updatedAt decrescente
        const sorted = [...registry.frotas].sort((a: any, b: any) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        });

        const ultimaFrota = sorted[0].codigo;
        console.log("[Active Code API] Retornando última frota ativa do registro central:", ultimaFrota);

        // Grava de volta localmente para cache
        try {
          fs.writeFileSync(filePath, ultimaFrota, "utf8");
        } catch (err) {
          console.warn("[Active Code API] Falha ao salvar active_code.txt:", err);
        }

        return res.json({ success: true, codigoFrota: ultimaFrota });
      }

      res.json({ success: true, codigoFrota: null });
    } catch (error: any) {
      console.error("Erro ao obter código ativo:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Endpoint para Sincronização em Nuvem - Carregar Dados
  app.get("/api/sync/load/:codigo", async (req, res) => {
    try {
      const { codigo } = req.params;
      if (!codigo) {
        return res.status(400).json({ success: false, error: "Código da frota é obrigatório." });
      }

      const safeCodigo = codigo.trim().toUpperCase().replace(/[^a-zA-Z0-9_-]/g, "");
      if (!safeCodigo) {
        return res.status(400).json({ success: false, error: "Código da frota inválido." });
      }

      // Carregar do Firestore (Nuvem Real e Durável via REST API)
      const dadosNuvem = await loadFromFirestoreREST(safeCodigo);
      if (dadosNuvem) {
        // Salvar como código ativo no servidor
        try {
          fs.writeFileSync(path.join(DATA_DIR, "active_code.txt"), safeCodigo, "utf8");
        } catch (err) {
          console.error("Erro ao salvar active_code.txt:", err);
        }

        return res.json({ success: true, dados: dadosNuvem });
      }

      // Fallback em disco local
      const filePath = path.join(DATA_DIR, `frota_${safeCodigo}.json`);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: "Código de frota não encontrado na nuvem ou no servidor." });
      }

      const dataStr = fs.readFileSync(filePath, "utf8");
      const dados = JSON.parse(dataStr);

      // Salvar como código ativo no servidor
      try {
        fs.writeFileSync(path.join(DATA_DIR, "active_code.txt"), safeCodigo, "utf8");
      } catch (err) {
        console.error("Erro ao salvar active_code.txt:", err);
      }

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
