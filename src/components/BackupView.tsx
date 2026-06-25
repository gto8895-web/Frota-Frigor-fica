import React, { useState, useRef } from 'react';
import { Database, ArrowLeft, Download, Upload, CheckCircle, AlertTriangle, FileJson, Clock, RefreshCw, Cloud, CloudLightning, ShieldCheck, Wifi, HelpCircle } from 'lucide-react';
import { Veiculo, Manutencao } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface BackupViewProps {
  veiculos: Veiculo[];
  manutencoes: Manutencao[];
  custoPadraoDiario: number;
  shoppingList: any[];
  avarias: any;
  opcoesManutencao: string[];
  onRestoreBackup: (data: {
    veiculos: Veiculo[];
    manutencoes: Manutencao[];
    custoPadraoDiario: number;
    shopping_list?: any[];
    avarias?: any;
    opcoesManutencao?: string[];
  }) => void;
  onClearHistoryAndAvarias?: () => void;
  onBack: () => void;

  // Sincronização em Nuvem (RECUPERAR)
  codigoFrota: string;
  setCodigoFrota: (cod: string) => void;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  autoSync: boolean;
  setAutoSync: (val: boolean) => void;
  onSincronizarComNuvem: (codigoOverride?: string) => Promise<void>;
  onCarregarDaNuvem: (codigoInput: string) => Promise<void>;
}

export default function BackupView({
  veiculos,
  manutencoes,
  custoPadraoDiario,
  shoppingList,
  avarias,
  opcoesManutencao,
  onRestoreBackup,
  onClearHistoryAndAvarias,
  onBack,
  codigoFrota,
  setCodigoFrota,
  syncStatus,
  syncError,
  autoSync,
  setAutoSync,
  onSincronizarComNuvem,
  onCarregarDaNuvem
}: BackupViewProps) {
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [backupsNuvem, setBackupsNuvem] = useState<any[]>([]);
  const [selectedBackupIndex, setSelectedBackupIndex] = useState<number | null>(null);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [tempCode, setTempCode] = useState(codigoFrota);

  React.useEffect(() => {
    setTempCode(codigoFrota);
  }, [codigoFrota]);

  const fetchBackupsNuvemForCode = async (codeToUse: string) => {
    if (!codeToUse || !codeToUse.trim()) return;
    setLoadingBackups(true);
    try {
      // 1. Tentar ler do Firestore usando o SDK do cliente primeiro
      let parsed: any = null;
      try {
        const docRef = doc(db, 'frotas', codeToUse);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          if (docData && docData.dados) {
            parsed = JSON.parse(docData.dados);
          }
        }
      } catch (err) {
        console.warn('Falha ao ler diretamente do Firestore SDK, tentando API do servidor...', err);
      }

      // 2. Se falhou pelo SDK, tentar usar API do servidor como fallback
      if (!parsed) {
        try {
          const res = await fetch(`/api/sync/load/${codeToUse}`);
          if (res.ok) {
            const loadData = await res.json();
            if (loadData.success && loadData.dados) {
              parsed = loadData.dados;
            }
          }
        } catch (apiErr) {
          console.error("Falha ao carregar via API:", apiErr);
        }
      }

      if (parsed) {
        let backups: any[] = [];
        if (Array.isArray(parsed.backups)) {
          backups = parsed.backups;
        } else if (parsed.veiculos) {
          // Retrocompatibilidade se era um backup único antes
          backups = [{
            id: 'old-1',
            data_criacao: parsed.updatedAt || new Date().toISOString(),
            label: 'Backup Anterior',
            veiculos: parsed.veiculos,
            manutencoes: parsed.manutencoes,
            custoPadraoDiario: parsed.custoPadraoDiario || 150,
            shopping_list: parsed.shopping_list || [],
            avarias: parsed.avarias || {},
            opcoesManutencao: parsed.opcoesManutencao || []
          }];
        }

        setBackupsNuvem(backups);

        // REGRA DE PROTEÇÃO CONTRA PERDA DE DADOS:
        // Se a lista de manutenção está zerada (length === 0) e existem backups na nuvem,
        // o app restaura automaticamente o último backup que possui manutenções válidas!
        if (manutencoes.length === 0 && backups.length > 0) {
          const backupValido = backups.find((item: any) => item.manutencoes && item.manutencoes.length > 0);
          const b = backupValido || backups[0];

          if (b) {
            setStatusMessage({
              text: `Detectado que o aplicativo foi redefinido ou limpo. Restaurando o último backup (${b.label}) automaticamente...`,
              type: 'success'
            });

            // Grava o código recuperado no estado e no localStorage do código
            setCodigoFrota(codeToUse);
            localStorage.setItem('recuperar_codigo_frota', codeToUse);

            onRestoreBackup({
              veiculos: b.veiculos || [],
              manutencoes: b.manutencoes || [],
              custoPadraoDiario: b.custoPadraoDiario || 150,
              shopping_list: b.shopping_list || [],
              avarias: b.avarias || {},
              opcoesManutencao: b.opcoesManutencao || []
            });

            alert(`Dados da nuvem ("${b.label}") recuperados e restaurados com sucesso!`);
            return;
          }
        }

        if (backups.length > 0) {
          setStatusMessage({
            text: `Conectado com sucesso! Encontrados ${backups.length} backups na nuvem para o código "${codeToUse}".`,
            type: 'success'
          });
        } else {
          setStatusMessage({
            text: `Código "${codeToUse}" conectado, mas nenhum backup foi encontrado nesta conta.`,
            type: 'error'
          });
        }
      } else {
        setBackupsNuvem([]);
        setStatusMessage({
          text: `Nenhum backup encontrado na nuvem para o código "${codeToUse}". Verifique a grafia ou salve novos dados para criar este código.`,
          type: 'error'
        });
      }
    } catch (err: any) {
      console.error("Erro ao carregar backups da nuvem:", err);
      setStatusMessage({
        text: 'Erro de conexão com a nuvem: ' + (err.message || err),
        type: 'error'
      });
    } finally {
      setLoadingBackups(false);
    }
  };

  const fetchBackupsNuvem = () => fetchBackupsNuvemForCode(codigoFrota);

  React.useEffect(() => {
    fetchBackupsNuvemForCode(codigoFrota);
  }, [codigoFrota]);

  const handleVincularCodigo = async () => {
    if (!tempCode || !tempCode.trim()) {
      alert("Por favor, digite um código de oficina válido.");
      return;
    }
    const clean = tempCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!clean) {
      alert("Código inválido.");
      return;
    }

    setCodigoFrota(clean);
    localStorage.setItem('recuperar_codigo_frota', clean);

    setStatusMessage({
      text: `Alterando para o código "${clean}" e baixando backups na nuvem...`,
      type: 'success'
    });

    // Salva o novo código ativo no servidor de forma assíncrona para persistir em active_code.txt
    try {
      await fetch('/api/sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoFrota: clean, dados: { backups: backupsNuvem } })
      });
    } catch (e) {
      console.warn("Erro ao notificar servidor sobre novo código ativo:", e);
    }

    await fetchBackupsNuvemForCode(clean);
  };

  const handleImportCloudBackup = async () => {
    let codeToUse = codigoFrota;
    if (!codeToUse) {
      const inputCode = prompt("Código de backup da nuvem não configurado (pois os dados locais foram excluídos). Por favor, digite o seu código de backup da nuvem:");
      if (!inputCode || !inputCode.trim()) {
        return;
      }
      codeToUse = inputCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    }

    setLoadingBackups(true);
    setStatusMessage({
      text: 'Conectando com a nuvem para recuperar seu backup...',
      type: 'success'
    });

    try {
      // 1. Tentar ler do Firestore usando o SDK do cliente primeiro
      let parsed: any = null;
      try {
        const docRef = doc(db, 'frotas', codeToUse);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          if (docData && docData.dados) {
            parsed = JSON.parse(docData.dados);
          }
        }
      } catch (err) {
        console.warn('Falha ao ler diretamente do Firestore SDK, tentando API do servidor...', err);
      }

      // 2. Se falhou pelo SDK, usar API do servidor como fallback
      if (!parsed) {
        const res = await fetch(`/api/sync/load/${codeToUse}`);
        if (res.ok) {
          const loadData = await res.json();
          if (loadData.success && loadData.dados) {
            parsed = loadData.dados;
          }
        }
      }

      if (!parsed) {
        alert('Código de backup não localizado na nuvem ou nenhum dado foi encontrado.');
        setStatusMessage({
          text: 'Não foi possível encontrar nenhum backup na nuvem para este código.',
          type: 'error'
        });
        return;
      }

      let b: any = null;
      if (parsed && Array.isArray(parsed.backups) && parsed.backups.length > 0) {
        // Se houver uma seleção no select dropdown e ela corresponder a um index válido, usamos.
        // Caso contrário, tentamos usar o backup mais recente que contenha manutenções para evitar carregar backups vazios/modelo
        if (selectedBackupIndex !== null && parsed.backups[selectedBackupIndex]) {
          b = parsed.backups[selectedBackupIndex];
        } else {
          const backupValido = parsed.backups.find((item: any) => item.manutencoes && item.manutencoes.length > 0);
          b = backupValido || parsed.backups[0]; // Último backup lançado como último fallback
        }
      } else if (parsed && parsed.veiculos) {
        b = {
          id: 'old-1',
          data_criacao: parsed.updatedAt || new Date().toISOString(),
          label: 'Backup Anterior',
          veiculos: parsed.veiculos,
          manutencoes: parsed.manutencoes,
          custoPadraoDiario: parsed.custoPadraoDiario || 150,
          shopping_list: parsed.shopping_list || [],
          avarias: parsed.avarias || {},
          opcoesManutencao: parsed.opcoesManutencao || []
        };
      }

      if (!b) {
        alert('Nenhum backup encontrado no banco de dados para este código.');
        setStatusMessage({
          text: 'Nenhum backup encontrado.',
          type: 'error'
        });
        return;
      }

      if (window.confirm(`Deseja realmente restaurar o Backup do dia ${b.label}? Isso substituirá todos os seus dados atuais.`)) {
        // Grava o código recuperado no estado e no localStorage do código
        setCodigoFrota(codeToUse);
        localStorage.setItem('recuperar_codigo_frota', codeToUse);

        onRestoreBackup({
          veiculos: b.veiculos || [],
          manutencoes: b.manutencoes || [],
          custoPadraoDiario: b.custoPadraoDiario || 150,
          shopping_list: b.shopping_list || [],
          avarias: b.avarias || {},
          opcoesManutencao: b.opcoesManutencao || []
        });

        setStatusMessage({
          text: `Backup (${b.label}) importado com sucesso!`,
          type: 'success'
        });
      } else {
        setStatusMessage(null);
      }
    } catch (err: any) {
      console.error("Erro ao importar do Firestore:", err);
      alert("Erro ao comunicar com a nuvem: " + (err.message || err));
      setStatusMessage({
        text: 'Erro de comunicação com a nuvem.',
        type: 'error'
      });
    } finally {
      setLoadingBackups(false);
    }
  };

  // Obter itens da lista de compras para incluir no backup
  const obterItensShoppingList = () => {
    return shoppingList;
  };

  // Helper para ler itens adicionais de forma segura
  const obterLocalStorageData = (key: string, fallback: any) => {
    if (key === 'frigofrota_avarias') return avarias;
    if (key === 'frigofrota_opcoes_manutencao') return opcoesManutencao;
    return fallback;
  };

  const handleExportBackup = () => {
    try {
      const shopList = obterItensShoppingList();
      const avs = obterLocalStorageData('frigofrota_avarias', {});
      const opts = obterLocalStorageData('frigofrota_opcoes_manutencao', []);

      const backupData = {
        frigofrota_backup: true,
        data_criacao: new Date().toISOString(),
        veiculos,
        manutencoes,
        custoPadraoDiario,
        shopping_list: shoppingList,
        avarias: avarias,
        opcoesManutencao: opcoesManutencao
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const blobUrl = URL.createObjectURL(blob);
      
      const now = new Date();
      const dia = String(now.getDate()).padStart(2, '0');
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      const ano = now.getFullYear();
      const dataBr = `${dia}-${mes}-${ano}`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', blobUrl);
      downloadAnchor.setAttribute('download', `Recuperar_Backup_${dataBr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      
      // Cleanup
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(blobUrl);

      setStatusMessage({
        text: 'Backup exportado com sucesso! Salve o arquivo gerado em um local seguro.',
        type: 'success'
      });
    } catch (error) {
      console.error(error);
      setStatusMessage({
        text: 'Erro ao gerar ou baixar o arquivo de backup. Tente novamente.',
        type: 'error'
      });
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // limpa valor anterior
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validação mínima da estrutura de backup
        if (
          !parsed || 
          typeof parsed !== 'object' || 
          parsed.frigofrota_backup !== true || 
          !Array.isArray(parsed.veiculos) || 
          !Array.isArray(parsed.manutencoes)
        ) {
          throw new Error('Arquivo de backup inválido ou incompatível.');
        }

        // Restaurar dados via callback
        onRestoreBackup({
          veiculos: parsed.veiculos,
          manutencoes: parsed.manutencoes,
          custoPadraoDiario: parsed.custoPadraoDiario || 150,
          shopping_list: Array.isArray(parsed.shopping_list) ? parsed.shopping_list : [],
          avarias: parsed.avarias || {},
          opcoesManutencao: parsed.opcoesManutencao || []
        });

        setStatusMessage({
          text: `Backup restaurado com sucesso! Importados ${parsed.veiculos.length} caminhões e ${parsed.manutencoes.length} manutenções.`,
          type: 'success'
        });

      } catch (error: any) {
        setStatusMessage({
          text: error.message || 'Erro ao processar arquivo de backup. Certifique-se de que é um arquivo .json válido gerado pelo Frigofrota.',
          type: 'error'
        });
      } finally {
        // Resetar o input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setStatusMessage({
        text: 'Erro ao ler o arquivo selecionado.',
        type: 'error'
      });
    };

    reader.readAsText(file);
  };

  const shoppingListLength = obterItensShoppingList().length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in px-2 sm:px-0">
      {/* Botão de Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-medium bg-[#1e293b] border border-slate-800 px-4 py-2.5 sm:py-2 rounded-xl w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 text-sky-450" />
          Voltar para o Painel
        </button>
        <span className="text-xs text-slate-500 font-mono text-center sm:text-right">
          Segurança local de dados
        </span>
      </div>

      {/* Card Principal de Backup */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Header decorativo */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="p-3 bg-gradient-to-br from-amber-600/20 to-yellow-600/20 text-amber-500 rounded-xl border border-amber-500/20 shrink-0">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight">CÓPIA DE SEGURANÇA</h2>
            <p className="text-xs text-slate-350 mt-0.5">Importe ou exporte os caminhões, manutenções, tarifas e suprimentos da sua oficina</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Mensagem de Feedback */}
          {statusMessage && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p className="font-semibold">{statusMessage.type === 'success' ? 'Sucesso' : 'Falha na Operação'}</p>
                <p className="text-xs mt-0.5 text-slate-300">{statusMessage.text}</p>
              </div>
            </div>
          )}

          {/* SEÇÃO DE CÓDIGO DA OFICINA / VINCULAR CONTA ANTERIOR */}
          <div className="bg-[#020617]/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
                <Database className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-xs uppercase tracking-wider">Vincular Código da Oficina (Recuperar Conta)</h3>
                <p className="text-[11px] text-slate-400">Insira seu código de backup da nuvem anterior caso você tenha limpo os dados do Chrome.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={tempCode}
                  onChange={(e) => setTempCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="EX: FRIGO-XXXXXX"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold uppercase focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                />
              </div>
              <button
                type="button"
                onClick={handleVincularCodigo}
                disabled={syncStatus === 'syncing' || loadingBackups}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-55"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loadingBackups ? 'animate-spin' : ''}`} />
                Vincular &amp; Conectar
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500 border-t border-slate-800/65 pt-2 font-medium">
              <span>
                Código ativo atual: <strong className="text-sky-400 font-mono text-[11px]">{codigoFrota || 'NENHUM'}</strong>
              </span>
              <span>
                ⚠️ Mudar o código atualizará os backups exibidos abaixo.
              </span>
            </div>
          </div>

          {/* SEÇÃO PRINCIPAL DE SINCRONIZAÇÃO EM NUVEM (EXPORTAR/IMPORTAR CLOUD SYNC) */}
          <div className="bg-[#020617] border border-sky-500/30 rounded-xl p-5 shadow-inner space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
                <Cloud className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">Backups registrados na nuvem</h3>
                <p className="text-[11px] text-slate-400">Exporte ou importe seu backup na nuvem de forma simples e rápida.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Selecione um Backup</label>
              <div className="flex gap-2">
                <select
                  value={selectedBackupIndex ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedBackupIndex(val !== "" ? Number(val) : null);
                  }}
                  className="flex-1 bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-sky-400 font-semibold focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 cursor-pointer"
                >
                  <option value="">-- Selecione um Backup --</option>
                  {backupsNuvem.map((b, idx) => (
                    <option key={b.id || idx} value={idx}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={fetchBackupsNuvem}
                  disabled={loadingBackups}
                  title="Atualizar lista de backups"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-350 p-2.5 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingBackups ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Selecione o backup desejado e clique no botão &quot;Importar Backup da Nuvem&quot; para restaurar todos os dados.</p>
            </div>

            {/* Ações de sincronização */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={async () => {
                  await onSincronizarComNuvem();
                  await fetchBackupsNuvem();
                }}
                disabled={syncStatus === 'syncing'}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 text-slate-950 font-bold text-xs py-2.5 rounded-lg transition-all cursor-pointer"
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudLightning className="w-3.5 h-3.5" />
                )}
                Exportar Backup na Nuvem
              </button>

              <button
                type="button"
                onClick={handleImportCloudBackup}
                disabled={syncStatus === 'syncing' || loadingBackups}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-slate-800 disabled:opacity-50 text-slate-200 border border-slate-700 font-bold text-xs py-2.5 rounded-lg transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-450" />
                Importar Backup da Nuvem
              </button>
            </div>

            {/* Status e Erros */}
            {syncStatus === 'syncing' && (
              <p className="text-xs text-sky-400 flex items-center gap-1.5 animate-pulse justify-center">
                <Wifi className="w-3.5 h-3.5 animate-bounce" /> Comunicando com a nuvem...
              </p>
            )}
            {syncStatus === 'success' && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 justify-center font-semibold">
                <ShieldCheck className="w-4 h-4 animate-bounce" /> Operação realizada e salva em nuvem com sucesso!
              </p>
            )}
            {syncStatus === 'error' && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5 justify-center font-semibold text-center">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {syncError || 'Falha ao sincronizar com a nuvem.'}
              </p>
            )}
          </div>

          {/* Resumo da base atual */}
          <div className="bg-[#020617]/50 rounded-xl border border-slate-800 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resumo da Base de Dados de Hoje</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2 bg-[#1e293b]/40 p-2.5 rounded-lg border border-slate-800/80">
                <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                <span className="text-slate-300">Caminhões: <strong className="text-white">{veiculos.length}</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-[#1e293b]/40 p-2.5 rounded-lg border border-slate-800/80">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-slate-300">Manutenções: <strong className="text-white">{manutencoes.length}</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-[#1e293b]/40 p-2.5 rounded-lg border border-slate-800/80">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-slate-300">Valor Fixo: <strong className="text-white">R$ {custoPadraoDiario.toFixed(2)}</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-[#1e293b]/40 p-2.5 rounded-lg border border-slate-800/80">
                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                <span className="text-slate-300">Lista Compras: <strong className="text-white">{shoppingListLength} itens</strong></span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
            <p>💡 <strong className="text-slate-300">Importante:</strong> Ao fazer a importação de um backup anterior, as informações atualmente inseridas no aplicativo serão <strong className="text-amber-400">substituídas</strong> pelos dados do arquivo.</p>
            <p>📂 O arquivo gerado está no formato JSON padronizado e seguro, sem risco de expor suas senhas ou contas.</p>
          </div>

          {/* Compartimento de Botões de Ação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Botão de Exportar */}
            <button
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-bold text-sm px-6 py-4 rounded-xl transition-all shadow-md cursor-pointer border border-slate-700"
            >
              <Download className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <p>Exportar Backup</p>
                <p className="text-[10px] text-slate-400 font-normal">Baixar dados em arquivo JSON</p>
              </div>
            </button>

            {/* Botão de Importar */}
            <button
              onClick={handleImportClick}
              className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm px-6 py-4 rounded-xl transition-all shadow-md cursor-pointer border border-transparent shadow-amber-500/10"
            >
              <Upload className="w-5 h-5" />
              <div className="text-left">
                <p>Importar Backup</p>
                <p className="text-[10px] text-amber-100 font-normal">Restaurar dados de arquivo JSON</p>
              </div>
            </button>

            {/* Input File off-screen altamente compatível com todos os celulares e navegadores */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json,text/plain"
              className="sr-only"
            />
          </div>


        </div>
      </div>
    </div>
  );
}
