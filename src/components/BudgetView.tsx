import React, { useState } from 'react';
import { Veiculo, Manutencao, OrcamentoDiario } from '../types';
import { Calendar, DollarSign, Printer, Copy, Check, FileText, Settings, ShieldAlert, Sparkles, HelpCircle, Send } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface BudgetViewProps {
  veiculos: Veiculo[];
  manutencoes: Manutencao[];
  custoPadraoDiario: number;
  onUpdateCustoPadrao: (valor: number) => void;
  dataReferencia: string;
  onChangeDataReferencia: (data: string) => void;
}

export default function BudgetView({
  veiculos,
  manutencoes,
  custoPadraoDiario,
  onUpdateCustoPadrao,
  dataReferencia,
  onChangeDataReferencia
}: BudgetViewProps) {
  const [copiado, setCopiado] = useState<boolean>(false);
  const [mostrarExplicacao, setMostrarExplicacao] = useState<boolean>(false);

  // Filtrar manutenções do dia de referência
  const manutencoesDoDia = manutencoes.filter(m => m.data === dataReferencia);
  
  // Totalizações para o dia
  const totalVeiculos = veiculos.length;

  // Gerar detalhes de cada veículo do dia
  const veiculosComOrcamentosParaDia = veiculos.map(v => {
    const manutencoesDoVeiculo = manutencoesDoDia.filter(m => m.veiculoId === v.id);
    
    // Filtra as manutenções pagas (não REVISÃO e custo > 0)
    const manutencoesPagasDoVeiculo = manutencoesDoVeiculo.filter(m => {
      const startsWithRevisao = m.descricao.toUpperCase().startsWith('(REVISÃO)');
      const isRevision = startsWithRevisao;
      return !isRevision;
    });

    // O valor cobrado é por caminhão, se houver manutenções pagas, considera-se a de maior valor registrado nelas
    const totalDoVeiculoNoDia = manutencoesPagasDoVeiculo.length > 0
      ? Math.max(...manutencoesPagasDoVeiculo.map(m => m.custo))
      : 0;

    return {
      veiculo: v,
      manutencoes: manutencoesDoVeiculo,
      custoManutencoes: 0,
      totalDoVeiculoNoDia
    };
  });

  const totalVeiculosEmManutencao = veiculosComOrcamentosParaDia.filter(item => item.manutencoes.length > 0).length;
  const totalGeralDiario = veiculosComOrcamentosParaDia.reduce((sum, item) => sum + item.totalDoVeiculoNoDia, 0);

  const gerarPDFDoc = (ocultarValores: boolean = false) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const dataFormatada = dataReferencia.split('-').reverse().join('/');

    // Estilização minimalista e profissional do PDF
    doc.setFillColor(15, 23, 42); // Slate escuro
    doc.rect(0, 0, 210, 30, 'F'); // Cabeçalho colorido topo

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(ocultarValores ? 'RELATÓRIO DOS SERVIÇOS' : 'ORÇAMENTO DOS SERVIÇOS', 15, 18);

    doc.setTextColor(34, 197, 94); // Verde (emerald)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(dataFormatada, 160, 18);

    // Corpo de conteúdo do PDF
    doc.setTextColor(30, 41, 59); // Slate de texto escuro
    let y = 45;

    const veiculosComManutencao = veiculosComOrcamentosParaDia.filter(item => item.manutencoes.length > 0);

    if (veiculosComManutencao.length === 0) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(11);
      doc.text('Nenhuma manutenção registrada para o dia de referência.', 15, y);
    } else {
      veiculosComManutencao.forEach((item) => {
        // Evita quebra de página inadequada
        if (y > 240) {
          doc.addPage();
          y = 25;
        }

        // Bloco do Veículo
        doc.setFillColor(248, 250, 252); // Fundo sutil cinza claro para o caminhão
        doc.rect(15, y - 5, 180, 8, 'F');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        // PLACA, MARCA E MODELO
        doc.text(`PLACA: ${item.veiculo.placa} | MARCA: ${item.veiculo.marcaCaminhao.toUpperCase()} | MODELO: ${item.veiculo.modelo.toUpperCase()}`, 17, y);
        
        // Custo fixo estabelecido no canto direito (ocultado se for relatório)
        if (!ocultarValores) {
          doc.text(`R$ ${item.totalDoVeiculoNoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 165, y);
        }

        y += 8;

        // Lista de manutenções registradas abaixo do veículo
        item.manutencoes.forEach((m) => {
          if (y > 260) {
            doc.addPage();
            y = 25;
          }

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
          
          let cleanDesc = m.descricao;
          const startsWithRevisao = m.descricao.toUpperCase().startsWith('(REVISÃO)');
          const isRevision = startsWithRevisao;
          
          if (startsWithRevisao) {
            cleanDesc = m.descricao.substring(9).trim();
          }
          
          const pmsLine = isRevision ? `• (REVISÃO) ${cleanDesc}` : `• ${cleanDesc}`;
          
          // Tratamento de quebra automática de linha para descrição longa
          const descLineas = doc.splitTextToSize(pmsLine, 170);
          descLineas.forEach((linha: string) => {
            if (y > 260) {
              doc.addPage();
              y = 25;
            }
            doc.text(linha, 20, y);
            y += 5;
          });
        });

        y += 4; // Espaçamento entre os caminhões listados
      });
    }

    // Seção final com a soma total das manutenções (ocultado se for relatório)
    if (!ocultarValores) {
      if (y > 240) {
        doc.addPage();
        y = 25;
      }

      y += 5;
      doc.setDrawColor(203, 213, 225); // Slate-200 border line divider
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);
      y += 10;

      // Linha de total consolidado
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('SOMA TOTAL DAS MANUTENÇÕES:', 15, y);
      doc.text(`R$ ${totalGeralDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 165, y);
    }

    return doc;
  };

  const handleGerarPDF = () => {
    const doc = gerarPDFDoc(false);
    doc.save(`orcamento_servicos_${dataReferencia}.pdf`);
  };

  const handleGerarPDFRelatorio = () => {
    const doc = gerarPDFDoc(true);
    doc.save(`relatorio_servicos_${dataReferencia}.pdf`);
  };

  // Enviar relatório e carregar PDF automaticamente para enviar pelo WhatsApp
  const enviarPorWhatsApp = async () => {
    try {
      const doc = gerarPDFDoc(false);
      const pdfBlob = doc.output('blob');
      const fileName = `orcamento_servicos_${dataReferencia}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Se o navegador ou dispositivo possui suporte a compartilhamento de arquivos via Web Share API
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Orçamento ${dataReferencia.split('-').reverse().join('/')}`,
          text: `Segue em anexo o arquivo PDF do orçamento de manutenção de frota para o dia ${dataReferencia.split('-').reverse().join('/')}.`
        });
        return;
      }
    } catch (e) {
      console.warn("Compartilhamento nativo não disponível, utilizando fallback padrão:", e);
    }

    // Caso o navegador não tenha suporte direto de compartilhamento de arquivos pelo Web Share API (Desktop, sandboxed iframes)
    // Fazemos o download automático do PDF e abrimos o WhatsApp com instruções fáceis para o usuário simplesmente anexar o arquivo.
    handleGerarPDF();

    let relatorio = `🚚 *ORÇAMENTO DIÁRIO DE TRABALHO E MANUTENÇÕES*\n`;
    relatorio += `📅 *Referência:* ${dataReferencia.split('-').reverse().join('/')}\n`;
    relatorio += `===================================\n\n`;
    relatorio += `*RESUMO DO ORÇAMENTO:*\n`;
    relatorio += `• Caminhões em Manutenção: ${totalVeiculosEmManutencao} unidades\n`;
    relatorio += `💰 *VALOR TOTAL CONSOLIDADO: R$ ${totalGeralDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n`;
    relatorio += `📎 _O arquivo PDF foi baixado automaticamente. Por favor, anexe o arquivo baixado *${`orcamento_servicos_${dataReferencia}.pdf`}* nesta conversa._`;

    const encodedText = encodeURIComponent(relatorio);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const enviarRelatorioPorWhatsApp = async () => {
    try {
      const doc = gerarPDFDoc(true);
      const pdfBlob = doc.output('blob');
      const fileName = `relatorio_servicos_${dataReferencia}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Se o navegador ou dispositivo possui suporte a compartilhamento de arquivos via Web Share API
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Relatório de Serviços ${dataReferencia.split('-').reverse().join('/')}`,
          text: `Segue em anexo o arquivo PDF do relatório de manutenção de frota (sem valores) para o dia ${dataReferencia.split('-').reverse().join('/')}.`
        });
        return;
      }
    } catch (e) {
      console.warn("Compartilhamento nativo não disponível, utilizando fallback padrão:", e);
    }

    handleGerarPDFRelatorio();

    let relatorio = `🚚 *RELATÓRIO DIÁRIO DE TRABALHO E MANUTENÇÕES*\n`;
    relatorio += `📅 *Referência:* ${dataReferencia.split('-').reverse().join('/')}\n`;
    relatorio += `===================================\n\n`;
    relatorio += `*RESUMO DO RELATÓRIO:*\n`;
    relatorio += `• Caminhões em Manutenção: ${totalVeiculosEmManutencao} unidades\n\n`;
    relatorio += `📎 _O arquivo PDF foi baixado automaticamente. Por favor, anexe o arquivo baixado *${`relatorio_servicos_${dataReferencia}.pdf`}* nesta conversa._`;

    const encodedText = encodeURIComponent(relatorio);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Opções de Impressão de Cupom / Relatório em Impressora Física */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Gerador de Orçamento Padrão por Dia</h2>
          <p className="text-slate-400 text-sm">Inscreva as taxas operacionais de referência e verifique os subtotais combinados por veículo.</p>
        </div>
      </div>

      {/* Painel no-print de Configurações das Variáveis de Entrada */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xs no-print text-slate-100 max-w-md space-y-4">
        
        {/* Controle 1: Mudar Data de Referência do Orçamento */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-400" /> Selecionar Dia do Orçamento
          </label>
          <input
            type="date"
            className="w-full bg-[#020617] border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-sky-400 font-mono"
            value={dataReferencia}
            onChange={(e) => onChangeDataReferencia(e.target.value)}
          />
          <p className="text-xxs text-slate-500 mt-1">
            Escolha a Data dos Serviços para gerar um Orçamento.
          </p>
        </div>

        {/* Botões de Ação integrados na mesma moldura */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            id="btn-generate-pdf"
            onClick={handleGerarPDF}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border border-transparent w-full"
          >
            <FileText className="w-4 h-4" />
            Baixar Orçamento (PDF)
          </button>

          <button
            id="btn-send-wa-budget"
            onClick={enviarPorWhatsApp}
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border border-transparent w-full"
          >
            <Send className="w-4 h-4" />
            Enviar Orçamento por WhatsApp
          </button>

          <div className="border-t border-slate-700/60 my-2 pt-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Relatório de Serviços (Sem Valores)
            </label>
            <div className="flex flex-col gap-2">
              <button
                id="btn-generate-report-pdf"
                onClick={handleGerarPDFRelatorio}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border border-transparent w-full"
              >
                <FileText className="w-4 h-4" />
                Baixar Relatório (PDF)
              </button>

              <button
                id="btn-send-wa-report"
                onClick={enviarRelatorioPorWhatsApp}
                className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border border-transparent w-full"
              >
                <Send className="w-4 h-4" />
                Enviar Relatório por WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
