export type TransactionType = 'entrada' | 'saida';
export type MovementType = 'pix' | 'cartao_credito' | 'parcelado' | 'dinheiro' | 'transferencia' | 'boleto' | 'debito';
export type ExpenseClassification = 'fixo' | 'ocasional' | 'nenhum';
export type PaymentStatus = 'pendente' | 'parcial' | 'pago' | 'atrasado';

// Subcategorias de Entrada
export type EntradaSubcategory = 
  | 'vendas_balcao'
  | 'vendas_online'
  | 'vendas_a_prazo'
  | 'servicos_prestados'
  | 'renda_fixa'
  | 'devolucoes'
  | 'juros_recebidos'
  | 'reembolsos'
  | 'outra_entrada';

// Subcategorias de Saída
export type SaidaSubcategory = 
  | 'fornecedores'
  | 'aluguel'
  | 'salarios'
  | 'transportes'
  | 'utilidades'
  | 'marketing'
  | 'impostos'
  | 'manutencao'
  | 'escritorio'
  | 'materiais'
  | 'compra_estoque'
  | 'consultorias'
  | 'outra_saida';

// Interface para itens de compra individuais
export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Interface para parcelas individuais
export interface Installment {
  id: string;
  number: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  isPaid: boolean;
  daysPastDue: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // Data customizável
  timestamp: number;
  recurrence?: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual';
}

export interface Movement {
  id: string;
  transactionId: string;
  type: TransactionType;
  movementType: MovementType;
  amount: number;
  category: string; // Categoria principal
  subcategory?: EntradaSubcategory | SaidaSubcategory; // Subcategoria detalhada
  description: string;
  date: string; // Data customizável
  timestamp: number;
  classification: ExpenseClassification;
  status: PaymentStatus;
  
  // Campos de parcelas expandidos
  installments?: Installment[];
  totalInstallments?: number;
  paidInstallments?: number;
  
  // Rastreamento detalhado
  isPaid: boolean;
  paidDate?: string;
  partialPaidAmount?: number;
  lastPaymentDate?: string;
  
  // Lembretes e alertas
  reminderDate?: string;
  dueDate?: string; // Data de vencimento extraída das notas ou das parcelas
  isOverdue: boolean;
  overdueAmount?: number;
  notes?: string;
  
  // Vinculação de documentos/comprovantes
  attachmentUrl?: string;
  comprovante?: string;
  
  // Duração para gastos fixos (em meses, undefined = indeterminado)
  fixedExpenseDuration?: number;
  
  // Itens de compra (para categoria 'fornecedores')
  purchaseItems?: PurchaseItem[];
}

export interface DashboardStats {
  totalEntrada: number;
  totalSaida: number;
  liquido: number;
  lucro: number;
  fixoSaida: number;
  ocasionalSaida: number;
  fixoEntrada: number;
  ocasionalEntrada: number;
  
  // Novos campos
  atrasado: number;
  pendente: number;
  aReceber: number;
  aPagar: number;
  totalGeralGastos: number;
  totalGeralGanhos: number;
}

export interface MonthlySummary {
  month: string;
  entrada: number;
  saida: number;
  liquido: number;
  fixoSaida: number;
  ocasionalSaida: number;
  atrasado: number;
  pendente: number;
  aReceber: number;
  aPagar: number;
}

// Relatório de fluxo de caixa
export interface CashFlowReport {
  period: string;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  pendingIncome: number;
  pendingExpense: number;
  projectedBalance: number;
}

// Análise de pagamentos atrasados
export interface OverdueAnalysis {
  totalOverdueAmount: number;
  numberOfOverdueItems: number;
  oldestOverdueDate: string;
  overdueItems: Movement[];
}

// Previsão de fluxo futuro
export interface FutureFlowForecast {
  date: string;
  projectedBalance: number;
  expectedIncome: number;
  expectedExpense: number;
  criticalDates: string[];
}

export interface DebtInterest {
  movementId: string;
  interestRate: number; // porcentagem
  periodType: 'day' | 'month'; // por dia ou por mês
}

export interface DebtFine {
  movementId: string;
  fineRate: number; // porcentagem da dívida ou valor fixo
  fineType: 'percentage' | 'fixed'; // percentual ou valor fixo
  appliedDate?: string; // data em que a multa foi aplicada
}


