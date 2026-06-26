import React, { useState } from 'react';
import { Veiculo, Manutencao, StatusManutencao } from '../types';
import { Wrench, Trash2, Calendar, Filter, Pencil } from 'lucide-react';
import { LogoMarca } from './VehiclesView';

// Brazilian License Plate Component
export function PlacaMercosul({ placa }: { placa: string }) {
  const formatPlaca = (p: string) => {
    let text = (p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (text.length > 7) text = text.substring(0, 7);
    return text;
  };

  const placaFormatada = formatPlaca(placa);

  return (
    <div className="inline-flex flex-col w-[145px] border-2 border-blue-600 rounded-[4px] overflow-hidden bg-white shadow-md select-none scale-90 origin-left">
      {/* Blue Top Band */}
      <div className="bg-[#0051A3] text-white px-2 py-0.5 flex items-center justify-between text-[7px] font-bold tracking-wider leading-none select-none h-4">
        <span className="text-[5px] text-blue-200">✨</span>
        <span className="uppercase text-[8.5px] font-sans font-extrabold tracking-widest text-center flex-1">BRASIL</span>
        <span className="text-[8.5px] leading-none">🇧🇷</span>
      </div>
      {/* Plate Body */}
      <div className="bg-white px-1 py-0 flex items-center justify-center relative h-8 border-t-2 border-blue-600">
        <span className="absolute left-1 bottom-0.5 text-[5px] text-[#0051A3] font-bold font-sans">BR</span>
        <span className="text-[21px] font-plate font-bold tracking-wider text-slate-950 leading-none relative -translate-y-[3px]">
          {placaFormatada}
        </span>
      </div>
    </div>
  );
}

interface MaintenanceViewProps {
  manutencoes: Manutencao[];
  veiculos: Veiculo[];
  onAddMaintenance: (m: Omit<Manutencao, 'id'>) => void;
  onUpdateMaintenanceStatus: (id: string, status: StatusManutencao) => void;
  onDeleteMaintenance: (id: string, idsOriginais?: string[]) => void;
  onUpdateMaintenance: (id: string, updates: { descricao: string; custo: number }, idsOriginais?: string[]) => void;
  dataReferencia: string;
}

interface GroupedManutencao extends Manutencao {
  idsOriginais: string[];
  descricoes: string[];
}

export default function MaintenanceView({
  manutencoes,
  veiculos,
  onDeleteMaintenance,
  onUpdateMaintenance
}: MaintenanceViewProps) {
  const [selecaoVeiculoId, setSelecaoVeiculoId] = useState('todos');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoDescricao, setEditandoDescricao] = useState<string>('');
  const [editandoCusto, setEditandoCusto] = useState<string>('0');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Função para agrupar manutenções do mesmo veículo na mesma data
  const agruparManutencoes = (lista: Manutencao[]): GroupedManutencao[] => {
    const grupos: { [chave: string]: Manutencao[] } = {};
    
    lista.forEach(m => {
      const key = `${m.veiculoId}_${m.data}`;
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(m);
    });

    return Object.values(grupos).map(membros => {
      // Ordenação estável por ID descentente para definir o principal do grupo
      const ordinario = [...membros].sort((a, b) => b.id.localeCompare(a.id));
      const principal = ordinario[0];
      const descricoesLimpas = ordinario.map(item => item.descricao.trim());

      if (ordinario.length === 1) {
        return {
          ...principal,
          idsOriginais: [principal.id],
          descricoes: [principal.descricao.trim()]
        };
      }

      // O valor cobrado é por caminhão (1 valor fixo, não a soma das quantidades de manutenção)
      const custoTotal = ordinario.length > 0 ? Math.max(...ordinario.map(item => item.custo)) : 0;

      // Concatena descrições com " • "
      const descricaoConsolidada = descricoesLimpas.join(' • ');

      // Consolidar status
      let statusConsolidado = principal.status;
      if (ordinario.some(item => item.status === 'em_andamento')) {
        statusConsolidado = 'em_andamento';
      } else if (ordinario.every(item => item.status === 'concluida')) {
        statusConsolidado = 'concluida';
      } else if (ordinario.some(item => item.status === 'concluida')) {
        statusConsolidado = 'em_andamento';
      }

      return {
        ...principal,
        descricao: descricaoConsolidada,
        custo: custoTotal,
        status: statusConsolidado,
        idsOriginais: ordinario.map(item => item.id),
        descricoes: descricoesLimpas
      };
    });
  };

  // Filtrar as manutenções com base no veículo selecionado
  const manutencoesFiltradas = manutencoes.filter(m => {
    // Filtro por veículo selecionado no dropdown
    if (selecaoVeiculoId !== 'todos') {
      if (m.veiculoId !== selecaoVeiculoId) {
        return false;
      }
    }

    return true;
  });

  // Agrupar as manutenções por veículo e data
  const manutencoesAgrupadas = agruparManutencoes(manutencoesFiltradas);

  // Ordenar decrescente para que a mais recente (data e hora) fique no topo da lista
  const manutencoesOrdenadas = [...manutencoesAgrupadas].sort((a, b) => {
    // 1º Comparar data desc
    const cmpData = b.data.localeCompare(a.data);
    if (cmpData !== 0) return cmpData;

    // 2º Se mesma data, comparar hora desc
    const horaA = a.hora || '00:00:00';
    const horaB = b.hora || '00:00:00';
    const cmpHora = horaB.localeCompare(horaA);
    if (cmpHora !== 0) return cmpHora;

    // 3º Fallback id desc
    return b.id.localeCompare(a.id);
  });

  const formatarDataBR = (dataStr: string) => {
    if (!dataStr) return '';
    const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = dataStr.match(isoDateRegex);
    if (match) {
      const [_, ano, mes, dia] = match;
      return `${dia}/${mes}/${ano}`;
    }
    return dataStr;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Limpo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-sky-400" />
            Histórico de Manutenções
          </h2>
        </div>
        <div className="bg-sky-950/40 px-3 py-1 rounded-xl border border-sky-800/40 text-sky-400 font-mono text-xs font-bold mt-2 md:mt-0">
          Registros: {manutencoesOrdenadas.length}
        </div>
      </div>

      {/* Filtro por Placa de Veículo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3 bg-[#1e293b]/70 p-4 rounded-xl border border-slate-800">
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
      </div>

      {/* Lista Simples de Histórico */}
      {manutencoesOrdenadas.length === 0 ? (
        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl py-16 px-6 text-center shadow-lg max-w-lg mx-auto">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-250 font-semibold text-base mb-1">Nenhum registro de manutenção no histórico.</p>
          <p className="text-slate-400 text-xs text-center">
            Aba "Frota" → Botão "Lançar Manutenção" em um caminhão para registrar uma nova manutenção.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-w-4xl mx-auto">
          {manutencoesOrdenadas.map((m, index) => {
            const veiculo = veiculos.find(v => v.id === m.veiculoId);
            const numRegistro = manutencoesOrdenadas.length - index;

            return (
              <div 
                key={m.id}
                className="bg-[#1e293b] border border-slate-805 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-slate-800/[0.15] border-slate-800"
              >
                {/* Lado Esquerdo: Info da manutenção e do veículo */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="bg-[#020617]/80 h-9 w-9 rounded-lg flex items-center justify-center font-mono text-xxs font-bold text-sky-450 border border-slate-800 shrink-0 text-sky-400 select-none">
                    #{numRegistro.toString().padStart(2, '0')}
                  </div>
                  
                     <div className="flex flex-col gap-2 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xxs font-mono font-semibold text-slate-400 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-800/40">
                          {formatarDataBR(m.data)}{m.hora ? ` às ${m.hora.substring(0, 5)}` : ''}
                        </span>
                      </div>
                      
                      {veiculo && (
                        <div className="flex items-center gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 w-fit max-w-full">
                          <PlacaMercosul placa={veiculo.placa} />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <LogoMarca marca={veiculo.marcaCaminhao} className="w-3.5 h-3.5 text-sky-400" />
                              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{veiculo.marcaCaminhao}</span>
                            </div>
                            <span className="text-xs font-semibold text-white truncate">{veiculo.modelo}</span>
                          </div>
                        </div>
                      )}
                      
                      {editandoId === m.id ? (
                      <div className="flex flex-col gap-2 mt-2 w-full max-w-lg">
                        <textarea
                          className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500 text-slate-100 font-sans"
                          value={editandoDescricao}
                          onChange={(e) => setEditandoDescricao(e.target.value)}
                          rows={3}
                          placeholder="Escreva a descrição do serviço..."
                        />
                        
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Custo:</span>
                            <div className="relative flex items-center">
                              <span className="absolute left-2.5 text-[11px] text-slate-400 font-bold">R$</span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={editandoCusto}
                                onChange={(e) => setEditandoCusto(e.target.value)}
                                className="bg-[#020617] border border-slate-700 text-white font-bold text-xs rounded-md pl-8 pr-2 py-1 w-28 focus:outline-none focus:border-sky-500"
                                placeholder="0,00"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditandoCusto("0");
                              if (!editandoDescricao.toUpperCase().startsWith("(REVISÃO)")) {
                                setEditandoDescricao(prev => `(REVISÃO) ${prev.trim()}`);
                              }
                            }}
                            className="text-xs text-amber-500 hover:text-amber-400 font-bold underline cursor-pointer transition-colors animate-pulse"
                            title="Zerar valor e classificar como REVISÃO"
                          >
                            Revisão
                          </button>
                        </div>

                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => {
                              if (editandoDescricao.trim()) {
                                const parsedCusto = parseFloat(editandoCusto);
                                const finalCusto = isNaN(parsedCusto) ? 0 : Math.max(0, parsedCusto);
                                onUpdateMaintenance(m.id, {
                                  descricao: editandoDescricao.trim(),
                                  custo: finalCusto
                                }, m.idsOriginais);
                                setEditandoId(null);
                              }
                            }}
                            className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-xxs font-bold px-2.5 py-1.5 rounded-md cursor-pointer transition-colors"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditandoId(null)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xxs font-semibold px-2.5 py-1.5 rounded-md cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2.5">
                        <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">Serviços Executados:</span>
                        {m.descricoes && m.descricoes.length > 0 ? (
                          <ul className="space-y-1.5 pl-1.5 text-sm text-slate-200 font-sans border-l-2 border-sky-500/20">
                            {m.descricoes.map((desc, idx) => (
                              <li key={idx} className="break-words flex items-start gap-2">
                                <span className="text-sky-400 select-none mt-1 text-[10px]">•</span>
                                <span className="font-medium text-slate-100">{desc}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm font-medium text-slate-100 font-sans break-words pl-1.5 border-l-2 border-sky-500/20">
                            {m.descricao}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="text-emerald-400 font-semibold font-mono">R$ {m.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Ações */}
                <div className="flex items-center gap-2.5 self-end sm:self-center font-sans">
                  {confirmDeleteId === m.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-900/60 p-1 rounded-lg">
                      <span className="text-[10px] text-rose-300 font-semibold px-1">Excluir?</span>
                      <button
                        onClick={() => {
                          onDeleteMaintenance(m.id, m.idsOriginais);
                          setConfirmDeleteId(null);
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xxs px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xxs px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <>
                      {editandoId !== m.id && (
                        <button
                          id={`btn-edit-m-hist-${m.id}`}
                          onClick={() => {
                            setEditandoId(m.id);
                            setEditandoDescricao(m.descricao);
                            setEditandoCusto(m.custo.toString());
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-950/30 rounded-lg border border-transparent hover:border-sky-900/40 transition-colors cursor-pointer"
                          title="Editar Registro"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        id={`btn-delete-m-hist-${m.id}`}
                        onClick={() => setConfirmDeleteId(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer"
                        title="Excluir do Histórico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
