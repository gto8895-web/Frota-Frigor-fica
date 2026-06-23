import React, { useState, useEffect } from 'react';
import { Veiculo, Manutencao, StatusManutencao } from './types';
import { INITIAL_VEHICLES, INITIAL_MAINTENANCES } from './mockData';
import DashboardView from './components/DashboardView';
import VehiclesView from './components/VehiclesView';
import MaintenanceView from './components/MaintenanceView';
import BudgetView from './components/BudgetView';
import ShoppingListView from './components/ShoppingListView';
import BackupView from './components/BackupView';
import { Truck, Wrench, DollarSign, LayoutDashboard, Settings, Radio, Download, Smartphone, Share, Info, X } from 'lucide-react';

export default function App() {
  // Inicialização de estados reativos persistidos ou fallback de mock-data
  const [veiculos, setVeiculos] = useState<Veiculo[]>(() => {
    const salvos = localStorage.getItem('ff_veiculos');
    if (salvos) {
      try {
        const parsed = JSON.parse(salvos) as Veiculo[];
        // Remove os veículos de teste criados anteriormente (ex: FRG-2B45, COL-7E89, etc)
        const hasOldTestVehicles = parsed.some(v => 
          v.placa === 'FRG-2B45' || 
          v.placa === 'COL-7E89' || 
          v.placa === 'ICE-4D12' || 
          v.placa === 'SNW-9A34' || 
          v.placa === 'GLC-1F78'
        );
        // Se houver algum veículo antigo de teste ou a lista estiver vazia/desatualizada
        if (hasOldTestVehicles) {
          localStorage.setItem('ff_veiculos', JSON.stringify(INITIAL_VEHICLES));
          return INITIAL_VEHICLES;
        }
        return parsed;
      } catch (e) {
        return INITIAL_VEHICLES;
      }
    }
    return INITIAL_VEHICLES;
  });

  const [manutencoes, setManutencoes] = useState<Manutencao[]>(() => {
    const salvos = localStorage.getItem('ff_manutencoes');
    if (salvos) {
      try {
        const parsed = JSON.parse(salvos) as Manutencao[];
        let modified = false;
        const migrated = parsed.map(m => {
          // Se uma manutenção foi salva anteriormente com custo 350 (devido ao antigo valor fixado no código),
          // ela é restaurada para o valor histórico de 150 reais para não distorcer o registro.
          if (m.custo === 350) {
            modified = true;
            return { ...m, custo: 150 };
          }
          return m;
        });
        if (modified) {
          localStorage.setItem('ff_manutencoes', JSON.stringify(migrated));
          return migrated;
        }
        return parsed;
      } catch (e) {
        return INITIAL_MAINTENANCES;
      }
    }
    return INITIAL_MAINTENANCES;
  });

  const [custoPadraoDiario, setCustoPadraoDiario] = useState<number>(() => {
    const salvo = localStorage.getItem('ff_custo_diario');
    return salvo ? Number(salvo) : 150;
  });

  // A data padrão do momento é sempre a do dia presente (em formato YYYY-MM-DD)
  const [dataReferencia, setDataReferencia] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Data selecionada especificamente para o orçamento diário para não alterar o cabeçalho do app
  const [dataReferenciaOrcamento, setDataReferenciaOrcamento] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [tabAtiva, setTabAtiva] = useState<'dashboard' | 'veiculos' | 'manutencoes' | 'orcamento' | 'compras' | 'backup'>('dashboard');
  
  // Sincronização em nuvem (RECUPERAR)
  const [codigoFrota, setCodigoFrota] = useState<string>(() => {
    return localStorage.getItem('recuperar_codigo_frota') || '';
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('recuperar_auto_sync') === 'true';
  });

  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  // Estados com foco em PWA e Instalação (com suporte a iPhone 12 Pro Max e Chrome)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(() => {
    try {
      return localStorage.getItem('frigofrota_dismiss_install') !== 'true';
    } catch {
      return true;
    }
  });
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSHintModal, setShowIOSHintModal] = useState<boolean>(false);

  // Detectar suporte à instalação no Chrome e se é dispositivo iOS (iPhone / iPad)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Impede que o navegador mostre o prompt automático
      e.preventDefault();
      // Armazena o evento para ser disparado posteriormente via botão
      setDeferredPrompt(e);
      // Garante banner aberto
      const dismissed = localStorage.getItem('frigofrota_dismiss_install') === 'true';
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Identifica se já está rodando standalone (instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;

    if (isStandalone) {
      setShowInstallBanner(false);
    }

    // Detectar iOS / iPhone
    const ua = window.navigator.userAgent;
    const isIphoneOrIpad = /iPhone|iPad|iPod/i.test(ua);
    setIsIOS(isIphoneOrIpad);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Resultado do prompt de instalação do usuário:', outcome);
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleDismissInstallBanner = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem('frigofrota_dismiss_install', 'true');
    } catch (e) {}
  };

  // Atualizar relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sincronizar estados com o LocalStorage
  useEffect(() => {
    localStorage.setItem('ff_veiculos', JSON.stringify(veiculos));
  }, [veiculos]);

  useEffect(() => {
    localStorage.setItem('ff_manutencoes', JSON.stringify(manutencoes));
  }, [manutencoes]);

  useEffect(() => {
    localStorage.setItem('ff_custo_diario', custoPadraoDiario.toString());
  }, [custoPadraoDiario]);

  // AÇÕES - GERENCIAMENTO DE VEÍCULOS
  const handleAddVehicle = (novoVeic: Omit<Veiculo, 'id'>) => {
    const veiculoCompleto: Veiculo = {
      ...novoVeic,
      id: `veic-${Date.now()}`
    };
    setVeiculos(prev => [veiculoCompleto, ...prev]);
  };

  const handleUpdateVehicle = (veiculoAtualizado: Veiculo) => {
    setVeiculos(prev => prev.map(v => v.id === veiculoAtualizado.id ? veiculoAtualizado : v));
  };

  const handleDeleteVehicle = (id: string) => {
    // Remover veículo e remover/filtrar registros de manutenção vinculados
    setVeiculos(prev => prev.filter(v => v.id !== id));
    setManutencoes(prev => prev.filter(m => m.veiculoId !== id));
  };

  // AÇÕES - GERENCIAMENTO DE MANUTENÇÕES
  const handleAddMaintenance = (novaMaint: Omit<Manutencao, 'id'>) => {
    const maintCompleta: Manutencao = {
      ...novaMaint,
      id: `maint-${Date.now()}`
    };
    
    setManutencoes(prev => [maintCompleta, ...prev]);

    // Ao agendar ou começar manutenção, atualizar opcionalmente o status do veículo
    // Se for hoje, coloca o veículo em manutenção se for crítica
    setVeiculos(prev => prev.map(v => {
      if (v.id === novaMaint.veiculoId) {
        let proximoStatus = v.status;
        if (novaMaint.status === 'em_andamento') {
          proximoStatus = 'manutencao';
        }
        return {
          ...v,
          status: proximoStatus,
          ultimaManutencao: novaMaint.status === 'concluida' ? novaMaint.data : v.ultimaManutencao
        };
      }
      return v;
    }));
  };

  const handleUpdateMaintenanceStatus = (id: string, proximoStatus: StatusManutencao) => {
    let veiculoIdAssociado = '';
    let dataManutencao = '';
    let tipoManutencao = '';

    setManutencoes(prev => prev.map(m => {
      if (m.id === id) {
        veiculoIdAssociado = m.veiculoId;
        dataManutencao = m.data;
        tipoManutencao = m.tipo;
        return { ...m, status: proximoStatus };
      }
      return m;
    }));

    // Se o status alterou para concluído, nós realizamos a liberação do caminhão automaticamente!
    if (proximoStatus === 'concluida' && veiculoIdAssociado) {
      setVeiculos(prev => prev.map(v => {
        if (v.id === veiculoIdAssociado) {
          return {
            ...v,
            status: 'disponivel', // Volta a ficar disponível
            statusRefrigeracao: 'ok', // Equipamento de refrigeração calibrado e consertado
            temperaturaAtual: v.temperaturaAlvo, // Temperatura estabilizada no setpoint ideal
            ultimaManutencao: dataManutencao // Data da última intervenção vira a data de conclusão
          };
        }
        return v;
      }));
    } else if (proximoStatus === 'em_andamento' && veiculoIdAssociado) {
      // Se entrou na oficina, o veículo passa a ficar retido em manutenção
      setVeiculos(prev => prev.map(v => {
        if (v.id === veiculoIdAssociado) {
          return {
            ...v,
            status: 'manutencao'
          };
        }
        return v;
      }));
    }
  };

  const handleDeleteMaintenance = (id: string, idsOriginais?: string[]) => {
    const targets = idsOriginais && idsOriginais.length > 0 ? idsOriginais : [id];
    setManutencoes(prev => prev.filter(m => !targets.includes(m.id)));
  };

  const handleUpdateMaintenance = (id: string, updates: { descricao: string; custo: number }, idsOriginais?: string[]) => {
    const targets = idsOriginais && idsOriginais.length > 0 ? idsOriginais : [id];
    setManutencoes(prev => {
      const semSecundarios = prev.filter(m => m.id === id || !targets.includes(m.id));
      return semSecundarios.map(m => m.id === id ? { ...m, ...updates } : m);
    });
  };

  // SIMULAÇÃO DINÂMICA DE SENSORES DE CLIMATIZAÇÃO (TELEMETRIA INTACTA)
  const handleSimulateTemperatures = () => {
    setVeiculos(prev => prev.map(v => {
      let novaTemp = v.temperaturaAtual;

      if (v.status === 'manutencao') {
        // Na oficina sem motor ligado vai para temperatura ambiente
        if (novaTemp < 22) {
          novaTemp += Math.random() * 2.5;
        } else {
          novaTemp = 22 + (Math.random() * 1 - 0.5);
        }
      } else if (v.status === 'alerta') {
        // Se está em alerta térmico, o desvio esquenta por problemas no condensador
        novaTemp += Math.random() * 0.8;
      } else {
        // Se está disponível, pequenas oscilações de compressor normais (0.2°C)
        const variacao = (Math.random() * 0.6 - 0.3);
        const proxima = novaTemp + variacao;
        
        // Evitar desviar muito do setpoint no modo ok
        if (Math.abs(proxima - v.temperaturaAlvo) > 2) {
          novaTemp = v.temperaturaAlvo + (Math.random() * 0.6 - 0.3);
        } else {
          novaTemp = proxima;
        }
      }

      // Reavaliar se gera novo alerta térmico
      let novoStatus = v.status;
      let novoStatusRefri = v.statusRefrigeracao;
      const desvio = novaTemp - v.temperaturaAlvo;

      if (v.status !== 'manutencao') {
        if (desvio > 4.5) {
          novoStatus = 'alerta';
          novoStatusRefri = 'falha';
        } else if (desvio > 2.0) {
          novoStatus = 'alerta';
          novoStatusRefri = 'degradado';
        } else {
          novoStatus = 'disponivel';
          novoStatusRefri = 'ok';
        }
      }

      return {
        ...v,
        temperaturaAtual: Number(novaTemp.toFixed(1)),
        status: novoStatus,
        statusRefrigeracao: novoStatusRefri
      };
    }));
  };

  const handleRestoreBackup = (data: {
    veiculos: Veiculo[];
    manutencoes: Manutencao[];
    custoPadraoDiario: number;
  }) => {
    setVeiculos(data.veiculos);
    setManutencoes(data.manutencoes);
    setCustoPadraoDiario(data.custoPadraoDiario);
  };

  const handleClearHistoryAndAvarias = () => {
    setManutencoes([]);
    localStorage.setItem('ff_manutencoes', JSON.stringify([]));
    localStorage.setItem('frigofruns_avarias', JSON.stringify({}));
  };

  // Sincronização em nuvem (RECUPERAR)
  const sincronizarComNuvem = async (codigoOverride?: string) => {
    const cod = codigoOverride || codigoFrota;
    if (!cod.trim()) return;

    setSyncStatus('syncing');
    setSyncError(null);

    // Agrupar todos os dados locais para salvar
    const dados = {
      veiculos,
      manutencoes,
      custoPadraoDiario,
      shoppingList: JSON.parse(localStorage.getItem('frigofrota_shopping_list') || '[]'),
      avarias: JSON.parse(localStorage.getItem('frigofrota_avarias') || '{}'),
      opcoesManutencao: JSON.parse(localStorage.getItem('frigofrota_opcoes_manutencao') || '[]'),
    };

    try {
      const res = await fetch('/api/sync/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoFrota: cod.trim().toUpperCase(), dados }),
      });

      if (!res.ok) {
        throw new Error('Erro ao salvar dados na nuvem.');
      }

      setSyncStatus('success');
      localStorage.setItem('recuperar_codigo_frota', cod.trim().toUpperCase());
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncError(err.message || 'Falha na conexão com o servidor de sincronização.');
    }
  };

  const carregarDaNuvem = async (codigoInput: string) => {
    if (!codigoInput.trim()) {
      alert('Por favor, informe o código da frota.');
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const res = await fetch(`/api/sync/load/${codigoInput.trim().toUpperCase()}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Código de frota não localizado na nuvem. Verifique a grafia.');
        }
        throw new Error('Erro ao baixar os dados.');
      }

      const data = await res.json();
      if (data.success && data.dados) {
        const { veiculos, manutencoes, custoPadraoDiario, shoppingList, avarias, opcoesManutencao } = data.dados;

        if (veiculos) {
          setVeiculos(veiculos);
          localStorage.setItem('ff_veiculos', JSON.stringify(veiculos));
        }
        if (manutencoes) {
          setManutencoes(manutencoes);
          localStorage.setItem('ff_manutencoes', JSON.stringify(manutencoes));
        }
        if (custoPadraoDiario) {
          setCustoPadraoDiario(custoPadraoDiario);
          localStorage.setItem('ff_custo_diario', String(custoPadraoDiario));
        }
        if (shoppingList) {
          localStorage.setItem('frigofrota_shopping_list', JSON.stringify(shoppingList));
        }
        if (avarias) {
          localStorage.setItem('frigofrota_avarias', JSON.stringify(avarias));
        }
        if (opcoesManutencao) {
          localStorage.setItem('frigofrota_opcoes_manutencao', JSON.stringify(opcoesManutencao));
        }

        setCodigoFrota(codigoInput.trim().toUpperCase());
        localStorage.setItem('recuperar_codigo_frota', codigoInput.trim().toUpperCase());
        setSyncStatus('success');
        alert('Dados da Frota RECUPERADOS e sincronizados com sucesso!');
        setTimeout(() => setSyncStatus('idle'), 3000);
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncError(err.message || 'Falha de conexão ou código incorreto.');
      alert(err.message || 'Código de frota não encontrado.');
    }
  };

  useEffect(() => {
    if (autoSync && codigoFrota) {
      const timer = setTimeout(() => {
        sincronizarComNuvem();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [veiculos, manutencoes, autoSync, codigoFrota]);

  useEffect(() => {
    localStorage.setItem('recuperar_auto_sync', String(autoSync));
  }, [autoSync]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-between">
      
      {/* barra superior administrativa (Cabecalho) no-print */}
      <header className="bg-[#020617] border-b border-slate-800/70 sticky top-0 z-40 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-3">
            
            {/* Logo Corporativa */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-black text-sky-400 text-base tracking-tight block">
                  RECUPERAR
                </span>
              </div>
            </div>

            {/* Menu de Abas de Navegação */}
            <nav className="hidden md:flex gap-1.5">
              {[
                { id: 'dashboard', name: 'Painel Geral', icon: LayoutDashboard },
                { id: 'veiculos', name: 'Caminhões e Câmaras', icon: Truck },
                { id: 'manutencoes', name: 'Histórico', icon: Wrench },
                { id: 'orcamento', name: 'Orçamento Diário Padrão', icon: DollarSign }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => setTabAtiva(tab.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      tabAtiva === tab.id
                        ? 'bg-slate-800 text-sky-400 border-b-2 border-sky-400'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>

            {/* Estatísticas resumidas na Direção do Usuário */}
            <div className="flex items-center shrink-0">
              <span className="bg-[#1e293b] text-slate-300 border border-slate-700 rounded-lg px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xxs font-mono font-medium flex items-center gap-1 sm:gap-1.5 shadow-sm">
                <span>📅 {dataReferencia.split('-').reverse().join('/')}</span>
                <span className="text-slate-500">|</span>
                <span>🕒 {currentTime}</span>
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Menu flutuante inferior para mobile no-print */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#020617] border-t border-slate-800 z-40 p-2 flex justify-around md:hidden no-print shadow-lg">
        {[
          { id: 'dashboard', name: 'Início', icon: LayoutDashboard },
          { id: 'veiculos', name: 'Frota', icon: Truck },
          { id: 'manutencoes', name: 'Histórico', icon: Wrench },
          { id: 'orcamento', name: 'Orçamento', icon: DollarSign }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`nav-mobile-${tab.id}`}
              onClick={() => setTabAtiva(tab.id as any)}
              className={`flex flex-col items-center p-1 rounded-lg transition-all ${
                tabAtiva === tab.id
                  ? 'text-sky-400 scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Margem principal de exibição */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 pb-20 md:pb-8">

        {/* Banner de Instalação PWA */}
        {showInstallBanner && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#1e293b] border border-sky-400/20 text-slate-200 p-4 mb-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-fade-in no-print">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-450 rounded-xl shrink-0">
                <Smartphone className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-white text-sm">Rodar como Aplicativo Nativo (PWA)</h4>
                <p className="text-xs text-slate-400 mt-0.5">Disponibilize o RECUPERAR na tela inicial para acesso instantâneo nos seus trajetos.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {deferredPrompt ? (
                <button
                  onClick={handleInstallPWA}
                  className="w-full sm:w-auto bg-sky-400 hover:bg-sky-350 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" /> Instalar Aplicativo
                </button>
              ) : isIOS ? (
                <button
                  onClick={() => setShowIOSHintModal(true)}
                  className="w-full sm:w-auto bg-sky-400 hover:bg-sky-350 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Smartphone className="w-3.5 h-3.5" /> Instalar no iPhone
                </button>
              ) : (
                <button
                  onClick={() => setShowIOSHintModal(true)}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-sky-400" /> Como Instalar
                </button>
              )}
              <button
                onClick={handleDismissInstallBanner}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shrink-0"
                title="Dispensar sugestão"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal de Instruções de Instalação para iPhone (iOS) e Chrome/Safari */}
        {showIOSHintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-xs">
            <div className="bg-[#1e293b] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden text-slate-100">
              <button
                onClick={() => setShowIOSHintModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-[#020617] rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
                <div className="p-2 bg-sky-500/10 border border-sky-500/25 text-sky-400 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-white leading-tight">Como instalar no seu Celular</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Passo-a-passo para seu iPhone 12 Pro Max</p>
                </div>
              </div>

              {/* Conteúdo das Instruções */}
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Para rodar o <span className="text-sky-400 font-semibold">RECUPERAR</span> como um aplicativo móvel nativo em aparelhos iOS (ou no Google Chrome do seu <span className="text-white font-semibold">iPhone 12 Pro Max</span>), siga as instruções rápidas:
                </p>

                {/* No Chrome / Safari no iOS */}
                <div className="bg-[#020617]/60 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans text-xs">
                  <h4 className="font-bold text-sky-450 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span> No seu iPhone (Chrome ou Safari)
                  </h4>
                  <ol className="space-y-2.5 text-slate-200 pl-4 list-decimal">
                    <li>
                      Abra o app no navegador do celular (Safari ou Chrome).
                    </li>
                    <li className="flex items-start gap-1.5 flex-wrap leading-relaxed">
                      Toque no botão de <strong>Compartilhamento</strong> da barra do navegador <span className="bg-[#1e293b] px-1.5 py-0.5 rounded text-[10px] text-sky-400 border border-slate-705 inline-flex items-center gap-0.5"><Share className="w-3 h-3 inline" /> Compartilhar</span>.
                    </li>
                    <li>
                      Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                    </li>
                    <li>
                      Defina o título como <strong>"RECUPERAR"</strong> e toque em <strong>"Adicionar"</strong> no canto superior direito.
                    </li>
                  </ol>
                </div>

                {/* No Chrome (Para Android ou Computador) */}
                <div className="bg-[#020617]/30 border border-slate-800/80 rounded-2xl p-3.5 space-y-1.5 font-sans text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">
                    No Google Chrome (Android / PC)
                  </h4>
                  <p className="text-slate-400 text-xxs leading-relaxed">
                    Clique em <strong>"Instalar Aplicativo"</strong> no banner superior, ou clique no menu do Chrome (<span className="text-white font-bold">...</span>) no canto superior e selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                  </p>
                </div>

                <div className="text-center pt-3 border-t border-slate-800/60 flex flex-col items-center gap-1.5">
                  <p className="text-[10px] text-slate-500 font-mono">O aplicativo será adicionado com ícone próprio na sua grade de apps, dispensando o navegador!</p>
                  <button
                    type="button"
                    onClick={() => setShowIOSHintModal(false)}
                    className="mt-1.5 bg-sky-400 hover:bg-sky-350 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer shadow-md inline-flex items-center gap-1.5"
                  >
                    Entendi, obrigado!
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {tabAtiva === 'dashboard' && (
          <DashboardView
            veiculos={veiculos}
            custoPadraoDiario={custoPadraoDiario}
            onUpdateCustoPadraoDiario={setCustoPadraoDiario}
            onNavigate={(id) => setTabAtiva(id)}
          />
        )}

        {tabAtiva === 'compras' && (
          <ShoppingListView
            onBack={() => setTabAtiva('dashboard')}
          />
        )}

        {tabAtiva === 'veiculos' && (
          <VehiclesView
            veiculos={veiculos}
            manutencoes={manutencoes}
            custoPadraoDiario={custoPadraoDiario}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onSimulateTemperatures={handleSimulateTemperatures}
            onAddMaintenance={handleAddMaintenance}
          />
        )}

        {tabAtiva === 'manutencoes' && (
          <MaintenanceView
            manutencoes={manutencoes}
            veiculos={veiculos}
            onAddMaintenance={handleAddMaintenance}
            onUpdateMaintenanceStatus={handleUpdateMaintenanceStatus}
            onDeleteMaintenance={handleDeleteMaintenance}
            onUpdateMaintenance={handleUpdateMaintenance}
            dataReferencia={dataReferencia}
          />
        )}

        {tabAtiva === 'orcamento' && (
          <BudgetView
            veiculos={veiculos}
            manutencoes={manutencoes}
            custoPadraoDiario={custoPadraoDiario}
            onUpdateCustoPadrao={setCustoPadraoDiario}
            dataReferencia={dataReferenciaOrcamento}
            onChangeDataReferencia={setDataReferenciaOrcamento}
          />
        )}

        {tabAtiva === 'backup' && (
          <BackupView
            veiculos={veiculos}
            manutencoes={manutencoes}
            custoPadraoDiario={custoPadraoDiario}
            onRestoreBackup={handleRestoreBackup}
            onClearHistoryAndAvarias={handleClearHistoryAndAvarias}
            onBack={() => setTabAtiva('dashboard')}
            codigoFrota={codigoFrota}
            setCodigoFrota={setCodigoFrota}
            syncStatus={syncStatus}
            syncError={syncError}
            autoSync={autoSync}
            setAutoSync={setAutoSync}
            onSincronizarComNuvem={sincronizarComNuvem}
            onCarregarDaNuvem={carregarDaNuvem}
          />
        )}

      </main>

    </div>
  );
}
