import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Movement } from '../types';
import { formatCurrency, formatDate, getMovementTypeLabel } from './calculations';

interface ExportMovement {
  data: string;
  tipo: string;
  tipoPagamento: string;
  classificacao: string;
  categoria: string;
  descricao: string;
  valor: string;
  status: string;
  banco?: string;
  observacoes?: string;
  parcela?: string;
  vencimento?: string;
}

// Função auxiliar para expandir movimentações com itens de compra
const expandMovementsWithItems = (movements: Movement[]): Array<Movement & { itemDetail?: string }> => {
  const expanded: Array<Movement & { itemDetail?: string }> = [];
  
  movements.forEach(movement => {
    if (movement.purchaseItems && movement.purchaseItems.length > 0) {
      // Se tem itens de compra, criar uma entrada para cada item
      movement.purchaseItems.forEach(item => {
        expanded.push({
          ...movement,
          description: `${movement.description} - ${item.name}`,
          amount: item.total,
          itemDetail: `${item.quantity}x ${formatCurrency(item.unitPrice)}`
        });
      });
    } else {
      // Se não tem itens, adiciona a movimentação normalmente
      expanded.push(movement);
    }
  });
  
  return expanded;
};

export const exportMovementsToPDF = (movements: Movement[], filename: string = 'movimentacoes.pdf') => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Modo paisagem para mais espaço
  
  // Título
  doc.setFontSize(18);
  doc.text('Histórico de Movimentações', 14, 20);
  
  // Data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
  
  // Expandir movimentações com itens
  const expandedMovements = expandMovementsWithItems(movements);
  
  // Preparar dados para a tabela
  const tableData = expandedMovements.map(m => {
    const installmentInfo = m.installments && m.installments.length > 0 
      ? `${m.installments.filter(i => i.isPaid).length}/${m.installments.length}` 
      : '-';
    
    return [
      formatDate(m.date),
      m.type === 'entrada' ? 'Entrada' : 'Saída',
      getMovementTypeLabel(m.movementType),
      m.classification === 'fixo' ? 'Fixo' : m.classification === 'temporario' ? 'Temporário' : '-',
      m.category,
      m.description,
      m.itemDetail || '-',
      installmentInfo,
      formatCurrency(m.amount),
      m.isPaid ? 'Pago' : 'Pendente',
      m.notes || '-'
    ];
  });
  
  // Gerar tabela
  autoTable(doc, {
    head: [['Data', 'Tipo', 'Forma Pagto', 'Classif.', 'Categoria', 'Descrição', 'Detalhe', 'Parcelas', 'Valor', 'Status', 'Obs']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 7, cellPadding: 1.5, font: 'helvetica', lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 18 },
      2: { cellWidth: 24 },
      3: { cellWidth: 18 },
      4: { cellWidth: 28 },
      5: { cellWidth: 50, cellPadding: 2 },
      6: { cellWidth: 30 },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 22, halign: 'right' },
      9: { cellWidth: 18, halign: 'center' },
      10: { cellWidth: 30 }
    },
    margin: { left: 14, right: 14 }
  });
  
  // Salvar PDF
  doc.save(filename);
};

export const exportMovementsToCSV = (movements: Movement[], filename: string = 'movimentacoes.csv') => {
  const headers = ['Data', 'Tipo', 'Forma de Pagamento', 'Classificação', 'Categoria', 'Descrição', 'Detalhe Item', 'Parcelas Pagas', 'Total Parcelas', 'Valor', 'Status', 'Data Pagamento', 'Observações'];
  
  // Expandir movimentações com itens
  const expandedMovements = expandMovementsWithItems(movements);
  
  const rows = expandedMovements.map(m => {
    const paidInstallments = m.installments?.filter(i => i.isPaid).length || 0;
    const totalInstallments = m.installments?.length || 0;
    
    return [
      formatDate(m.date),
      m.type === 'entrada' ? 'Entrada' : 'Saída',
      getMovementTypeLabel(m.movementType),
      m.classification === 'fixo' ? 'Fixo' : m.classification === 'temporario' ? 'Temporário' : '-',
      m.category,
      m.description,
      m.itemDetail || '-',
      totalInstallments > 0 ? paidInstallments.toString() : '-',
      totalInstallments > 0 ? totalInstallments.toString() : '-',
      m.amount.toString().replace('.', ','),
      m.isPaid ? 'Pago' : 'Pendente',
      m.paidDate ? formatDate(m.paidDate) : '-',
      m.notes || '-'
    ];
  });
  
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
  ].join('\n');
  
  // Adicionar BOM para UTF-8 (garante acentuação correta no Excel)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportMovementsToExcel = (movements: Movement[], filename: string = 'movimentacoes.xlsx') => {
  // Expandir movimentações com itens
  const expandedMovements = expandMovementsWithItems(movements);
  
  const data: ExportMovement[] = expandedMovements.map(m => {
    const paidInstallments = m.installments?.filter(i => i.isPaid).length || 0;
    const totalInstallments = m.installments?.length || 0;
    const installmentText = totalInstallments > 0 ? `${paidInstallments}/${totalInstallments}` : '-';
    
    return {
      data: formatDate(m.date),
      tipo: m.type === 'entrada' ? 'Entrada' : 'Saída',
      tipoPagamento: getMovementTypeLabel(m.movementType),
      classificacao: m.classification === 'fixo' ? 'Fixo' : m.classification === 'temporario' ? 'Temporário' : '-',
      categoria: m.category,
      descricao: m.description,
      banco: m.itemDetail || '-',
      parcela: installmentText,
      vencimento: m.installments && m.installments.length > 0 ? formatDate(m.installments[0].dueDate) : '-',
      valor: formatCurrency(m.amount),
      status: m.isPaid ? 'Pago' : 'Pendente',
      observacoes: m.notes || '-'
    };
  });
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Ajustar largura das colunas para evitar cortes
  const columnWidths = [
    { wch: 12 },  // data
    { wch: 10 },  // tipo
    { wch: 22 },  // tipoPagamento
    { wch: 15 },  // classificacao
    { wch: 25 },  // categoria
    { wch: 50 },  // descricao
    { wch: 30 },  // banco/detalhe
    { wch: 12 },  // parcela
    { wch: 12 },  // vencimento
    { wch: 18 },  // valor
    { wch: 12 },  // status
    { wch: 40 },  // observacoes
  ];
  worksheet['!cols'] = columnWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimentações');
  
  XLSX.writeFile(workbook, filename);
};

// Funções para relatório avançado
export const exportAdvancedReportToPDF = (
  data: any,
  filename: string = 'relatorio-avancado.pdf'
) => {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.text('Relatório Avançado', 14, 20);
  
  // Data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
  
  let yPosition = 40;
  
  // Resumo Geral
  doc.setFontSize(14);
  doc.text('Resumo Geral', 14, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.text(`Total de Entradas: ${formatCurrency(data.totalEntrada || 0)}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Total de Saídas: ${formatCurrency(data.totalSaida || 0)}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Saldo Líquido: ${formatCurrency(data.liquido || 0)}`, 14, yPosition);
  yPosition += 10;
  
  // Movimentações por Categoria
  if (data.categoriesData && data.categoriesData.length > 0) {
    doc.setFontSize(14);
    doc.text('Movimentações por Categoria', 14, yPosition);
    yPosition += 8;
    
    const categoryTableData = data.categoriesData.map((cat: any) => [
      cat.name,
      formatCurrency(cat.value),
      `${cat.percentage}%`
    ]);
    
    autoTable(doc, {
      head: [['Categoria', 'Valor', '%']],
      body: categoryTableData,
      startY: yPosition,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 85, 105] }
    });
  }
  
  doc.save(filename);
};

export const exportAdvancedReportToCSV = (
  movements: Movement[],
  categoriesData: any[],
  filename: string = 'relatorio-avancado.csv'
) => {
  // Se houver dados de categoria, exportar categorias, senão exportar movimentações
  if (categoriesData && categoriesData.length > 0) {
    const headers = ['Categoria', 'Tipo', 'Valor Total', 'Porcentagem', 'Quantidade'];
    
    const rows = categoriesData.map(cat => [
      cat.name,
      cat.type || '-',
      cat.value.toString().replace('.', ','),
      cat.percentage + '%',
      cat.count || 0
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Exportar movimentações como fallback
    exportMovementsToCSV(movements, filename);
  }
};

export const exportAdvancedReportToExcel = (
  movements: Movement[],
  categoriesData: any[],
  filename: string = 'relatorio-avancado.xlsx'
) => {
  const workbook = XLSX.utils.book_new();
  
  // Sheet 1: Resumo por Categorias (se houver dados)
  if (categoriesData && categoriesData.length > 0) {
    const categoryData = categoriesData.map(cat => ({
      Categoria: cat.name,
      Tipo: cat.type || '-',
      Valor: cat.value,
      Porcentagem: cat.percentage + '%',
      Quantidade: cat.count || 0
    }));
    
    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    categorySheet['!cols'] = [
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categorias');
  }
  
  // Sheet 2: Todas as Movimentações
  const movementsData = movements.map(m => ({
    Data: formatDate(m.date),
    Tipo: m.type === 'entrada' ? 'Entrada' : 'Saída',
    Categoria: m.category,
    Descrição: m.description,
    Valor: m.amount,
    Status: m.isPaid ? 'Pago' : 'Pendente'
  }));
  
  const movementsSheet = XLSX.utils.json_to_sheet(movementsData);
  movementsSheet['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
    { wch: 40 },
    { wch: 15 },
    { wch: 10 }
  ];
  XLSX.utils.book_append_sheet(workbook, movementsSheet, 'Movimentações');
  
  XLSX.writeFile(workbook, filename);
};
