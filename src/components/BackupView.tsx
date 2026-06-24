import React, { useState, useRef } from 'react';
import { Database, ArrowLeft, Download, Upload, CheckCircle, AlertTriangle, FileJson, Clock, RefreshCw, Cloud, CloudLightning, ShieldCheck, Wifi, HelpCircle } from 'lucide-react';
import { Veiculo, Manutencao } from '../types';

interface BackupViewProps {
  veiculos: Veiculo[];
  manutencoes: Manutencao[];
  custoPadraoDiario: number;
  onRestoreBackup: (data: {
    veiculos: Veiculo[];
    manutencoes: Manutencao[];
    custoPadraoDiario: number;
    shopping_list?: any[];
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

  const [nomeEmpresa, setNomeEmpresa] = useState<string>(() => {
    return localStorage.getItem('recuperar_nome_empresa') || '';
  });
  const [frotasExistentes, setFrotasExistentes] = useState<{ codigo: string; nomeEmpresa: string; updatedAt?: string }[]>([]);
  const [loadingFrotas, setLoadingFrotas] = useState(false);

  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('frigofrota_auto_backup_sabado_enabled') !== 'false';
  });
  const [autoBackupsList, setAutoBackupsList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('frigofrota_auto_backups_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleAutoBackup = (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    localStorage.setItem('frigofrota_auto_backup_sabado_enabled', String(enabled));
    setStatusMessage({
      text: enabled 
        ? 'Backup Automático de Sábado ativado com sucesso! Toda semana às 21:00 o sistema salvará os seus dados automaticamente.' 
        : 'Backup Automático de Sábado desativado.',
      type: 'success'
    });
  };

  const handleRestoreAutoBackup = (backupItem: any) => {
    if (window.confirm(`Tem certeza que deseja restaurar o backup automático referente a ${backupItem.data_referencia_sabado}? Isso substituirá todos os dados atuais.`)) {
      onRestoreBackup({
        veiculos: backupItem.veiculos,
        manutencoes: backupItem.manutencoes,
        custoPadraoDiario: backupItem.custoPadraoDiario,
        shopping_list: backupItem.shopping_list || []
      });

      if (backupItem.shopping_list) {
        localStorage.setItem('frigofrota_shopping_list', JSON.stringify(backupItem.shopping_list));
      }
      if (backupItem.avarias) {
        localStorage.setItem('frigofrota_avarias', JSON.stringify(backupItem.avarias));
      }
      if (backupItem.opcoesManutencao) {
        localStorage.setItem('frigofrota_opcoes_manutencao', JSON.stringify(backupItem.opcoesManutencao));
      }

      setStatusMessage({
        text: 'Backup automático restaurado com sucesso! Recarregando painel...',
        type: 'success'
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleDownloadAutoBackup = (backupItem: any) => {
    try {
      const backupData = {
        frigofrota_backup: true,
        data_criacao: backupItem.data_criacao,
        veiculos: backupItem.veiculos,
        manutencoes: backupItem.manutencoes,
        custoPadraoDiario: backupItem.custoPadraoDiario,
        shopping_list: backupItem.shopping_list || [],
        avarias: backupItem.avarias || {},
        opcoesManutencao: backupItem.opcoesManutencao || []
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const blobUrl = URL.createObjectURL(blob);

      const now = new Date(backupItem.id);
      const dia = String(now.getDate()).padStart(2, '0');
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      const ano = now.getFullYear();
      const dataBr = `${dia}-${mes}-${ano}`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', blobUrl);
      downloadAnchor.setAttribute('download', `Recuperar_Backup_${dataBr}_AUTO.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(blobUrl);

      setStatusMessage({
        text: 'Arquivo de backup automático baixado com sucesso!',
        type: 'success'
      });
    } catch (e) {
      console.error(e);
      setStatusMessage({
        text: 'Erro ao baixar backup automático.',
        type: 'error'
      });
    }
  };

  const handleDeleteAutoBackup = (id: string) => {
    if (window.confirm('Deseja realmente excluir este ponto de restaurar automático da lista?')) {
      const updated = autoBackupsList.filter((b: any) => b.id !== id);
      setAutoBackupsList(updated);
      localStorage.setItem('frigofrota_auto_backups_list', JSON.stringify(updated));
      setStatusMessage({
        text: 'Ponto de restauração automático excluído com sucesso.',
        type: 'success'
      });
    }
  };

  React.useEffect(() => {
    const fetchFrotas = async () => {
      setLoadingFrotas(true);
      try {
        const res = await fetch('/api/sync/fleets');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.frotas) {
            setFrotasExistentes(data.frotas);
          }
        }
      } catch (e) {
        console.error('Erro ao buscar frotas:', e);
      } finally {
        setLoadingFrotas(false);
      }
    };
    fetchFrotas();
  }, []);

  const handleNomeEmpresaChange = (val: string) => {
    setNomeEmpresa(val);
    localStorage.setItem('recuperar_nome_empresa', val);
  };

  // Obter itens da lista de compras do localStorage para incluir no backup
  const obterItensShoppingList = () => {
    try {
      const saved = localStorage.getItem('frigofrota_shopping_list');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  // Helper para ler itens adicionais do localStorage de forma segura
  const obterLocalStorageData = (key: string, fallback: any) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const handleExportBackup = () => {
    try {
      const shoppingList = obterItensShoppingList();
      const avarias = obterLocalStorageData('frigofrota_avarias', {});
      const opcoesManutencao = obterLocalStorageData('frigofrota_opcoes_manutencao', []);

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
          shopping_list: Array.isArray(parsed.shopping_list) ? parsed.shopping_list : []
        });

        // Caso haja itens da lista de compras, salvar no localStorage
        if (Array.isArray(parsed.shopping_list)) {
          localStorage.setItem('frigofrota_shopping_list', JSON.stringify(parsed.shopping_list));
        }

        // Caso haja checklists de avarias, salvar no localStorage
        if (parsed.avarias) {
          localStorage.setItem('frigofrota_avarias', JSON.stringify(parsed.avarias));
        }

        // Caso haja opções customizadas de manutenção, salvar no localStorage
        if (parsed.opcoesManutencao) {
          localStorage.setItem('frigofrota_opcoes_manutencao', JSON.stringify(parsed.opcoesManutencao));
        }

        setStatusMessage({
          text: `Backup restaurado com sucesso! Importados ${parsed.veiculos.length} caminhões e ${parsed.manutencoes.length} manutenções. Atualizando o painel...`,
          type: 'success'
        });

        // Força uma atualização limpa para recarregar todos os componentes com dados novos do localStorage
        setTimeout(() => {
          window.location.reload();
        }, 1500);

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

          {/* SEÇÃO PRINCIPAL DE SINCRONIZAÇÃO EM NUVEM (RECUPERAR CLOUD SYNC) */}
          <div className="bg-[#020617] border border-sky-500/30 rounded-xl p-5 shadow-inner space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
                <Cloud className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">RECUPERAR — Sincronização em Nuvem</h3>
                <p className="text-[11px] text-slate-400">Salve seus dados na nuvem e recupere instantaneamente em qualquer aparelho celular se limpar o Chrome.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome da Empresa / Seu Nome</label>
                <input
                  type="text"
                  maxLength={40}
                  value={nomeEmpresa}
                  onChange={(e) => handleNomeEmpresaChange(e.target.value)}
                  placeholder="Ex: Transportadora FrigoSul"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 font-medium"
                />
                <p className="text-[10px] text-slate-500 mt-1">Identifica sua frota facilmente em caso de perda de cache do Chrome.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Código da sua Frota</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={15}
                    value={codigoFrota}
                    onChange={(e) => setCodigoFrota(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    placeholder="Ex: FROTA-ABC"
                    className="flex-1 bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-sky-400 uppercase focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rand = 'FR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                      setCodigoFrota(rand);
                    }}
                    title="Gerar código aleatório"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold px-2.5 rounded-lg text-xs border border-slate-700 transition-colors cursor-pointer"
                  >
                    Gerar
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Insira um código para identificação exclusiva.</p>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer bg-[#1e293b]/40 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="w-4 h-4 text-sky-400 bg-[#020617] border-slate-700 rounded focus:ring-sky-400 focus:ring-offset-[#1e293b]"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-200">Sincronização Automática</p>
                    <p className="text-[10px] text-slate-400">Salva na nuvem a cada alteração em tempo real</p>
                  </div>
                </label>
              </div>
            </div>

            {frotasExistentes.length > 0 && (
              <div className="border-t border-slate-800/85 pt-4 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Frotas já Registradas na Nuvem:</label>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      if (selectedCode) {
                        setCodigoFrota(selectedCode);
                        const matched = frotasExistentes.find(f => f.codigo === selectedCode);
                        if (matched && matched.nomeEmpresa) {
                          handleNomeEmpresaChange(matched.nomeEmpresa);
                        }
                      }
                    }}
                    className="flex-1 bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-sky-400 font-semibold focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 cursor-pointer"
                  >
                    <option value="">-- Selecione uma Frota Registrada na Nuvem para preencher os campos --</option>
                    {frotasExistentes.filter(f => f.codigo !== '_REGISTRY').map((f) => (
                      <option key={f.codigo} value={f.codigo}>
                        {f.nomeEmpresa ? `${f.nomeEmpresa} [${f.codigo}]` : f.codigo}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Selecione acima e clique no botão &quot;Recuperar Dados da Nuvem&quot; para restaurar.</p>
              </div>
            )}

            {/* Ações de sincronização */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onSincronizarComNuvem()}
                disabled={syncStatus === 'syncing' || !codigoFrota.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 text-slate-950 font-bold text-xs py-2.5 rounded-lg transition-all cursor-pointer"
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudLightning className="w-3.5 h-3.5" />
                )}
                Salvar Frota na Nuvem
              </button>

              <button
                type="button"
                onClick={() => onCarregarDaNuvem(codigoFrota)}
                disabled={syncStatus === 'syncing' || !codigoFrota.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-slate-800 disabled:opacity-50 text-slate-200 border border-slate-700 font-bold text-xs py-2.5 rounded-lg transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-450" />
                Recuperar Dados da Nuvem
              </button>
            </div>

            {/* Status e Erros */}
            {syncStatus === 'syncing' && (
              <p className="text-xs text-sky-400 flex items-center gap-1.5 animate-pulse justify-center">
                <Wifi className="w-3.5 h-3.5 animate-bounce" /> Comunicando com a nuvem RECUPERAR...
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

          {/* SEÇÃO DE BACKUP AUTOMÁTICO DE SÁBADO ÀS 21:00 */}
          <div className="bg-[#020617]/40 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-xs uppercase tracking-wider">Backup Automático Semanal</h3>
                  <p className="text-[10px] text-slate-400">Ponto de restauração congelado todo Sábado às 21:00</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBackupEnabled}
                  onChange={(e) => handleToggleAutoBackup(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-850 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950 peer-checked:after:border-transparent"></div>
                <span className="ml-2 text-xs font-semibold text-slate-300">
                  {autoBackupEnabled ? 'Ativo' : 'Inativo'}
                </span>
              </label>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Com este recurso ativado, se o aplicativo estiver aberto ou quando você acessá-lo após o horário, o sistema gera automaticamente uma cópia congelada de segurança local para que você possa restaurá-la a qualquer momento em caso de perda de dados.
            </p>

            {/* Lista de Backups Automáticos */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pontos de Restauração Salvos ({autoBackupsList.length}/10):</label>
              
              {autoBackupsList.length === 0 ? (
                <div className="bg-[#1e293b]/25 border border-dashed border-slate-800 rounded-lg p-4 text-center text-xs text-slate-500 font-sans">
                  Nenhum backup automático criado ainda. O sistema salvará uma cópia automaticamente no próximo sábado às 21:00 se houver dados ativos.
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {autoBackupsList.map((item: any) => (
                    <div key={item.id} className="bg-[#1e293b]/45 border border-slate-800/80 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700/60 transition-colors">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          <p className="text-xs font-bold text-slate-200">Sábado, {item.data_referencia_sabado}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {item.veiculos?.length || 0} Caminhões • {item.manutencoes?.length || 0} Manutenções • R$ {item.custoPadraoDiario || 150} diário
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleRestoreAutoBackup(item)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2 py-1.5 rounded text-[10px] transition-all cursor-pointer"
                          title="Restaurar este ponto"
                        >
                          Restaurar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadAutoBackup(item)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white border border-slate-700 px-2 py-1.5 rounded text-[10px] transition-all cursor-pointer flex items-center gap-1"
                          title="Baixar arquivo JSON"
                        >
                          <Download className="w-3 h-3 text-amber-500" />
                          JSON
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAutoBackup(item.id)}
                          className="bg-rose-950/35 hover:bg-rose-900/60 text-rose-400 px-2 py-1.5 rounded text-[10px] transition-all cursor-pointer"
                          title="Excluir da lista"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
