export type StatusVeiculo = 'disponivel' | 'manutencao' | 'alerta';
export type StatusRefrigeracao = 'ok' | 'degradado' | 'falha';
export type TipoManutencao = 'preventiva' | 'corretiva' | 'refrigeracao' | 'pneus' | 'motor' | 'geral';
export type StatusManutencao = 'agendada' | 'em_andamento' | 'concluida';

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  ano: string | number;
  tipoRefrigeracao: string; // Ex: Thermo King T-880R, Carrier Supra 1150
  temperaturaAlvo: number; // Temperatura alvo em °C (ex: -18°C para congelados, 4°C para resfriados)
  temperaturaAtual: number; // Temperatura detectada em tempo real (simulada)
  capacidadeCarga: number; // Capacidade em toneladas
  status: StatusVeiculo;
  statusRefrigeracao: StatusRefrigeracao;
  ultimaManutencao?: string; // Data
  marcaCaminhao: string; // Ex: Volvo, Scania, Mercedes-Benz
  compressor?: string; // Compressor do sistema de refrigeração
  correia?: string; // Correia do sistema de refrigeração
}

export interface Manutencao {
  id: string;
  veiculoId: string;
  data: string; // Formato YYYY-MM-DD
  hora?: string; // Formato HH:MM:SS
  tipo: TipoManutencao;
  descricao: string;
  custo: number;
  responsavel: string;
  status: StatusManutencao;
}

export interface OrcamentoDiario {
  data: string; // Formato YYYY-MM-DD
  custoPadraoVeiculo: number; // Custo padrão por dia por veículo (Ex: R$ 150)
  manutencoesIndividuais: Manutencao[];
  totalPadrao: number; // custoPadraoVeiculo * quantidade_veiculos
  totalAvulso: number; // soma dos custos de manutenções no dia
  totalGeral: number; // totalPadrao + totalAvulso
}

export interface Avaria {
  id: string;
  veiculoId: string;
  descricao: string;
  dataCadastrada: string;
  resolvido: boolean;
}

