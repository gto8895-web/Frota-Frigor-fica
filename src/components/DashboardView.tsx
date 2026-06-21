import React, { useState } from 'react';
import { Veiculo } from '../types';
import { Truck, ShoppingBag, DollarSign, Edit2, Check, X, Database } from 'lucide-react';

interface DashboardViewProps {
  veiculos: Veiculo[];
  custoPadraoDiario: number;
  onUpdateCustoPadraoDiario: (novoCusto: number) => void;
  onNavigate: (tab: 'dashboard' | 'veiculos' | 'manutencoes' | 'orcamento' | 'compras' | 'backup') => void;
}

export default function DashboardView({
  veiculos,
  custoPadraoDiario,
  onUpdateCustoPadraoDiario,
  onNavigate
}: DashboardViewProps) {
  const totalVeiculos = veiculos.length;
  
  // Local states for editing the standard rate inline
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(custoPadraoDiario.toString());

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
