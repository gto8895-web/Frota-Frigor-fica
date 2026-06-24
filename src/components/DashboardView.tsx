import React, { useState } from 'react';
import { Veiculo } from '../types';
import { Truck, ShoppingBag, DollarSign, Edit2, Check, X, Database, Cloud, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DashboardViewProps {
  veiculos: Veiculo[];
  custoPadraoDiario: number;
  onUpdateCustoPadraoDiario: (novoCusto: number) => void;
  onNavigate: (tab: 'dashboard' | 'veiculos' | 'manutencoes' | 'orcamento' | 'compras' | 'backup') => void;
  codigoFrota: string;
  setCodigoFrota: (code: string) => void;
  onCarregarDaNuvem: (code: string) => Promise<any>;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
}

export default function DashboardView({
  veiculos,
  custoPadraoDiario,
  onUpdateCustoPadraoDiario,
  onNavigate,
  codigoFrota,
  setCodigoFrota,
  onCarregarDaNuvem,
  syncStatus,
  syncError
}: DashboardViewProps) {
  const totalVeiculos = veiculos.length;
  
  // Local states for editing the standard rate inline
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(custoPadraoDiario.toString());
  const [inputCodigo, setInputCodigo] = useState('');
  const [showRestoreWidget, setShowRestoreWidget] = useState(true);

  const handleSave = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const parsed = parseFloat(tempValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateCustoPadraoDiario(parsed);
    }
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const handleRestoreFromDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCodigo.trim()) return;
    setCodigoFrota(inputCodigo.trim().toUpperCase());
    await onCarregarDaNuvem(inputCodigo.trim());
  };

  return (
    <div className="space-y-6">
      {/* Header com Boas-vindas */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-950 text-[#f8fafc] rounded-2xl p-6 md:p-8 border border-slate-800/80 shadow-md">
        <div className="max-w-3xl">
          <h1 className="text-2xl md:text-4xl font-display font-bold mt-2 text-white text-sans tracking-tight">
            CONTROLE DE FROTA FRIGORÍFICA
          </h1>
        </div>
      </div>

      {/* Widget de Recuperação da Nuvem se o código local estiver vazio */}
      {!codigoFrota && showRestoreWidget && (
        <div className="bg-[#020617] border border-sky-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <button 
              onClick={() => setShowRestoreWidget(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Dispensar sugestão"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shrink-0">
                <Cloud className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-display font-bold text-white text-sm">Seus dados já estão salvos na Nuvem!</h3>
                <p className="text-xs text-slate-350 leading-relaxed max-w-xl">
                  Se você limpou o cache do Chrome ou está acessando de outro celular, digite o seu <strong className="text-sky-400">Código da sua Frota</strong> abaixo para recuperar todos os caminhões e manutenções na hora.
                </p>
              </div>
            </div>
            <form onSubmit={handleRestoreFromDashboard} className="flex flex-col sm:flex-row gap-2 shrink-0 md:max-w-xs w-full">
              <input
                type="text"
                value={inputCodigo}
                onChange={(e) => setInputCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                placeholder="Ex: FROTA-ABC"
                className="bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-sky-400 uppercase placeholder:text-slate-500 focus:outline-none focus:border-sky-400 w-full"
                maxLength={15}
              />
              <button
                type="submit"
                disabled={syncStatus === 'syncing' || !inputCodigo.trim()}
                className="bg-sky-400 hover:bg-sky-300 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                Restaurar
              </button>
            </form>
          </div>
          {syncStatus === 'success' && (
            <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/15">
              <ShieldCheck className="w-4 h-4 shrink-0" /> Sincronização restaurada com sucesso! Todos os seus dados foram recarregados.
            </div>
          )}
          {syncStatus === 'error' && (
            <div className="mt-3 text-xs text-rose-400 flex items-center gap-1.5 font-medium bg-rose-500/5 p-2 rounded-lg border border-rose-500/15">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {syncError || 'Código inválido ou erro ao se conectar com a nuvem.'}
            </div>
          )}
        </div>
      )}

      {/* Grid de Estatísticas Rápidas e Botões Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        
        {/* Card 1: Frota Total */}
        <div 
          onClick={() => onNavigate('veiculos')} 
          className="bg-[#1e293b] rounded-xl p-5 border border-slate-800 shadow-sm hover:shadow-md hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between h-[115px]"
        >
          <div className="flex justify-between items-center h-full">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frota Total</p>
              <h3 className="text-2xl md:text-3xl font-display font-bold mt-1 text-white group-hover:text-sky-400 transition-colors">
                {totalVeiculos} {totalVeiculos === 1 ? 'CAMINHÃO' : 'CAMINHÕES'}
              </h3>
            </div>
            <div className="p-3 bg-[#020617] border border-slate-800/80 rounded-lg">
              <Truck className="w-5 h-5 text-sky-450" />
            </div>
          </div>
        </div>

        {/* Card 2: Lista de Compras */}
        <div 
          onClick={() => onNavigate('compras')} 
          className="bg-[#1e293b] rounded-xl p-5 border border-slate-800 shadow-sm hover:shadow-md hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between h-[115px]"
        >
          <div className="flex justify-between items-center h-full">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suprimentos</p>
              <h3 className="text-2xl md:text-3xl font-display font-bold mt-1 text-white group-hover:text-emerald-450 transition-colors">
                LISTA DE COMPRAS
              </h3>
            </div>
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-emerald-440" />
            </div>
          </div>
        </div>

        {/* Coluna 3: Valor Fixo e Backup */}
        <div className="space-y-4 w-full">
          {/* Card 3: Valor Fixo */}
          <div 
            onClick={() => {
              if (!isEditing) {
                setTempValue(custoPadraoDiario.toString());
                setIsEditing(true);
              }
            }} 
            className={`bg-[#1e293b] rounded-xl p-5 border shadow-sm transition-all flex flex-col justify-between h-[115px] ${
              isEditing 
                ? 'border-sky-500 bg-[#1e293b]/90' 
                : 'border-slate-800 hover:shadow-md hover:border-slate-700 cursor-pointer group'
            }`}
          >
            <div className="flex justify-between items-center h-full w-full">
              <div className="flex-1 mr-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor Fixo</p>
                
                {isEditing ? (
                  <form 
                    onSubmit={handleSave}
                    onClick={(e) => e.stopPropagation()} 
                    className="flex items-center gap-1.5 mt-1"
                  >
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs text-slate-400 font-bold">R$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave();
                          if (e.key === 'Escape') setIsEditing(false);
                        }}
                        className="bg-[#020617]/90 border border-slate-700 text-white font-bold text-sm rounded-lg pl-8 pr-2 py-1 w-24 focus:outline-none focus:border-sky-500"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors cursor-pointer"
                      title="Confirmar"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-white group-hover:text-yellow-450 transition-colors">
                      R$ {custoPadraoDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <Edit2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-yellow-950/20 border border-yellow-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Card: Backup */}
          <div 
            onClick={() => onNavigate('backup')} 
            className="bg-[#1e293b] rounded-xl p-5 border border-slate-800 shadow-sm hover:shadow-md hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between h-[115px]"
          >
            <div className="flex justify-between items-center h-full w-full">
              <div className="flex-1 mr-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sistema de Segurança</p>
                <h3 className="text-2xl md:text-3xl font-display font-bold mt-1 text-white group-hover:text-amber-400 transition-colors">
                  BACKUP
                </h3>
              </div>
              <div className="p-3 bg-amber-950/25 border border-amber-800/40 rounded-lg shrink-0">
                <Database className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
