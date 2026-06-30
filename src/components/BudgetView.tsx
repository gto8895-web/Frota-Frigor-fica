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

    const drawTableHeader = (d: jsPDF, yCoord: number, isReport: boolean) => {
      // Teal/cyan header bar (Clyar brand color `#00BAC6`)
      d.setFillColor(0, 186, 198);
      d.rect(15, yCoord, 180, 6, 'F');
      
      d.setTextColor(255, 255, 255);
      d.setFont('Helvetica', 'bold');
      d.setFontSize(8);
      
      if (isReport) {
        d.text('Descrição do Serviço / Manutenção', 17, yCoord + 4.2);
        d.text('Quantidade', 193, yCoord + 4.2, { align: 'right' });
      } else {
        d.text('Descrição do Serviço / Manutenção', 17, yCoord + 4.2);
        d.text('Quantidade', 140, yCoord + 4.2, { align: 'right' });
        d.text('Valor Unit. (R$)', 168, yCoord + 4.2, { align: 'right' });
        d.text('Valor Total (R$)', 193, yCoord + 4.2, { align: 'right' });
      }
    };

    // --- LOGO RECUPERAR (Caminhão Baú, Ar Condicionado e Chave de Manutenção) ---
    // Let's draw the Logo box: x=15, y=15, width=55, height=20 (Ends at x=70, y=35)
    doc.setDrawColor(218, 225, 231);
    doc.setLineWidth(0.3);
    doc.rect(15, 15, 55, 20); // Border of the logo box

    // Truck cargo (baú) in Teal
    doc.setFillColor(0, 186, 198);
    doc.rect(18, 18, 9, 6.5, 'F');

    // Truck cabin in Slate-800
    doc.setFillColor(30, 41, 59);
    doc.rect(27, 20.5, 3.5, 4, 'F');

    // Truck cabin window
    doc.setFillColor(255, 255, 255);
    doc.rect(29, 21.2, 1.2, 1.5, 'F');

    // Wheels
    doc.setFillColor(15, 23, 42);
    doc.circle(20.5, 25, 0.9, 'F');
    doc.circle(26, 25, 0.9, 'F');

    // Snowflake symbol on cargo box (white lines)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.35);
    doc.line(22.5, 19.5, 22.5, 23); // vertical
    doc.line(20.75, 21.25, 24.25, 21.25); // horizontal
    doc.line(21.4, 20.15, 23.6, 22.35); // diagonal
    doc.line(21.4, 22.35, 23.6, 20.15); // diagonal

    // Wrench symbol below/next to truck
    doc.setDrawColor(120, 130, 140);
    doc.setLineWidth(0.6);
    doc.line(31, 18.5, 34, 21.5); // Handle of the wrench
    doc.setFillColor(120, 130, 140);
    doc.circle(31, 18.5, 0.8, 'F'); // head of wrench
    doc.setFillColor(255, 255, 255);
    doc.circle(31, 18.5, 0.3, 'F'); // wrench opening cutout

    // Brand name "RECUPERAR"
    doc.setTextColor(0, 186, 198); // Teal
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text('RECUPERAR', 36, 23.5);

    doc.setTextColor(30, 41, 59); // Slate
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(4.2);
    doc.text('AR CONDICIONADO VEÍCULOS PESADOS', 36, 27.5);


    // --- DADOS DA RECUPERAR (Topo Direito) ---
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('RECUPERAR', 195, 18, { align: 'right' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('www.recuperar.com.br', 195, 22, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('CNPJ: 21.598.076/0001-30', 195, 26, { align: 'right' });
    doc.text('Inscrição Estadual: 86.846.43-8', 195, 30, { align: 'right' });
    doc.text('Inscrição Municipal: 0', 195, 34, { align: 'right' });
    doc.text('RUA JOAO PIZARRO, 00135', 195, 38, { align: 'right' });
    doc.text('RAMOS', 195, 42, { align: 'right' });
    doc.text('Rio de Janeiro - RJ - CEP: 21031-170', 195, 46, { align: 'right' });
    doc.text('Telefone: (21) 3549-6641', 195, 50, { align: 'right' });


    // --- TÍTULO DO DOCUMENTO ---
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    const osNumber = dataReferencia.replace(/-/g, '');
    const titleText = ocultarValores 
      ? `Relatório de Serviço Nº ${osNumber}`
      : `Orçamento de Serviço Nº ${osNumber}`;
    doc.text(titleText, 15, 59);


    // --- INFORMAÇÕES DO CLIENTE (PEO NOVA DISTRIBUIDORA) ---
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Informações do Cliente', 15, 66);

    // Separador
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.2);
    doc.line(15, 68, 195, 68);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('NOVA DISTRIBUIDORA E INDUSTRIA DE ALIMENTOS SEROPEDICA 42 LTDA.', 15, 73);

    // Detalhes do Cliente
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    // Coluna Esquerda
    doc.text('CNPJ: 08.879.982/0001-45', 15, 78);
    doc.text('Inscrição Estadual: Isento', 15, 82);
    doc.text('Seropédica - RJ', 15, 86);

    // Coluna Direita
    doc.text('Logradouro: Rodovia Presidente Dutra, 42', 100, 78);
    doc.text('Bairro: Sao Miguel - CEP: 23.893-690', 100, 82);
    doc.text('Município/UF: Seropédica, RJ - Brasil', 100, 86);


    // --- SEÇÃO LISTA DOS SERVIÇOS ---
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(ocultarValores ? 'Lista de Manutenções' : 'Lista dos Serviços', 15, 94);

    // Linha de divisão antes da tabela
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.2);
    doc.line(15, 96, 195, 96);

    let currentY = 99;
    drawTableHeader(doc, currentY, ocultarValores);
    currentY += 11; // spacing to start rows

    const veiculosComManutencao = veiculosComOrcamentosParaDia.filter(item => item.manutencoes.length > 0);

    if (veiculosComManutencao.length === 0) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Nenhuma manutenção registrada para o dia de referência.', 15, currentY);
    } else {
      veiculosComManutencao.forEach((item) => {
        // Page overflow check for Vehicle group header
        if (currentY > 260) {
          doc.addPage();
          currentY = 25;
          drawTableHeader(doc, currentY, ocultarValores);
          currentY += 11;
        }

        // Vehicle row background (light ice blue/teal hue for highlights)
        doc.setFillColor(240, 252, 253);
        doc.rect(15, currentY - 5, 180, 7, 'F');

        // Draw Placa/Brand/Model
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        const truckDesc = `VEÍCULO: PLACA ${item.veiculo.placa} - ${item.veiculo.marcaCaminhao.toUpperCase()} ${item.veiculo.modelo.toUpperCase()}`;
        doc.text(truckDesc, 17, currentY);

        // Right side values on vehicle level (if not report)
        if (!ocultarValores) {
          doc.text('1,00', 140, currentY, { align: 'right' });
          doc.text(item.totalDoVeiculoNoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), 168, currentY, { align: 'right' });
          doc.text(item.totalDoVeiculoNoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), 193, currentY, { align: 'right' });
        } else {
          doc.text('1,00', 193, currentY, { align: 'right' });
        }

        currentY += 7;

        // Draw sub-items (individual manutenções)
        item.manutencoes.forEach((m) => {
          if (currentY > 260) {
            doc.addPage();
            currentY = 25;
            drawTableHeader(doc, currentY, ocultarValores);
            currentY += 11;
          }

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85); // Slate-700

          let cleanDesc = m.descricao;
          const startsWithRevisao = m.descricao.toUpperCase().startsWith('(REVISÃO)');
          const isRevision = startsWithRevisao;
          
          if (startsWithRevisao) {
            cleanDesc = m.descricao.substring(9).trim();
          }
          
          const labelPrefix = isRevision ? `[REVISÃO] ` : ``;
          const textToPrint = `• ${labelPrefix}${cleanDesc}`;

          // Wrap long descriptions beautifully
          const wrapWidth = ocultarValores ? 165 : 110;
          const descLines = doc.splitTextToSize(textToPrint, wrapWidth);

          descLines.forEach((linha: string, index: number) => {
            if (currentY > 260) {
              doc.addPage();
              currentY = 25;
              drawTableHeader(doc, currentY, ocultarValores);
              currentY += 11;
            }

            doc.text(linha, 20, currentY);

            // Print service value notes next to the description's first line
            if (index === 0) {
              if (!ocultarValores) {
                doc.setFont('Helvetica', 'italic');
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184); // Slate 400
                doc.text('-', 140, currentY, { align: 'right' });
                doc.text('Incluso', 168, currentY, { align: 'right' });
                doc.text('Incluso', 193, currentY, { align: 'right' });
                // Reset font
                doc.setFont('Helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(51, 65, 85);
              } else {
                doc.text('-', 193, currentY, { align: 'right' });
              }
            }

            currentY += 4.5;
          });
        });

        // Add small line separator under the vehicle group
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.2);
        doc.line(15, currentY - 2, 195, currentY - 2);
        
        currentY += 2.5; // padding before next vehicle
      });
    }

    // Soma total consolidado (only if not report)
    if (!ocultarValores) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 25;
      }

      currentY += 6;
      doc.setDrawColor(148, 163, 184); // Slate 400
      doc.setLineWidth(0.3);
      doc.line(120, currentY, 195, currentY); // Line separating table from totals
      currentY += 6;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Descontos:', 150, currentY, { align: 'right' });
      doc.text('R$ 0,00', 193, currentY, { align: 'right' });

      currentY += 5;
      doc.text('Soma Subtotal:', 150, currentY, { align: 'right' });
      doc.text(`R$ ${totalGeralDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 193, currentY, { align: 'right' });

      currentY += 6;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Total:', 150, currentY, { align: 'right' });
      doc.text(`R$ ${totalGeralDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 193, currentY, { align: 'right' });
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
