import React, { useState, useEffect, useRef } from 'react';
import { Veiculo, StatusVeiculo, StatusRefrigeracao, Manutencao, Avaria } from '../types';
import { Truck, Thermometer, Radio, Plus, X, Trash2, Edit3, Settings, Save, Sparkles, Filter, Wrench, AlertCircle, Calendar, ArrowLeft, CheckCircle2, AlertTriangle, ChevronRight, Camera, RefreshCw, VideoOff, Check, Upload } from 'lucide-react';

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
  const [erroOCR, setErroOCR] = useState<string | null>(null);
  const [lendoOCR, setLendoOCR] = useState<boolean>(false);
  const [lendoAutomatico, setLendoAutomatico] = useState<boolean>(false);
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
      setErroOCR(null);
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
    setErroCamera(null);
    setErroOCR(null);
  };

  const realizarLeituraAutomatica = async (videoEl: HTMLVideoElement | null) => {
    if (!videoEl || lendoOCR || lendoAutomatico || resultadoOCR || !abrirScanner || !streaming) return;
    if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return;

    try {
      setLendoAutomatico(true);

      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Desenhar o frame cheio
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Gerar também um recorte de alta definição da zona central de foco
      let croppedDataUrl = "";
      try {
        const cropCanvas = document.createElement('canvas');
        const cW = Math.round(canvas.width * 0.70);
        const cH = Math.round(canvas.height * 0.40);
        cropCanvas.width = cW;
        cropCanvas.height = cH;
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          const sX = Math.round(canvas.width * 0.15);
          const sY = Math.round(canvas.height * 0.30);
          cropCtx.drawImage(videoEl, sX, sY, cW, cH, 0, 0, cW, cH);
          croppedDataUrl = cropCanvas.toDataURL('image/jpeg', 0.90);
        }
      } catch (err) {
        console.warn("Falha ao gerar recorte de foco:", err);
      }

      const placasCadastradas = veiculos.map(v => v.placa);

      const res = await fetch('/api/ocr-plate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          image: dataUrl,
          croppedImage: croppedDataUrl || undefined,
          registeredPlates: placasCadastradas
        })
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      if (!data.success) {
        return;
      }

      const plateDetected = data.plate?.trim() || "";
      if (plateDetected === "NOT_FOUND" || !plateDetected) {
        return;
      }

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
        setVeiculoDetalhadoId(match.id); // ABRE O CARTÃO AUTOMATICAMENTE
        setAbrirScanner(false); // FECHA A CÂMERA
        setResultadoOCR(null);
        setVeiculoEncontrado(null);
      }
    } catch (err) {
      console.error("Erro no escaneamento automático silencioso:", err);
    } finally {
      setLendoAutomatico(false);
    }
  };

  const capturarEIdentificar = async (videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
      setErroCamera("A câmera ainda está carregando os frames iniciais. Tente novamente em 1 segundo.");
      return;
    }

    try {
      setLendoOCR(true);
      setErroCamera(null);
      setErroOCR(null);
      setResultadoOCR(null);
      setVeiculoEncontrado(null);

      // Limitar o tamanho da imagem capturada para evitar payloads gigantescos no 3G/4G/5G
      const rawWidth = videoEl.videoWidth;
      const rawHeight = videoEl.videoHeight;
      const MAX_DIM = 1200;
      let targetWidth = rawWidth;
      let targetHeight = rawHeight;
      
      if (rawWidth > MAX_DIM || rawHeight > MAX_DIM) {
        if (rawWidth > rawHeight) {
          targetHeight = Math.round((rawHeight * MAX_DIM) / rawWidth);
          targetWidth = MAX_DIM;
        } else {
          targetWidth = Math.round((rawWidth * MAX_DIM) / rawHeight);
          targetHeight = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Não foi possível processar os pixels da imagem.");
      }

      // Desenhar frame original redimensionado
      ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Desenhar recorte ampliado do centro
      let croppedDataUrl = "";
      try {
        const cropCanvas = document.createElement('canvas');
        const cW = Math.round(targetWidth * 0.70);
        const cH = Math.round(targetHeight * 0.40);
        cropCanvas.width = cW;
        cropCanvas.height = cH;
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          const sX = Math.round(targetWidth * 0.15);
          const sY = Math.round(targetHeight * 0.30);
          cropCtx.drawImage(canvas, sX, sY, cW, cH, 0, 0, cW, cH);
          croppedDataUrl = cropCanvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (cropErr) {
        console.warn("Falha no recorte manual:", cropErr);
      }

      const placasCadastradas = veiculos.map(v => v.placa);

      const res = await fetch('/api/ocr-plate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          image: dataUrl,
          croppedImage: croppedDataUrl || undefined,
          registeredPlates: placasCadastradas
        })
      });

      if (!res.ok) {
        let errorMsg = "Serviço de inteligência artificial de OCR indisponível.";
        if (res.status === 413) {
          errorMsg = "A imagem capturada é pesada demais para os servidores de IA.";
        } else {
          try {
            const errData = await res.json();
            if (errData && errData.error) {
              errorMsg = errData.error;
            } else {
              errorMsg = `Serviço de IA de OCR indisponível (Erro HTTP: ${res.status}).`;
            }
          } catch (e) {
            errorMsg = `Serviço de IA de OCR indisponível (Erro HTTP: ${res.status}).`;
          }
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Houve uma falha ao processar a imagem com IA.");
      }

      const plateDetected = data.plate?.trim() || "";
      if (plateDetected === "NOT_FOUND" || !plateDetected) {
        setResultadoOCR("Nenhuma placa de veículo identificada. Tente com outro ângulo ou envie uma foto nítida.");
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
        setVeiculoDetalhadoId(match.id); // ABRE O CARTÃO AUTOMATICAMENTE
        setAbrirScanner(false); // FECHA A CÂMERA
        setResultadoOCR(null);
        setVeiculoEncontrado(null);
      } else {
        setVeiculoEncontrado(null);
      }

    } catch (err: any) {
      console.error("Erro OCR:", err);
      setErroOCR(err.message || "Erro de conexão com o servidor de IA.");
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

  // Efeito de escaneamento automático a cada 2.0 segundos (estilo sensor de QR code)
  useEffect(() => {
    let intervalId: any;
    if (abrirScanner && streaming && !resultadoOCR && !lendoOCR && !lendoAutomatico && videoRef) {
      intervalId = setInterval(() => {
        realizarLeituraAutomatica(videoRef);
      }, 2000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [abrirScanner, streaming, resultadoOCR, lendoOCR, lendoAutomatico, videoRef, veiculos]);
  
  // Controle de cadastro
  const [mostrarForm, setMostrarForm] = useState<boolean>(false);
  
  // States do formulário de veículo
  const [marcaCaminhao, setMarcaCaminhao] = useState<string>('Volkswagen');
  const [modelo, setModelo] = useState<string>('');
  const [placa, setPlaca] = useState<string>('');
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [tipoRefrigeracao, setTipoRefrigeracao] = useState<string>('Thermo King T-880R');
  const [temperaturaAlvo, setTemperaturaAlvo] = useState<number>(-18);
  const [capacidadeCarga, setCapacidadeCarga] = useState<number>(10);
  const [status, setStatus] = useState<StatusVeiculo>('disponivel');

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
      tipoRefrigeracao,
      temperaturaAlvo: Number(temperaturaAlvo),
      temperaturaAtual: Number(temperaturaAlvo) + (Math.random() * 1.5 - 0.75), // Começa próximo ao alvo
      capacidadeCarga: Number(capacidadeCarga),
      status,
      statusRefrigeracao: status === 'disponivel' ? 'ok' : status === 'alerta' ? 'degradado' : 'falha',
      ultimaManutencao: undefined
    });

    // Resetar campos
    setModelo('');
    setPlaca('');
    setAno(new Date().getFullYear());
    setTemperaturaAlvo(-18);
    setCapacidadeCarga(10);
    setStatus('disponivel');
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
              <span className="font-mono text-xs bg-[#020617] border border-slate-755 px-3 py-1.5 rounded-lg font-bold text-sky-400 tracking-wider">
                {v.placa}
              </span>
              {v.status !== 'manutencao' && (
                <span className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider border ${
                  v.status === 'disponivel' 
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                    : 'bg-yellow-950/40 border-yellow-500/30 text-yellow-400'
                }`}>
                  {v.status === 'disponivel' ? 'Disponível' : 'Alerta Climatização'}
                </span>
              )}
            </div>
          </div>

          {/* Ficha Básica - Bento Card */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-5 shadow-lg">
            <div className="space-y-1">
              <p className="text-xs text-sky-450 font-bold uppercase tracking-wider">{v.marcaCaminhao}</p>
              <h1 className="text-2xl font-display font-bold text-white tracking-tight">{v.modelo}</h1>
              <p className="text-xs text-slate-400 font-mono">Ano de Fabricação: <span className="text-white">{v.ano}</span></p>
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
                    {avariasDaViatura.filter(av => !av.resolvido).length} pendentes
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
                    {historicoManutencoes.length} registradas
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
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Montadora</label>
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
                <option value="MAN">MAN / DAF</option>
              </select>
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ano Fabricação</label>
              <input
                type="number"
                min={2000}
                max={new Date().getFullYear() + 1}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Equipamento de Frio</label>
              <input
                type="text"
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                placeholder="Ex: Thermo King T-880R"
                value={tipoRefrigeracao}
                onChange={(e) => setTipoRefrigeracao(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Capacidade Carga (Tons)</label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={50}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                value={capacidadeCarga}
                onChange={(e) => setCapacidadeCarga(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Setpoint Térmico Alvo (°C)</label>
              <input
                type="number"
                min={-30}
                max={25}
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                value={temperaturaAlvo}
                onChange={(e) => setTemperaturaAlvo(Number(e.target.value))}
                required
                placeholder="Ex: -18 para ultracongelados"
              />
              <span className="text-xxs text-slate-400 mt-1 block">Ideal: congelado (-20°C a -18°C), resfriado (2°C a 4°C).</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status Operativo Inicial</label>
              <select
                className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusVeiculo)}
              >
                <option value="disponivel">Disponível para Viagem</option>
                <option value="alerta">Risco de Climatização (Alerta)</option>
                <option value="manutencao">Retido em Manutenção (Oficina)</option>
              </select>
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
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-xs bg-[#020617] border border-slate-700 px-2.5 py-1 rounded-md font-bold text-sky-400 tracking-wider">
                            {v.placa}
                          </span>
                          <p className="text-xs font-semibold text-slate-400 mt-2">{v.marcaCaminhao}</p>
                          <h4 className="font-display font-medium text-white text-base leading-tight mt-0.5 group-hover/header:text-sky-350 transition-colors truncate">
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
      <div className="bg-amber-950/20 border border-amber-800/40 p-4 rounded-xl text-xs text-slate-200 flex items-start gap-2 select-none">
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

              {/* Scanning Active HUD status */}
              {streaming && !resultadoOCR && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#0d1527]/90 border border-slate-750/80 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg">
                  <div className={`w-2 h-2 rounded-full ${lendoAutomatico ? 'bg-emerald-500 animate-ping' : 'bg-sky-500 animate-pulse'}`} />
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-100 font-mono">
                    {lendoAutomatico ? 'IA Analisando Imagem...' : 'Auto-Scanner de Placas'}
                  </span>
                </div>
              )}

              {/* Scanning Laser Line Overlay */}
              {streaming && !lendoOCR && !resultadoOCR && (
                <div className="absolute inset-x-0 h-1 bg-emerald-500/80 shadow-[0_0_12px_#10b981] animate-bounce z-10 pointer-events-none" style={{ top: '45%' }} />
              )}

              {/* Target bracket outline */}
              {streaming && !resultadoOCR && !lendoOCR && (
                <div className="absolute border-2 border-dashed border-sky-455/40 border-sky-400/40 rounded-xl w-[75%] h-[40%] max-w-[450px] pointer-events-none flex items-center justify-center animate-pulse">
                  <div className="text-sky-300 text-[10px] font-mono tracking-wider bg-slate-950/80 px-2 py-1 rounded border border-sky-500/20 uppercase">
                    Centralize a Placa Aqui
                  </div>
                </div>
              )}

              {/* Loading spinner over the camera for manual click */}
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
                <div className="absolute inset-0 bg-[#020617] p-6 flex flex-col items-center justify-center text-center gap-4">
                  <VideoOff className="w-10 h-10 text-rose-500" />
                  <p className="text-xs text-rose-450 font-semibold max-w-sm">{erroCamera}</p>
                  <button
                    onClick={() => iniciarCamera(ladoCamera, videoRef)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold px-5 py-3 rounded-xl border border-slate-700 cursor-pointer shadow-md"
                  >
                    Tentar Câmera Novamente
                  </button>
                </div>
              )}

              {/* No stream state */}
              {!streaming && !erroCamera && !lendoOCR && (
                <div className="text-slate-500 text-xs flex flex-col items-center gap-3 text-center">
                  <div className="w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-mono">Carregando lente da câmera...</span>
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
                      <span className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xxs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono uppercase font-sans">
                        <Check className="w-3.5 h-3.5" /> Encontrado
                      </span>
                    ) : (
                      <span className="bg-amber-950/50 border border-amber-500/30 text-amber-400 text-xxs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono uppercase font-sans">
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
                <div className="flex flex-col gap-2.5">
                  {erroOCR && (
                    <div className="bg-rose-955/40 bg-opacity-40 bg-rose-950/40 border border-rose-500/30 text-rose-350 text-xs p-3.5 rounded-xl flex items-start gap-2.5 animate-fade-in mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1 text-left">
                        <strong className="font-semibold block text-rose-450 text-[11px] uppercase tracking-wide">Erro de Escaneamento</strong>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{erroOCR}</p>
                      </div>
                      <button 
                        onClick={() => setErroOCR(null)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer px-1 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => capturarEIdentificar(videoRef)}
                      className="flex-1 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold py-3 text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Tirar Foto & Identificar Placa
                    </button>
                  </div>

                  <div className="flex gap-2 justify-end">
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
