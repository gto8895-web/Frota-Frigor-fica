import { Veiculo, Manutencao } from './types';

export const INITIAL_VEHICLES: Veiculo[] = [
  {
    id: 'veic-1',
    placa: 'FRG-2B45',
    modelo: 'Atego 2430 6x2',
    marcaCaminhao: 'Mercedes-Benz',
    ano: 2021,
    tipoRefrigeracao: 'Thermo King T-880R Scroll',
    temperaturaAlvo: -22,
    temperaturaAtual: -21.8,
    capacidadeCarga: 14.5,
    status: 'disponivel',
    statusRefrigeracao: 'ok',
    ultimaManutencao: '2026-06-10'
  },
  {
    id: 'veic-2',
    placa: 'COL-7E89',
    modelo: 'VM 270 Semi-Pesado',
    marcaCaminhao: 'Volvo',
    ano: 2020,
    tipoRefrigeracao: 'Carrier Supra 850 Silent',
    temperaturaAlvo: 4,
    temperaturaAtual: 4.2,
    capacidadeCarga: 12.0,
    status: 'disponivel',
    statusRefrigeracao: 'ok',
    ultimaManutencao: '2026-06-15'
  },
  {
    id: 'veic-3',
    placa: 'ICE-4D12',
    modelo: 'P 320 Bitrem',
    marcaCaminhao: 'Scania',
    ano: 2022,
    tipoRefrigeracao: 'Thermo King T-1200R Whisper',
    temperaturaAlvo: -18,
    temperaturaAtual: -12.4, // Temperatura subiu, em alerta!
    capacidadeCarga: 22.0,
    status: 'alerta',
    statusRefrigeracao: 'degradado',
    ultimaManutencao: '2026-05-20'
  },
  {
    id: 'veic-4',
    placa: 'SNW-9A34',
    modelo: 'Constellation 24.280',
    marcaCaminhao: 'Volkswagen',
    ano: 2019,
    tipoRefrigeracao: 'Carrier Supra 1150',
    temperaturaAlvo: -25,
    temperaturaAtual: 22.5, // Parado sem refrigeração ativa (em manutenção)
    capacidadeCarga: 13.0,
    status: 'manutencao',
    statusRefrigeracao: 'falha',
    ultimaManutencao: '2026-06-19'
  },
  {
    id: 'veic-5',
    placa: 'GLC-1F78',
    modelo: 'Tector 240E28',
    marcaCaminhao: 'Iveco',
    ano: 2018,
    tipoRefrigeracao: 'Thermo King V-500 MAX',
    temperaturaAlvo: 2,
    temperaturaAtual: 2.1,
    capacidadeCarga: 11.5,
    status: 'disponivel',
    statusRefrigeracao: 'ok',
    ultimaManutencao: '2026-06-05'
  }
];

// O localTime do sistema é 2026-06-20. Vamos iniciar o histórico limpo a pedido do usuário.
export const INITIAL_MAINTENANCES: Manutencao[] = [];
