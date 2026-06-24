import React, { useState, useEffect } from 'react';
import { Veiculo, StatusVeiculo, StatusRefrigeracao, Manutencao, Avaria } from '../types';
import { Truck, Thermometer, Radio, Plus, X, Trash2, Edit3, Settings, Save, Sparkles, Filter, Wrench, AlertCircle, Calendar, ArrowLeft, CheckCircle2, AlertTriangle, ChevronRight, Camera, RefreshCw, VideoOff, Check } from 'lucide-react';

// Helper component for Brand Logo using high-quality SVG inline
export function LogoMarca({ marca, className = "w-5 h-5 flex-shrink-0" }: { marca: string; className?: string }) {
  const normalized = (marca || '').trim().toLowerCase();

  if (normalized.includes('volkswagen') || normalized.includes('vw')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" stroke="#3b82f6" strokeWidth="2" fill="white"/>
        <path d="M6.5 7.5L10 16.5H11.5L15 7.5H13.5L11.5 13L9.5 7.5H8L10 13L12 7.5" fill="#1e3a8a" stroke="#1e3a8a" strokeWidth="0.5"/>
        <path d="M8.5 7.5L11 14.5L12 12L13 14.5L15.5 7.5" stroke="#1e3a8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  
  if (normalized.includes('volvo')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="13" r="8" stroke="#38bdf8" strokeWidth="2.5" fill="white"/>
        <line x1="16" y1="8" x2="20" y2="4" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"/>
        <line x1="16.5" y1="4" x2="20" y2="4" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"/>
        <line x1="20" y1="4" x2="20" y2="7.5" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    );
  }

  if (normalized.includes('scania')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" stroke="#ef4444" strokeWidth="2" fill="#0f172a"/>
        <circle cx="12" cy="12" r="7" fill="#1e3a8a" stroke="white" strokeWidth="0.5"/>
        <path d="M10 8.5L12 6.5L14 8.5L13 10L11 10L10 8.5Z" fill="#f59e0b"/>
      </svg>
    );
  }

  if (normalized.includes('mercedes')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
        <path d="M12 2.5V12L4.5 16.5M12 12L19.5 16.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }

  if (normalized.includes('iveco')) {
    return (
      <div className={`${className} bg-sky-600 rounded px-1 py-0.5 flex items-center justify-center font-black text-[7px] text-white tracking-tighter leading-none`}>
        IVECO
      </div>
    );
  }

  if (normalized.includes('ford')) {
    return (
      <svg className={className} viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="16" cy="8" rx="14" ry="7" fill="#1d4ed8" stroke="white" strokeWidth="1"/>
        <text x="16" y="11" fill="white" fontSize="8" fontWeight="bold" fontStyle="italic" fontFamily="serif" textAnchor="middle">Ford</text>
      </svg>
    );
  }

  if (normalized.includes('chevrolet')) {
    return (
      <svg className={className} viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3H15V6H22V10H15V13H9V10H2V6H9V3Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1"/>
      </svg>
    );
  }

  if (normalized.includes('fiat')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#b91c1c" stroke="white" strokeWidth="1"/>
        <text x="12" y="15.5" fill="white" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">FIAT</text>
      </svg>
    );
  }

  if (normalized.includes('kia')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="12" cy="12" rx="11" ry="7" fill="#c21a1a" stroke="white" strokeWidth="1"/>
        <text x="12" y="14.5" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">KIA</text>
      </svg>
    );
  }

  // Fallback icon
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

// Brazilian License Plate Component (Mercosul & Traditional styling)
export function PlacaMercosul({ placa }: { placa: string }) {
  const formatPlaca = (p: string) => {
    let text = (p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (text.length > 7) text = text.substring(0, 7);
    return text;
  };

  const placaFormatada = formatPlaca(placa);

  return (
    <div className="inline-flex flex-col w-[145px] border-2 border-blue-600 rounded-[4px] overflow-hidden bg-white shadow-md select-none">
      {/* Blue Top Band */}
      <div className="bg-[#0051A3] text-white px-2 py-0.5 flex items-center justify-between text-[7px] font-bold tracking-wider leading-none select-none h-4">
        <span className="text-[5px] text-blue-200">✨</span>
        <span className="uppercase text-[8.5px] font-sans font-extrabold tracking-widest text-center flex-1">BRASIL</span>
        <span className="text-[8.5px] leading-none">🇧🇷</span>
      </div>
      {/* Plate Body */}
      <div className="bg-white px-1 py-0 flex items-center justify-center relative h-8 border-t-2 border-blue-600">
        <span className="absolute left-1 bottom-0.5 text-[5px] text-[#0051A3] font-bold font-sans">BR</span>
        <span className="text-[21px] font-plate tracking-wider text-slate-950 leading-none relative -translate-y-[1px]">
          {placaFormatada}
        </span>
      </div>
    </div>
  );
}

// Function to dynamically load Tesseract.js script from CDN as a solid offline fallback
const carregarTesseract = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Tesseract) {
      resolve((window as any).Tesseract);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => {
      resolve((window as any).Tesseract);
    };
    script.onerror = () => reject(new Error("Não foi possível carregar o motor de OCR offline."));
    document.head.appendChild(script);
  });
};

interface VehiclesViewProps {
  veiculos: Veiculo[];
  manutencoes?: Manutencao[];
  custoPadraoDiario: number;
  onAddVehicle: (v: Omit<Veiculo, 'id'>) => void;
  onUpdateVehicle: (v: Veiculo) => void;
  onDeleteVehicle: (id: string) => void;
  onSimulateTemperatures: () => void;
  onAddMaintenance?: (m: Omit<Manutencao, 'id'>) => void;
}

export default function VehiclesView({
  veiculos,
  manutencoes = [],
  custoPadraoDiario,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onSimulateTemperatures,
  onAddMaintenance
}: VehiclesViewProps) {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [selecaoVeiculoId, setSelecaoVeiculoId] = useState<string>('todos');

  // Scanner de Placa com IA
  const [abrirScanner, setAbrirScanner] = useState<boolean>(false);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [ladoCamera, setLadoCamera] = useState<'environment' | 'user'>('environment');
  const [erroCamera, setErroCamera] = useState<string | null>(null);
  const [lendoOCR, setLendoOCR] = useState<boolean>(false);
  const [resultadoOCR, setResultadoOCR] = useState<string | null>(null);
  const [veiculoEncontrado, setVeiculoEncontrado] = useState<Veiculo | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);

  const iniciarCamera = async (facing: 'environment' | 'user', videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    
    // Parar streams anteriores de forma limpa
    if (streamRef) {
      streamRef.getTracks().forEach(track => track.stop());
    }

    try {
      setErroCamera(null);
      setStreaming(false);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = stream;
      videoEl.play();
      setStreamRef(stream);
      setStreaming(true);
    } catch (err: any) {
      console.error("Erro ao iniciar câmera:", err);
      // Fallback para qualquer câmera disponível
      if (facing === 'environment') {
        try {
          const fallbackConstraints = { video: true, audio: false };
          const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          videoEl.srcObject = stream;
          videoEl.play();
          setStreamRef(stream);
          setStreaming(true);
          return;
        } catch (fallbackErr) {
          // Ambos falharam
        }
      }
      setErroCamera("Não foi possível acessar a câmera do aparelho. Por favor, libere a permissão de câmera.");
    }
  };

  const desativarCamera = () => {
    if (streamRef) {
      streamRef.getTracks().forEach(track => track.stop());
      setStreamRef(null);
    }
    setStreaming(false);
  };

  const capturarEIdentificar = async (videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;

    try {
      setLendoOCR(true);
      setErroCamera(null);
      setResultadoOCR(null);
      setVeiculoEncontrado(null);

      // Redimensionar para evitar tamanhos de dados enormes com câmeras HD/4K de celulares
      let width = videoEl.videoWidth || 640;
      let height = videoEl.videoHeight || 480;
      const maxDimension = 800; // 800px é perfeito para o Gemini reconhecer caracteres rapidamente
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Não foi possível processar a imagem.");
      }

      ctx.drawImage(videoEl, 0, 0, width, height);
      // Compactar a qualidade da imagem para 0.80. Reduz drasticamente o tamanho do payload.
      const dataUrl = canvas.toDataURL('image/jpeg', 0.80);

      // Tentar a rota relativa primeiro (para ambientes onde o backend está rodando no mesmo host)
      let res: Response | null = null;
      let ocrSucessoServidor = false;
      let plateDetected = "";

      try {
        res = await fetch('/api/ocr-plate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image: dataUrl })
        });
        if (res && res.ok) {
          const data = await res.json();
          if (data.success) {
            plateDetected = data.plate?.trim() || "";
            ocrSucessoServidor = true;
          }
        }
      } catch (err: any) {
        console.warn("Erro ao contactar rota local, tentando fallback...", err);
      }

      // Se falhar a rota relativa (ex: no Vercel que hospeda apenas arquivos estáticos)
      // usamos o fallback do servidor ativo Cloud Run
      if (!ocrSucessoServidor) {
        const fallbackUrl = "https://ais-pre-lkj2q4yf5sic737ubj5emu-422626548998.us-west2.run.app/api/ocr-plate";
        try {
          res = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: dataUrl })
          });
          if (res && res.ok) {
            const data = await res.json();
            if (data.success) {
              plateDetected = data.plate?.trim() || "";
              ocrSucessoServidor = true;
            }
          }
        } catch (err: any) {
          console.warn("Erro no fallback de servidor, tentando OCR offline com Tesseract local...", err);
        }
      }

      // Se falhar de todas as formas o servidor (como no Vercel estático fora do ambiente ou CORS),
      // usamos o Tesseract offline no cliente de forma transparente!
      if (!ocrSucessoServidor) {
        try {
          console.log("Iniciando processamento OCR local offline com Tesseract...");
          const TesseractInstance = await carregarTesseract();
          
          // Executa o motor de OCR no próprio navegador
          const result = await TesseractInstance.recognize(dataUrl, 'eng');
          const rawText = result?.data?.text || "";
          console.log("Tesseract extraiu o texto:", rawText);

          // Regex para encontrar placas brasileiras (Mercosul ou antiga de 3 letras e 4 números)
          const regexMercosul = /[A-Z]{3}[0-9][A-Z][0-9]{2}/i;
          const regexAntiga = /[A-Z]{3}[- ]?[0-9]{4}/i;

          const textoLimpo = rawText.toUpperCase().replace(/[^A-Z0-9-]/g, ' ');
          let match = textoLimpo.match(regexMercosul);
          if (!match) {
            match = textoLimpo.match(regexAntiga);
          }

          if (match && match[0]) {
            plateDetected = match[0].replace(/[^A-Z0-9]/g, '');
            console.log("Placa encontrada pelo OCR local:", plateDetected);
            ocrSucessoServidor = true;
          } else {
            // Tenta pegar qualquer termo de 7 caracteres que se assemelhe a placa
            const palavras = rawText.toUpperCase().replace(/[^A-Z0-9]/g, ' ').split(/\s+/);
            const possivelPlaca = palavras.find(palavra => palavra.length === 7 && /[A-Z]{3}/.test(palavra));
            if (possivelPlaca) {
              plateDetected = possivelPlaca;
              console.log("Placa de 7 caracteres identificada pelo fallback:", plateDetected);
              ocrSucessoServidor = true;
            }
          }
        } catch (tessErr: any) {
          console.error("Erro no Tesseract local:", tessErr);
          throw new Error("Serviço de inteligência artificial de OCR indisponível. Erro de rede ou indisponibilidade do servidor backend.");
        }
      }

      if (!ocrSucessoServidor || plateDetected === "NOT_FOUND" || !plateDetected) {
        setResultadoOCR("Nenhuma placa de veículo identificada. Tente com outro ângulo.");
        setLendoOCR(false);
        return;
      }

      setResultadoOCR(plateDetected);

      const normalize = (str: string) => str.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const normalizedDetected = normalize(plateDetected);

      // Encontrar correspondência na lista de veículos
      const match = veiculos.find(v => {
        const normalizedV = normalize(v.placa);
        return normalizedV === normalizedDetected || 
               normalizedV.includes(normalizedDetected) || 
               normalizedDetected.includes(normalizedV);
      });

      if (match) {
        setVeiculoEncontrado(match);
        setSelecaoVeiculoId(match.id);
      } else {
        setVeiculoEncontrado(null);
      }

    } catch (err: any) {
      console.error("Erro OCR:", err);
      setErroCamera(err.message || "Erro de conexão com o servidor de IA.");
    } finally {
      setLendoOCR(false);
    }
  };

  useEffect(() => {
    if (abrirScanner && videoRef) {
      iniciarCamera(ladoCamera, videoRef);
    }
    return () => {
      desativarCamera();
    };
  }, [abrirScanner, ladoCamera, videoRef]);
  
  // Controle de cadastro
  const [mostrarForm, setMostrarForm] = useState<boolean>(false);
  
  // States do formulário de veículo
  const [marcaCaminhao, setMarcaCaminhao] = useState<string>('Volkswagen');
  const [modelo, setModelo] = useState<string>('');
  const [placa, setPlaca] = useState<string>('');
  const [ano, setAno] = useState<string | number>(String(new Date().getFullYear()));
  const [tipoRefrigeracao, setTipoRefrigeracao] = useState<string>('Thermo King T-880R');
  const [temperaturaAlvo, setTemperaturaAlvo] = useState<number>(-18);
  const [capacidadeCarga, setCapacidadeCarga] = useState<number>(10);
  const [status, setStatus] = useState<StatusVeiculo>('disponivel');
  const [compressor, setCompressor] = useState<string>('');
  const [correia, setCorreia] = useState<string>('');

  // Modo de edição
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editPlaca, setEditPlaca] = useState<string>('');
  const [editMarca, setEditMarca] = useState<string>('');
  const [editModelo, setEditModelo] = useState<string>('');
  const [editStatus, setEditStatus] = useState<StatusVeiculo>('disponivel');
  const [editUltimaManutencao, setEditUltimaManutencao] = useState<string>('');
  const [confirmDeleteVeicId, setConfirmDeleteVeicId] = useState<string | null>(null);

  // Detalhes do Veículo (Histórico e Avarias)
  const [veiculoDetalhadoId, setVeiculoDetalhadoId] = useState<string | null>(null);
  const [avariasMap, setAvariasMap] = useState<Record<string, Avaria[]>>(() => {
    try {
      const saved = localStorage.getItem('frigofrota_avarias');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [novaAvariaTexto, setNovaAvariaTexto] = useState<string>('');

  const handleAdicionarAvaria = (veiculoId: string) => {
    const texto = novaAvariaTexto.trim();
    if (!texto) return;

    const novaAvaria: Avaria = {
      id: Math.random().toString(36).substring(2, 9),
      veiculoId,
      descricao: texto,
      dataCadastrada: new Date().toLocaleDateString('pt-BR'),
      resolvido: false
    };

    const novasAvarias = {
      ...avariasMap,
      [veiculoId]: [novaAvaria, ...(avariasMap[veiculoId] || [])]
    };

    setAvariasMap(novasAvarias);
    localStorage.setItem('frigofrota_avarias', JSON.stringify(novasAvarias));
    setNovaAvariaTexto('');
  };

  const handleToggleAvaria = (veiculoId: string, avariaId: string) => {
    const listaAtualizada = (avariasMap[veiculoId] || []).map(av => 
      av.id === avariaId ? { ...av, resolvido: !av.resolvido } : av
    );

    const novasAvarias = {
      ...avariasMap,
      [veiculoId]: listaAtualizada
    };

    setAvariasMap(novasAvarias);
    localStorage.setItem('frigofrota_avarias', JSON.stringify(novasAvarias));
  };

  const handleExcluirAvaria = (veiculoId: string, avariaId: string) => {
    const listaAtualizada = (avariasMap[veiculoId] || []).filter(av => av.id !== avariaId);

    const novasAvarias = {
      ...avariasMap,
      [veiculoId]: listaAtualizada
    };

    setAvariasMap(novasAvarias);
    localStorage.setItem('frigofrota_avarias', JSON.stringify(novasAvarias));
  };

  // Lançar Manutenção Modal / Moldura
  const [modalManutencaoVeiculoId, setModalManutencaoVeiculoId] = useState<string | null>(null);
  const [textoManutencao, setTextoManutencao] = useState<string>('');
  const [opcoesPredefinidas, setOpcoesPredefinidas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('frigofrota_opcoes_manutencao');
      return saved ? JSON.parse(saved) : [
        'Troca de Correia',
        'Troca de Ventilador',
        'Carga de Gás',
        'Troca do Compressor',
        'Troca Chicote Elétrico',
        'Troca de Válvula'
      ];
    } catch {
      return [
        'Troca de Correia',
        'Troca de Ventilador',
        'Carga de Gás',
        'Troca do Compressor',
        'Troca Chicote Elétrico',
        'Troca de Válvula'
      ];
    }
  });
  const [novaOpcaoTexto, setNovaOpcaoTexto] = useState<string>('');

  const handleAdicionarOpcao = () => {
    const textoLimpo = novaOpcaoTexto.trim();
    if (!textoLimpo) return;
    if (opcoesPredefinidas.includes(textoLimpo)) {
      return;
    }
    const novasOpcoes = [...opcoesPredefinidas, textoLimpo];
    setOpcoesPredefinidas(novasOpcoes);
    localStorage.setItem('frigofrota_opcoes_manutencao', JSON.stringify(novasOpcoes));
    setNovaOpcaoTexto('');
  };

  const handleRemoverOpcao = (e: React.MouseEvent, op: string) => {
    e.stopPropagation(); // Evita ativar/remover item do texto
    const novasOpcoes = opcoesPredefinidas.filter(o => o !== op);
    setOpcoesPredefinidas(novasOpcoes);
    localStorage.setItem('frigofrota_opcoes_manutencao', JSON.stringify(novasOpcoes));
  };

  const handleSubmeter = (e: React.FormEvent) => {
    e.preventDefault();

    if (!placa.trim() || !modelo.trim()) {
      alert('Por favor, preencha a placa e o modelo do caminhão frigorífico.');
      return;
    }

    // Validação básica de placa brasileira ou Mercosul
    const plateUpper = placa.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    onAddVehicle({
      placa: plateUpper,
      marcaCaminhao,
      modelo,
      ano,
      tipoRefrigeracao: 'Thermo King T-880R',
      temperaturaAlvo: -18,
      temperaturaAtual: -18 + (Math.random() * 1.5 - 0.75), // Começa próximo ao alvo
      capacidadeCarga: 10,
      status: 'disponivel',
      statusRefrigeracao: 'ok',
      ultimaManutencao: undefined,
      compressor: compressor || 'Não informado',
      correia: correia || 'Não informado'
    });

    // Resetar campos
    setModelo('');
    setPlaca('');
    setAno(String(new Date().getFullYear()));
    setTemperaturaAlvo(-18);
    setCapacidadeCarga(10);
    setStatus('disponivel');
    setCompressor('');
    setCorreia('');
    setMostrarForm(false);
  };

  const salvarEdicaoRapida = (v: Veiculo) => {
    onUpdateVehicle({
      ...v,
      placa: editPlaca.toUpperCase(),
      marcaCaminhao: editMarca,
      modelo: editModelo,
      status: editStatus,
      statusRefrigeracao: editStatus === 'disponivel' ? 'ok' : editStatus === 'alerta' ? 'degradado' : 'falha',
      ultimaManutencao: editUltimaManutencao
    });
    setEditandoId(null);
  };

  const iniciarEdicaoRapida = (v: Veiculo) => {
    setEditandoId(v.id);
    setEditPlaca(v.placa);
    setEditMarca(v.marcaCaminhao);
    setEditModelo(v.modelo);
    setEditStatus(v.status);
    setEditUltimaManutencao(v.ultimaManutencao || '');
  };

  const abrirMolduraManutencao = (v: Veiculo) => {
    setModalManutencaoVeiculoId(v.id);
    const txt = obterTextoManutencao(v.ultimaManutencao);
    setTextoManutencao(txt === 'Nenhum registro de manutenção inserido.' ? '' : txt);
  };

  const obterDataHojeBR = () => {
    try {
      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch {
      return '20/06/2026';
    }
  };

  const obterTextoManutencao = (texto?: string) => {
    if (!texto) return 'Nenhum registro de manutenção inserido.';
    
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const brDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    
    if (isoDateRegex.test(texto) || brDateRegex.test(texto)) {
      return 'Nenhum registro de manutenção inserido.';
    }
    
    return texto;
  };

  const formatarDataBR = (dataStr?: string) => {
    if (!dataStr) return 'Nenhum registro de manutenção inserido.';
    
    const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = dataStr.match(isoDateRegex);
    if (match) {
      const [_, ano, mes, dia] = match;
      return `${dia}/${mes}/${ano}`;
    }
    
    return dataStr;
  };

  const salvarNovaManutencao = () => {
    if (!modalManutencaoVeiculoId) return;
    const v = veiculos.find(ve => ve.id === modalManutencaoVeiculoId);
    if (v) {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const dataHojeISO = `${ano}-${mes}-${dia}`;
      
      const horas = String(hoje.getHours()).padStart(2, '0');
      const minutos = String(hoje.getMinutes()).padStart(2, '0');
      const segundos = String(hoje.getSeconds()).padStart(2, '0');
      const horaHojeISO = `${horas}:${minutos}:${segundos}`;

      onUpdateVehicle({
        ...v,
        ultimaManutencao: dataHojeISO,
        status: 'manutencao' // Lançar manutenção coloca o veiculo em oficina / manutenção
      });

      if (onAddMaintenance) {
        onAddMaintenance({
          veiculoId: v.id,
          data: dataHojeISO,
          hora: horaHojeISO,
          tipo: 'preventiva',
          descricao: textoManutencao.trim() || 'Serviço de reparo de refrigeração',
          custo: custoPadraoDiario,
          responsavel: 'Oficina Central de Refrigeração',
          status: 'em_andamento'
        });
      }
    }
    setModalManutencaoVeiculoId(null);
    setTextoManutencao('');
  };

  const toggleOpcaoPredefinida = (op: string) => {
    const contem = textoManutencao.includes(op);
    if (contem) {
      let novoTexto = textoManutencao;
      if (novoTexto.includes(op + ', ')) {
        novoTexto = novoTexto.replace(op + ', ', '');
      } else if (novoTexto.includes(', ' + op)) {
        novoTexto = novoTexto.replace(', ' + op, '');
      } else if (novoTexto.includes(op + ',')) {
        novoTexto = novoTexto.replace(op + ',', '');
      } else if (novoTexto.includes(',' + op)) {
        novoTexto = novoTexto.replace(',' + op, '');
      } else {
        novoTexto = novoTexto.replace(op, '');
      }
      setTextoManutencao(novoTexto.trim());
    } else {
      const trimmed = textoManutencao.trim();
      if (!trimmed) {
        setTextoManutencao(op);
      } else if (trimmed.endsWith(',')) {
        setTextoManutencao(`${trimmed} ${op}`);
      } else {
        setTextoManutencao(`${trimmed}, ${op}`);
      }
    }
  };

  // Se o usuário selecionou um veículo para visualizar detalhes
  if (veiculoDetalhadoId) {
    const v = veiculos.find(ve => ve.id === veiculoDetalhadoId);
    if (v) {
      const avariasDaViatura = avariasMap[v.id] || [];
      const historicoManutencoes = manutencoes.filter(m => m.veiculoId === v.id);

      return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-1">
          {/* Header de Voltar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e293b]/50 p-4 rounded-2xl border border-slate-800">
            <button
              onClick={() => setVeiculoDetalhadoId(null)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold bg-[#1e293b] border border-slate-705 px-4 py-2.5 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              Voltar para Frota
            </button>
            <div className="flex items-center gap-3">
              <PlacaMercosul placa={v.placa} />
              {v.status !== 'manutencao' && v.status !== 'disponivel' && (
                <span className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider border ${
                  v.status === 'alerta' 
                    ? 'bg-yellow-950/40 border-yellow-500/30 text-yellow-400'
                    : 'bg-yellow-950/40 border-yellow-500/30 text-yellow-400'
                }`}>
                  Alerta Climatização
                </span>
              )}
            </div>
          </div>

          {/* Ficha Básica - Bento Card */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-5 shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <LogoMarca marca={v.marcaCaminhao} className="w-5 h-5 text-sky-450" />
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{v.marcaCaminhao}</p>
              </div>
              <h1 className="text-2xl font-display font-bold text-white tracking-tight">{v.modelo}</h1>
              <p className="text-xs text-slate-400 font-mono">ANO: <span className="text-white">{v.ano}</span></p>
            </div>
          </div>

          {/* Bento Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* SEÇÃO AVARIAS */}
            <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between h-fit gap-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
                      Avarias do Veículo
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Check-list de avarias físicas para controle do veículo</p>
                  </div>
                  <span className="bg-[#020617] border border-slate-800 px-2.5 py-1 rounded-lg text-xxs font-mono text-slate-350 font-bold">
                    {avariasDaViatura.filter(av => !av.resolvido).length}
                  </span>
                </div>

                {/* Formulário para inserir nova avaria */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Descreva a avaria para controle..."
                    value={novaAvariaTexto}
                    onChange={(e) => setNovaAvariaTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarAvaria(v.id);
                      }
                    }}
                    className="flex-1 bg-[#020617] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-sans"
                  />
                  <button
                    onClick={() => handleAdicionarAvaria(v.id)}
                    className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>

                {/* Lista de avarias */}
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {avariasDaViatura.length === 0 ? (
                    <div className="text-center py-10 bg-[#020617]/30 rounded-xl border border-dashed border-slate-800">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/70 mx-auto mb-2" />
                      <p className="text-xs text-slate-300 font-semibold">Sem avarias registradas para este caminhão</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">O veículo não possui danos físicos ou estéticos registrados.</p>
                    </div>
                  ) : (
                    avariasDaViatura.map(av => (
                      <div
                        key={av.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all gap-3 ${
                          av.resolvido
                            ? 'bg-slate-900/30 border-slate-800 text-slate-550 opacity-55'
                            : 'bg-[#020617]/65 border-slate-800 text-white hover:border-slate-750'
                        }`}
                      >
                        <div 
                          className="flex items-start gap-2.5 flex-1 cursor-pointer select-none"
                          onClick={() => handleToggleAvaria(v.id, av.id)}
                        >
                          <span className={`p-0.5 rounded mt-0.5 transition-colors ${
                            av.resolvido ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-350'
                          }`}>
                            <CheckCircle2 className={`w-4 h-4 ${av.resolvido ? 'opacity-100 text-emerald-500' : 'opacity-25'}`} />
                          </span>
                          <div className="space-y-0.5">
                            <p className={`text-xs font-sans leading-relaxed ${av.resolvido ? 'line-through decoration-slate-650 text-slate-500' : 'font-semibold text-slate-200'}`}>
                              {av.descricao}
                            </p>
                            <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> Registrado em {av.dataCadastrada}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleExcluirAvaria(v.id, av.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/15 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Remover Avaria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* SEÇÃO HISTÓRICO DE MANUTENÇÃO */}
            <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between h-fit gap-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Wrench className="w-4.5 h-4.5 text-sky-400" />
                      Histórico de Manutenções
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Ordens de serviço e manutenções adicionadas deste veículo</p>
                  </div>
                  <span className="bg-[#020617] border border-slate-800 px-2.5 py-1 rounded-lg text-xxs font-mono text-sky-400 font-bold">
                    {historicoManutencoes.length}
                  </span>
                </div>

                {/* Lista de manutenções */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {historicoManutencoes.length === 0 ? (
                    <div className="text-center py-10 bg-[#020617]/30 rounded-xl border border-dashed border-slate-800">
                      <Wrench className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-350 font-semibold">Nenhuma manutenção encontrada</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Nenhuma intervenção registrada para esta placa no momento.</p>
                    </div>
                  ) : (
                    historicoManutencoes.map(m => (
                      <div
                        key={m.id}
                        className="bg-[#020617]/50 border border-slate-800/80 rounded-xl p-3.5 space-y-2 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono bg-[#1e293b] border border-slate-850/40 text-sky-300 px-2 py-0.5 rounded">
                            📅 {m.data.split('-').reverse().join('/')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-250 font-sans leading-relaxed">
                          {m.descricao}
                        </p>

                        {/* Tipo e custo ocultados a pedido do usuário */}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      );
    }
  }

  // Filtrar veículos
  const veiculosFiltrados = veiculos.filter(v => {
    const passeStatus = filtroStatus === 'todos' || v.status === filtroStatus;
    const passePlaca = selecaoVeiculoId === 'todos' || v.id === selecaoVeiculoId;
    return passeStatus && passePlaca;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Frota Frigorífica Cadastrada</h2>
          <p className="text-slate-400 text-sm">Gerencie os caminhões, especificações das câmaras térmicas e calibrações de setpoint.</p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          <button
            id="btn-toggle-add-vehicle"
            onClick={() => setMostrarForm(!mostrarForm)}
            className="flex items-center gap-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer ml-auto"
          >
            {mostrarForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {mostrarForm ? 'Cancelar' : 'Novo Caminhão'}
          </button>
        </div>
      </div>

      {/* Formulário de Cadastro (Sanitizado & Design Bento) */}
      {mostrarForm && (
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 shadow-md max-w-4xl transition-all duration-200 text-slate-100">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-display font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-400" />
              Especificação de Novo Caminhão Frigorífico
            </h3>
            <button 
              id="form-close-vehicle"
              onClick={() => setMostrarForm(false)} 
              className="text-slate-400 hover:text-slate-200 rounded-lg p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmeter} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. PLACA */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Placa (Identificador)</label>
              <input
                type="text"
                maxLength={8}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm font-mono text-slate-100 uppercase focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                placeholder="Ex: FRG-2B45"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                required
              />
            </div>

            {/* 2. MARCA */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Marca (Montadora)</label>
              <select
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                value={marcaCaminhao}
                onChange={(e) => setMarcaCaminhao(e.target.value)}
              >
                <option value="Mercedes-Benz">Mercedes-Benz</option>
                <option value="Volvo">Volvo</option>
                <option value="Scania">Scania</option>
                <option value="Volkswagen">Volkswagen</option>
                <option value="Iveco">Iveco</option>
                <option value="Ford">Ford</option>
                <option value="Chevrolet">Chevrolet</option>
                <option value="Fiat">Fiat</option>
              </select>
            </div>

            {/* 3. MODELO */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Modelo / Descrição Comercial</label>
              <input
                type="text"
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                placeholder="Ex: Atego 2430 6x2"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                required
              />
            </div>

            {/* 4. ANO */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ano Fabricação</label>
              <input
                type="text"
                placeholder="Ex: 21/21 ou 2021"
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                required
              />
            </div>

            {/* 5. COMPRESSOR */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Compressor</label>
              <input
                type="text"
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                placeholder="Ex: Sanden SD7H15"
                value={compressor}
                onChange={(e) => setCompressor(e.target.value)}
                required
              />
            </div>

            {/* 6. CORREIA */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Correia</label>
              <input
                type="text"
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                placeholder="Ex: PK 1090"
                value={correia}
                onChange={(e) => setCorreia(e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
              <button
                type="button"
                id="btn-cancel-create-vehicle"
                onClick={() => setMostrarForm(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                id="btn-confirm-create-vehicle"
                className="bg-sky-400 hover:bg-sky-350 text-slate-950 font-bold text-xs px-5 py-2 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar à Frota
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Filtro por Placa de Veículo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1e293b]/70 p-4 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-300">Filtrar por Veículo (Placa):</span>
          <select
            className="bg-[#020617]/90 text-white text-sm py-2 px-3 rounded-lg border border-slate-700/80 focus:outline-none focus:border-sky-500 cursor-pointer min-w-[200px] font-sans"
            value={selecaoVeiculoId}
            onChange={(e) => setSelecaoVeiculoId(e.target.value)}
          >
            <option value="todos">Todos os Veículos</option>
            {veiculos.map(v => (
              <option key={v.id} value={v.id}>
                {v.placa} ({v.marcaCaminhao})
              </option>
            ))}
          </select>
        </div>

        {/* Botão Ler Placa por Câmera */}
        <button
          onClick={() => {
            setAbrirScanner(true);
            setResultadoOCR(null);
            setErroCamera(null);
            setVeiculoEncontrado(null);
          }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-sky-500/10 cursor-pointer shrink-0"
        >
          <Camera className="w-4 h-4 text-sky-200" />
          Ler Placa
        </button>
      </div>

      {/* Listagem de Veículos (Grid responsiva) */}
      {veiculosFiltrados.length === 0 ? (
        <div className="bg-[#1e293b] border border-slate-800 rounded-xl py-12 px-6 text-center shadow-xs">
          <Truck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-sm">Nenhum caminhão frigorífico encontrado.</p>
          <p className="text-slate-500 text-xs mt-1">Experimente limpar os filtros ou faça um novo cadastro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {veiculosFiltrados.map(v => {
            const isEditando = editandoId === v.id;

            return (
              <div 
                key={v.id}
                className={`transition-all rounded-xl border ${
                  v.status === 'manutencao'
                    ? 'border-rose-800 bg-rose-950/10'
                    : 'border-slate-800 bg-[#1e293b] hover:border-slate-700'
                } p-5 shadow-sm flex flex-col justify-between`}
              >
                <div>
                  {/* Cabeçalho do Card - Click para Detalhes */}
                  <div 
                    onClick={() => {
                      if (!isEditando) {
                        setVeiculoDetalhadoId(v.id);
                      }
                    }}
                    className={`space-y-3 ${!isEditando ? 'cursor-pointer group/header hover:opacity-95 transition-all' : ''}`}
                    title={!isEditando ? "Clique para ver Detalhes, Histórico e Avarias do Veículo" : undefined}
                  >
                    {!isEditando ? (
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Placa no formato de placa do Brasil */}
                          <PlacaMercosul placa={v.placa} />
                          
                          {/* Marca com Logo */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <LogoMarca marca={v.marcaCaminhao} className="w-4.5 h-4.5 text-sky-450" />
                            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{v.marcaCaminhao}</p>
                          </div>

                          <h4 className="font-display font-semibold text-white text-base leading-tight mt-1 group-hover/header:text-sky-355 transition-colors truncate">
                            {v.modelo}
                          </h4>
                        </div>
                        <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg p-1.5 hover:bg-sky-500/20 transition-all shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Placa</label>
                          <input
                            type="text"
                            className="bg-[#020617] border border-slate-700 rounded-lg p-1.5 w-full text-xs font-mono font-bold text-sky-400 focus:outline-none focus:border-sky-400"
                            value={editPlaca}
                            onChange={(e) => setEditPlaca(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Marca</label>
                          <input
                            type="text"
                            className="bg-[#020617] border border-slate-700 rounded-lg p-1.5 w-full text-xs text-white focus:outline-none focus:border-sky-450"
                            value={editMarca}
                            onChange={(e) => setEditMarca(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Modelo</label>
                          <input
                            type="text"
                            className="bg-[#020617] border border-slate-700 rounded-lg p-1.5 w-full text-xs text-white focus:outline-none focus:border-sky-450"
                            value={editModelo}
                            onChange={(e) => setEditModelo(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Seção Manutenção do Veículo */}
                  <div className="bg-[#020617]/50 border border-slate-800/60 rounded-xl p-3.5 my-4 space-y-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-sky-400" /> Manutenção
                      </span>
                      <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
                        {obterDataHojeBR()}
                      </span>
                    </span>

                    {!isEditando ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <textarea
                            readOnly
                            rows={3}
                            className="bg-[#020617]/40 text-slate-200 mt-1 italic font-light font-sans p-2 rounded-lg border border-slate-800 w-full resize-none focus:outline-none"
                            value={obterTextoManutencao(v.ultimaManutencao)}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => abrirMolduraManutencao(v)}
                          className="w-full flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-600 font-semibold text-white text-[11px] py-2 px-3 rounded-lg transition-all shadow-lg shadow-sky-500/10 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Lançar Manutenção
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Campo Manutenção</label>
                          <textarea
                            rows={3}
                            className="bg-[#020617] border border-slate-700 rounded-lg p-1.5 w-full text-xs text-white focus:outline-none focus:border-sky-400 font-sans"
                            value={editUltimaManutencao}
                            onChange={(e) => setEditUltimaManutencao(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer do Card */}
                <div className="border-t border-slate-800 pt-3 flex justify-end items-center mt-2 font-mono">
                  <div className="flex gap-1.5">
                    {isEditando ? (
                      <button
                        id={`btn-save-edit-${v.id}`}
                        onClick={() => salvarEdicaoRapida(v)}
                        className="p-1 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xxs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3 h-3" /> Salvar
                      </button>
                    ) : (
                      <>
                        {confirmDeleteVeicId === v.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-950/50 border border-rose-900/60 p-1 rounded-lg">
                            <span className="text-[10px] text-rose-300 font-semibold px-1">Remover frota?</span>
                            <button
                              onClick={() => {
                                onDeleteVehicle(v.id);
                                setConfirmDeleteVeicId(null);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xxs px-2 py-1 rounded cursor-pointer transition-colors"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setConfirmDeleteVeicId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xxs px-2 py-1 rounded cursor-pointer transition-colors"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              id={`btn-init-edit-${v.id}`}
                              onClick={() => iniciarEdicaoRapida(v)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 rounded-lg hover:border-slate-600 border border-slate-700 transition-colors cursor-pointer"
                              title="Editar veículo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-vehicle-${v.id}`}
                              onClick={() => setConfirmDeleteVeicId(v.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-450 text-slate-300 rounded-lg hover:border-rose-900 border border-slate-700 transition-colors cursor-pointer"
                              title="Excluir caminhão"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Nota Operacional */}
      <div className="py-3 px-1 text-xs text-slate-300 flex items-start gap-2.5 select-none mt-4">
        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-400 block pb-0.5">Dica de Sensor de Climatização:</span>
          Filtre por <strong>"Câmaras em Alerta"</strong> para avaliar veículos que necessitam de intervenção rápida. Caminhões com desvio acima de 3°C da temperatura planejada alteram automaticamente os status térmicos, exigindo abertura de Ordem de Manutenção de Climatização para prevenir perdas de produtos congelados.
        </div>
      </div>

      {/* Moldura Simples de Lançamento de Manutenção (Modal) */}
      {modalManutencaoVeiculoId && (() => {
        const v = veiculos.find(ve => ve.id === modalManutencaoVeiculoId);
        if (!v) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-xs">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setModalManutencaoVeiculoId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
                <Wrench className="w-5 h-5 text-sky-400 animate-pulse" />
                <div>
                  <h3 className="text-lg font-display font-semibold text-white">Lançar Manutenção</h3>
                  <p className="text-xs text-slate-400 font-mono">Caminhão Placa: <span className="text-sky-450 font-bold text-sky-450">{v.placa}</span> ({v.marcaCaminhao} {v.modelo})</p>
                </div>
              </div>

              {/* Lista Selecionável de Opções Rápidas */}
              <div className="mb-4">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Selecione opções para a descrição da manutenção:</label>
                
                {opcoesPredefinidas.length === 0 ? (
                  <p className="text-xs italic text-slate-500 bg-[#020617] p-3 rounded-xl border border-slate-800 text-center">Nenhuma opção na lista rápida. Adicione uma nova abaixo.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {opcoesPredefinidas.map(op => {
                      const isSelecionado = textoManutencao.includes(op);
                      return (
                        <div
                          key={op}
                          className={`relative group flex items-center justify-between text-xs rounded-xl border transition-all ${
                            isSelecionado
                              ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-semibold'
                              : 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleOpcaoPredefinida(op)}
                            className="flex-1 text-left p-2.5 truncate cursor-pointer"
                          >
                            {op}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleRemoverOpcao(e, op)}
                            className="p-2 mr-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Remover opção"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Adicionar nova opção personalizada à lista */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    className="bg-[#020617] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 flex-1 font-sans"
                    placeholder="Adicionar nova opção personalizada à lista..."
                    value={novaOpcaoTexto}
                    onChange={(e) => setNovaOpcaoTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarOpcao();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarOpcao}
                    className="bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 hover:text-sky-350 text-xs px-3 py-2 rounded-xl transition-all font-semibold flex items-center gap-1.5 cursor-pointer h-full"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
              </div>

              {/* Campo para Escrita Manual da Manutenção */}
              <div className="space-y-2 mb-6">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-455 text-slate-400">Escrita Manual da Manutenção:</label>
                <textarea
                  rows={3}
                  className="bg-[#020617] border border-slate-700 rounded-xl p-3 w-full text-xs text-white focus:outline-none focus:border-sky-400 placeholder-slate-500 font-sans"
                  placeholder="Escreva detalhes da manutenção ou selecione um item acima..."
                  value={textoManutencao}
                  onChange={(e) => setTextoManutencao(e.target.value)}
                />
              </div>

              {/* Botões de Ações */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalManutencaoVeiculoId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-705 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarNovaManutencao}
                  className="px-5 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Gravar Manutenção
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL OCR SCANNER DE PLACA */}
      {abrirScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md">
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-sm md:text-base font-display font-semibold text-white">Leitor de Placas por Câmera</h3>
                  <p className="text-[11px] text-slate-400">Aponte a câmera para a placa do caminhão (antiga ou Mercosul)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAbrirScanner(false);
                  setErroCamera(null);
                  setResultadoOCR(null);
                  setVeiculoEncontrado(null);
                }}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Area */}
            <div className="relative bg-[#020617] h-[280px] md:h-[380px] flex items-center justify-center overflow-hidden">
              {!erroCamera && (
                <video
                  ref={(el) => setVideoRef(el)}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                />
              )}

              {/* Scanning Laser Line Overlay */}
              {streaming && !lendoOCR && !resultadoOCR && (
                <div className="absolute inset-x-0 h-1 bg-emerald-500/80 shadow-[0_0_12px_#10b981] animate-bounce z-10 pointer-events-none" style={{ top: '40%' }} />
              )}

              {/* Target bracket outline */}
              {streaming && !resultadoOCR && !lendoOCR && (
                <div className="absolute border-2 border-dashed border-sky-400/40 rounded-xl w-[75%] h-[35%] max-w-[450px] pointer-events-none flex items-center justify-center animate-pulse">
                  <div className="text-sky-300 text-[10px] font-mono tracking-wider bg-slate-950/80 px-2 py-1 rounded border border-sky-500/20 uppercase">
                    Centralize a Placa Aqui
                  </div>
                </div>
              )}

              {/* Loading spinner over the camera */}
              {lendoOCR && (
                <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center gap-3 z-20">
                  <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-sky-400 font-mono tracking-widest uppercase animate-pulse">
                    Identificando placa...
                  </p>
                  <p className="text-[10px] text-slate-400">A inteligência artificial do Gemini está analisando a imagem</p>
                </div>
              )}

              {/* Camera access error message */}
              {erroCamera && (
                <div className="absolute inset-0 bg-[#020617] p-6 flex flex-col items-center justify-center text-center gap-3">
                  <VideoOff className="w-10 h-10 text-rose-500" />
                  <p className="text-xs text-rose-450 font-semibold max-w-sm">{erroCamera}</p>
                  <button
                    onClick={() => iniciarCamera(ladoCamera, videoRef)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold px-4 py-2 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {/* No stream state */}
              {!streaming && !erroCamera && !lendoOCR && (
                <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                  Carregando lente da câmera...
                </div>
              )}
            </div>

            {/* Results Display or Capture Controls */}
            <div className="p-5 bg-[#1e293b] border-t border-slate-800 space-y-4">
              
              {resultadoOCR && (
                <div className="bg-[#020617]/70 border border-slate-800 p-4 rounded-xl space-y-3.5 animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono block uppercase">Resultado da Leitura</span>
                      <strong className="text-2xl font-mono tracking-wider text-sky-400">
                        {resultadoOCR}
                      </strong>
                    </div>
                    {veiculoEncontrado ? (
                      <span className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xxs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono uppercase">
                        <Check className="w-3.5 h-3.5" /> Encontrado
                      </span>
                    ) : (
                      <span className="bg-amber-950/50 border border-amber-500/30 text-amber-400 text-xxs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono uppercase">
                        <AlertTriangle className="w-3.5 h-3.5" /> Frota Ausente
                      </span>
                    )}
                  </div>

                  {veiculoEncontrado ? (
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/60 flex items-center gap-3">
                      <Truck className="w-8 h-8 text-sky-400 font-bold" />
                      <div className="min-w-0">
                        <p className="text-slate-400 font-sans text-[10px] leading-tight font-bold">{veiculoEncontrado.marcaCaminhao}</p>
                        <h4 className="text-xs text-white font-display font-bold leading-tight truncate">{veiculoEncontrado.modelo}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Status operativo: <span className="text-sky-350">{veiculoEncontrado.status}</span></p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      A placa <strong>{resultadoOCR}</strong> foi identificada com sucesso, mas este veículo não faz parte do cadastro da sua frota atual. Deseja cadastrar este caminhão na frota ou tentar ler outra placa?
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/50">
                    {veiculoEncontrado ? (
                      <button
                        onClick={() => {
                          setAbrirScanner(false);
                          setResultadoOCR(null);
                          setVeiculoEncontrado(null);
                        }}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors cursor-pointer text-center"
                      >
                        Filtrar Este Veículo
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setPlaca(resultadoOCR);
                          setMostrarForm(true);
                          setAbrirScanner(false);
                          setResultadoOCR(null);
                        }}
                        className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors cursor-pointer text-center"
                      >
                        Cadastrar Caminhão
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setResultadoOCR(null);
                        setVeiculoEncontrado(null);
                        if (videoRef) iniciarCamera(ladoCamera, videoRef);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-700 transition-colors cursor-pointer hover:text-white"
                    >
                      Ler Outra
                    </button>
                  </div>
                </div>
              )}

              {/* Controls when streaming */}
              {streaming && !resultadoOCR && !lendoOCR && (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => capturarEIdentificar(videoRef)}
                    className="flex-1 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold py-3 text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Tirar Foto & Identificar Placa
                  </button>

                  <div className="flex gap-2">
                    {/* Toggle camera facing mode */}
                    <button
                      onClick={() => {
                        setLadoCamera(prev => prev === 'environment' ? 'user' : 'environment');
                      }}
                      title="Alternar câmera frontal/traseira"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-xl border border-slate-700 transition-all cursor-pointer hover:text-white shrink-0"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setAbrirScanner(false);
                      }}
                      className="bg-slate-850 hover:bg-slate-800 text-slate-400 text-xs font-semibold px-5 py-3 rounded-xl border border-slate-700 shrink-0 cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
