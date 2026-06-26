import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, Plus, Trash2, CheckSquare, Square, ShoppingCart, Send, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
}

interface ShoppingListViewProps {
  onBack: () => void;
  shoppingItems: ShoppingItem[];
  setShoppingItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
}

export default function ShoppingListView({ onBack, shoppingItems, setShoppingItems }: ShoppingListViewProps) {
  const [newItemName, setNewItemName] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const item: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      completed: false
    };
    setShoppingItems(prev => [...prev, item]);
    setNewItemName('');
  };

  const handleToggleItem = (id: string) => {
    setShoppingItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    setShoppingItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCompleted = () => {
    setShoppingItems(prev => prev.filter(item => !item.completed));
  };

  const gerarPDFDoc = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const formatarData = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    };

    const dataFormatada = formatarData(new Date());

    // Estilização minimalista e profissional do PDF (Cabeçalho azul Recuperar)
    doc.setFillColor(15, 23, 42); // Slate escuro
    doc.rect(0, 0, 210, 30, 'F'); // Cabeçalho colorido topo

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LISTA DE COMPRAS - RECUPERAR', 15, 18);

    doc.setTextColor(34, 197, 94); // Verde (emerald)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(dataFormatada, 165, 18);

    // Corpo de conteúdo do PDF
    doc.setTextColor(30, 41, 59); // Slate de texto escuro
    let y = 45;

    if (shoppingItems.length === 0) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(11);
      doc.text('A lista de compras está vazia.', 15, y);
    } else {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('ITENS DA LISTA:', 15, y);
      y += 8;

      shoppingItems.forEach((item, index) => {
        if (y > 270) {
          doc.addPage();
          y = 25;
        }

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);

        const icon = item.completed ? '[CONCLUÍDO] ' : '';
        const lineText = `${index + 1}. ${icon}${item.name}`;

        // Tratamento de quebra automática de linha
        const descLineas = doc.splitTextToSize(lineText, 175);
        descLineas.forEach((linha: string) => {
          if (y > 270) {
            doc.addPage();
            y = 25;
          }
          doc.text(linha, 15, y);
          y += 6;
        });
      });
    }

    return doc;
  };

  const handleGerarPDF = () => {
    const doc = gerarPDFDoc();
    const dataIso = new Date().toISOString().slice(0, 10);
    doc.save(`lista_compras_${dataIso}.pdf`);
  };

  const enviarPorWhatsApp = async () => {
    const dataIso = new Date().toISOString().slice(0, 10);
    const fileName = `lista_compras_${dataIso}.pdf`;
    try {
      const doc = gerarPDFDoc();
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Se o navegador ou dispositivo possui suporte a compartilhamento de arquivos via Web Share API
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Lista de Compras Recuperar`,
          text: `Segue em anexo o arquivo PDF da lista de compras para suprimentos de frota.`
        });
        return;
      }
    } catch (e) {
      console.warn("Compartilhamento nativo não disponível, utilizando fallback padrão:", e);
    }

    // Fallback: faz o download automático e abre o WhatsApp com o texto
    handleGerarPDF();

    let relatorio = `🛒 *LISTA DE COMPRAS - RECUPERAR*\n`;
    relatorio += `📅 *Gerado em:* ${new Date().toLocaleDateString('pt-BR')}\n`;
    relatorio += `===================================\n\n`;
    relatorio += `*ITENS DA LISTA:*\n`;
    
    shoppingItems.forEach((item, index) => {
      const status = item.completed ? '✅' : '⏳';
      relatorio += `${index + 1}. ${status} ${item.name}\n`;
    });

    relatorio += `\n📦 *Total de itens:* ${shoppingItems.length}\n`;
    relatorio += `📎 _O arquivo PDF foi baixado automaticamente. Por favor, anexe o arquivo baixado *${fileName}* nesta conversa do WhatsApp._`;

    const encodedText = encodeURIComponent(relatorio);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in px-2 sm:px-0">
      {/* Botão de Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-medium bg-[#1e293b] border border-slate-800 px-4 py-2.5 sm:py-2 rounded-xl w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          Voltar para o Painel
        </button>
        <span className="text-xs text-slate-500 font-mono text-center sm:text-right">
          Itens salvos localmente
        </span>
      </div>

      {/* Card da Lista de Compras */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Header decorativo da Lista de Compras */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-center sm:items-center gap-3 text-center sm:text-left">
          <div className="p-3 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
            <ShoppingCart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight">LISTA DE COMPRAS</h2>
            <p className="text-xs text-slate-400">Controle de peças, compressores, reposição de gás e suprimentos</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Formulário de Adicionar Item */}
          <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Digite o item para comprar (ex: Gás R404A...)"
              className="flex-1 bg-[#020617]/60 border border-slate-800 focus:border-slate-700 focus:outline-none rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 transition-colors w-full"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-transparent shadow-md hover:scale-101 active:scale-98 w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </form>

          {/* Lista de Itens */}
          <div className="space-y-3">
            {shoppingItems.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-xl px-4">
                <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Sua lista de compras está vazia.</p>
                <p className="text-xs text-slate-500 mt-1">Adicione itens mecânicos ou consumíveis de refrigeração acima.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 bg-[#020617]/20 border border-slate-800/80 rounded-xl overflow-hidden">
                {shoppingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 px-3 sm:px-4 py-3 sm:py-3.5 hover:bg-[#020617]/40 transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleItem(item.id)}
                      className="flex items-start gap-3 text-left flex-1 cursor-pointer focus:outline-none select-none min-w-0"
                    >
                      {item.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500 hover:text-slate-450 shrink-0 transition-colors mt-0.5" />
                      )}
                      <span className={`text-sm tracking-wide break-words min-w-0 pr-1 ${item.completed ? 'line-through text-slate-500 font-normal' : 'text-slate-200 font-medium'}`}>
                        {item.name}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-2 sm:p-1.5 rounded-lg hover:bg-slate-800/30 transition-colors focus:outline-none shrink-0"
                      title="Excluir item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé do Painel de Itens */}
          {shoppingItems.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-400">
              <span className="text-center sm:text-left">
                Total: <strong>{shoppingItems.length}</strong> {shoppingItems.length === 1 ? 'item' : 'itens'} ({shoppingItems.filter(i => i.completed).length} concluídos)
              </span>

              {shoppingItems.some(i => i.completed) && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="text-rose-400 hover:text-rose-350 font-semibold cursor-pointer transition-colors px-3 py-1.5 sm:py-0.5 bg-rose-500/10 sm:bg-transparent rounded-lg sm:rounded-none border border-rose-500/10 sm:border-transparent text-center w-full sm:w-auto"
                >
                  Limpar Concluídos
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botões de Ação/Partilha abaixo da Moldura */}
      {shoppingItems.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleGerarPDF}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer border border-slate-700/50 w-full sm:flex-1"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            Baixar Lista em PDF
          </button>
          
          <button
            onClick={enviarPorWhatsApp}
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer border border-transparent w-full sm:flex-1"
          >
            <Send className="w-4 h-4" />
            Enviar por WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
