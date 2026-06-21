import React, { useState, useRef } from 'react';
import { Database, ArrowLeft, Download, Upload, CheckCircle, AlertTriangle, FileJson, Clock, RefreshCw } from 'lucide-react';
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
  onBack: () => void;
}

export default function BackupView({
  veiculos,
  manutencoes,
  custoPadraoDiario,
  onRestoreBackup,
  onBack
}: BackupViewProps) {
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obter itens da lista de compras do localStorage para incluir no backup
  const obterItensShoppingList = () => {
    try {
      const saved = localStorage.getItem('frigofrota_shopping_list');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const handleExportBackup = () => {
    try {
      const shoppingList = obterItensShoppingList();
      const backupData = {
        frigofrota_backup: true,
        data_criacao: new Date().toISOString(),
        veiculos,
        manutencoes,
        custoPadraoDiario,
        shopping_list: shoppingList
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement('a');
      const dataIso = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `frigofrota_backup_${dataIso}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

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

            {/* Input File oculto para carregar JSON */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
