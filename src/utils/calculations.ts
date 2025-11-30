import type { Transaction, DashboardStats, MonthlySummary, Movement, PaymentStatus } from '../types';

export const calculateStats = (transactions: Transaction[], movements: Movement[]): DashboardStats => {
  // Transações antigas
  const totalEntrada = transactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSaida = transactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + t.amount, 0);

  // Movimentações (sistema novo)
  // Para movimentações com parcelas, conta apenas o valor das parcelas já pagas
  // NÃO filtra por m.isPaid - conta parcelas pagas mesmo se a movimentação não está 100% paga
  const movementEntrada = movements
    .filter(m => m.type === 'entrada')
    .reduce((sum, m) => {
      if (m.installments && m.installments.length > 0) {
        // Se tem parcelas, soma apenas as pagas
        const paidAmount = m.installments
          .filter(inst => inst.isPaid)
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + paidAmount;
      }
      // Se não tem parcelas e está paga, soma o valor total
      return m.isPaid ? sum + m.amount : sum;
    }, 0);

  const movementSaidaFixo = movements
    .filter(m => m.type === 'saida' && m.classification === 'fixo')
    .reduce((sum, m) => {
      if (m.installments && m.installments.length > 0) {
        const paidAmount = m.installments
          .filter(inst => inst.isPaid)
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + paidAmount;
      }
      return m.isPaid ? sum + m.amount : sum;
    }, 0);

  const movementSaidaOcasional = movements
    .filter(m => m.type === 'saida' && m.classification === 'ocasional')
    .reduce((sum, m) => {
      if (m.installments && m.installments.length > 0) {
        const paidAmount = m.installments
          .filter(inst => inst.isPaid)
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + paidAmount;
      }
      return m.isPaid ? sum + m.amount : sum;
    }, 0);

  const movementSaidaNenhum = movements
    .filter(m => m.type === 'saida' && m.classification === 'nenhum')
    .reduce((sum, m) => {
      if (m.installments && m.installments.length > 0) {
        const paidAmount = m.installments
          .filter(inst => inst.isPaid)
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + paidAmount;
      }
      return m.isPaid ? sum + m.amount : sum;
    }, 0);

  const totalEntradaFinal = totalEntrada + movementEntrada;
  const totalSaidaFinal = totalSaida + movementSaidaFixo + movementSaidaOcasional + movementSaidaNenhum;

  const liquido = totalEntradaFinal - totalSaidaFinal;

  // Novos cálculos
  const atrasado = movements
    .filter(m => m.isOverdue)
    .reduce((sum, m) => sum + (m.overdueAmount || m.amount), 0);

  const pendente = movements
    .filter(m => !m.isPaid && !m.isOverdue)
    .reduce((sum, m) => {
      // Se tem parcelas, calcula o saldo de parcelas não pagas
      if (m.installments && m.installments.length > 0) {
        const unpaidAmount = m.installments
          .filter(inst => !inst.isPaid)
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + unpaidAmount;
      }
      return sum + (m.amount - (m.partialPaidAmount || 0));
    }, 0);

  const aReceber = movements
    .filter(m => m.type === 'entrada' && !m.isPaid)
    .reduce((sum, m) => {
      // Se tem parcelas, calcula o saldo de parcelas não pagas
      if (m.installments && m.installments.length > 0) {
        const unpaidAmount = m.installments
          .filter(inst => !inst.isPaid)
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + unpaidAmount;
      }
      return sum + (m.amount - (m.partialPaidAmount || 0));
    }, 0);

  const aPagar = movements
    .filter(m => m.type === 'saida' && !m.isPaid)
    .reduce((sum, m) => {
      // Se tem parcelas, calcula o saldo de parcelas não pagas
      if (m.installments && m.installments.length > 0) {
        const unpaidAmount = m.installments
          .filter(inst => !inst.isPaid)
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + unpaidAmount;
      }
      return sum + (m.amount - (m.partialPaidAmount || 0));
    }, 0);

  // Total geral de gastos (incluindo pagos, pendentes e parcelas futuras)
  const totalGeralGastos = movements
    .filter(m => m.type === 'saida')
    .reduce((sum, m) => sum + m.amount, 0);

  // Total geral de ganhos (incluindo recebidos, a receber e parcelas futuras)
  const totalGeralGanhos = movements
    .filter(m => m.type === 'entrada')
    .reduce((sum, m) => sum + m.amount, 0);

  return {
    totalEntrada: totalEntradaFinal,
    totalSaida: totalSaidaFinal,
    liquido,
    lucro: liquido,
    fixoSaida: movementSaidaFixo,
    ocasionalSaida: movementSaidaOcasional,
    fixoEntrada: movements
      .filter(m => m.type === 'entrada' && m.classification === 'fixo')
      .reduce((sum, m) => {
        if (m.installments && m.installments.length > 0) {
          const paidAmount = m.installments
            .filter(inst => inst.isPaid)
            .reduce((s, inst) => s + inst.amount, 0);
          return sum + paidAmount;
        }
        return m.isPaid ? sum + m.amount : sum;
      }, 0),
    ocasionalEntrada: movements
      .filter(m => m.type === 'entrada' && m.classification === 'ocasional')
      .reduce((sum, m) => {
        if (m.installments && m.installments.length > 0) {
          const paidAmount = m.installments
            .filter(inst => inst.isPaid)
            .reduce((s, inst) => s + inst.amount, 0);
          return sum + paidAmount;
        }
        return m.isPaid ? sum + m.amount : sum;
      }, 0),
    atrasado,
    pendente,
    aReceber,
    aPagar,
    totalGeralGastos,
    totalGeralGanhos,
  };
};

export const getMonthlySummary = (transactions: Transaction[], movements: Movement[]): MonthlySummary[] => {
  const months = new Map<string, { 
    entrada: number; 
    saida: number; 
    fixoSaida: number;
    ocasionalSaida: number;
    atrasado: number;
    pendente: number;
    aReceber: number;
    aPagar: number;
  }>();

  transactions.forEach(t => {
    const monthKey = t.date.substring(0, 7);
    if (!months.has(monthKey)) {
      months.set(monthKey, { entrada: 0, saida: 0, fixoSaida: 0, ocasionalSaida: 0, atrasado: 0, pendente: 0, aReceber: 0, aPagar: 0 });
    }
    const data = months.get(monthKey)!;
    if (t.type === 'entrada') {
      data.entrada += t.amount;
    } else {
      data.saida += t.amount;
    }
  });

  movements.forEach(m => {
    const monthKey = m.date.substring(0, 7);
    if (!months.has(monthKey)) {
      months.set(monthKey, { entrada: 0, saida: 0, fixoSaida: 0, ocasionalSaida: 0, atrasado: 0, pendente: 0, aReceber: 0, aPagar: 0 });
    }
    const data = months.get(monthKey)!;

    // Para movimentações com parcelas, contar as pagas (mesmo que movimentação não esteja 100% paga)
    let paidAmount = 0;
    if (m.installments && m.installments.length > 0) {
      paidAmount = m.installments
        .filter(inst => inst.isPaid)
        .reduce((sum, inst) => sum + inst.amount, 0);
    } else if (m.isPaid) {
      paidAmount = m.amount;
    }

    if (m.isOverdue && !m.isPaid) {
      data.atrasado += m.overdueAmount || m.amount;
    } else if (!m.isPaid) {
      data.pendente += m.amount - (m.partialPaidAmount || 0);
    }

    if (m.type === 'entrada') {
      if (!m.isPaid) data.aReceber += m.amount - (m.partialPaidAmount || 0);
      data.entrada += paidAmount;
    } else {
      if (!m.isPaid) data.aPagar += m.amount - (m.partialPaidAmount || 0);
      data.saida += paidAmount;
      if (m.classification === 'fixo') {
        data.fixoSaida += paidAmount;
      } else if (m.classification === 'ocasional') {
        data.ocasionalSaida += paidAmount;
      }
    }
  });

  return Array.from(months.entries())
    .map(([month, data]) => ({
      month,
      ...data,
      liquido: data.entrada - data.saida,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

export const getBestAndWorstMonths = (summary: MonthlySummary[]) => {
  if (summary.length === 0) {
    return { bestMonth: null, bestValue: 0, worstMonth: null, worstValue: 0 };
  }

  let bestMonth = summary[0];
  let worstMonth = summary[0];

  summary.forEach(m => {
    if (m.entrada > bestMonth.entrada) bestMonth = m;
    if (m.saida > worstMonth.saida) worstMonth = m;
  });

  return {
    bestMonth: bestMonth.month,
    bestValue: bestMonth.entrada,
    worstMonth: worstMonth.month,
    worstValue: worstMonth.saida,
  };
};

export const getPendingBalance = (movements: Movement[]) => {
  const pendingEntrada = movements
    .filter(m => m.type === 'entrada' && !m.isPaid)
    .reduce((sum, m) => sum + (m.amount - (m.partialPaidAmount || 0)), 0);

  const pendingSaida = movements
    .filter(m => m.type === 'saida' && !m.isPaid)
    .reduce((sum, m) => sum + (m.amount - (m.partialPaidAmount || 0)), 0);

  const overdueAmount = movements
    .filter(m => m.isOverdue)
    .reduce((sum, m) => sum + (m.overdueAmount || m.amount), 0);

  return {
    pendingEntrada,
    pendingSaida,
    pendingBalance: pendingEntrada - pendingSaida,
    overdueAmount,
  };
};

// NOVAS FUNÇÕES DE ANÁLISE

export const calculateInstallmentProgress = (movement: Movement) => {
  if (!movement.installments) {
    return { paid: 0, total: 1, percentage: 0 };
  }

  const paid = movement.installments.filter(i => i.isPaid).length;
  const total = movement.installments.length;

  return {
    paid,
    total,
    percentage: (paid / total) * 100,
  };
};

export const getDaysUntilDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isOverdue = (dueDate: string): boolean => {
  const due = new Date(dueDate);
  const today = new Date();
  return due < today;
};

export const getDaysPastDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  if (due >= today) return 0;
  const diffTime = today.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const getPaymentStatus = (movement: Movement): PaymentStatus => {
  if (movement.isPaid) return 'pago';
  if (movement.partialPaidAmount && movement.partialPaidAmount > 0) return 'parcial';
  if (movement.isOverdue) return 'atrasado';
  return 'pendente';
};

export const calculateCashFlowForecast = (movements: Movement[], days = 30) => {
  const forecast: { date: string; income: number; expense: number; balance: number }[] = [];
  const today = new Date();
  let balance = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    let dayIncome = 0;
    let dayExpense = 0;

    movements.forEach(m => {
      if (m.isPaid) return;

      if (m.installments) {
        m.installments.forEach(inst => {
          if (!inst.isPaid && inst.dueDate === dateStr) {
            if (m.type === 'entrada') {
              dayIncome += inst.amount;
            } else {
              dayExpense += inst.amount;
            }
          }
        });
      } else if (m.date === dateStr) {
        if (m.type === 'entrada') {
          dayIncome += m.amount;
        } else {
          dayExpense += m.amount;
        }
      }
    });

    balance += dayIncome - dayExpense;

    if (dayIncome > 0 || dayExpense > 0) {
      forecast.push({ date: dateStr, income: dayIncome, expense: dayExpense, balance });
    }
  }

  return forecast;
};

export const getMovementSummaryByCategory = (movements: Movement[]) => {
  const summary: Record<string, { income: number; expense: number; count: number }> = {};

  movements.forEach(m => {
    if (!summary[m.category]) {
      summary[m.category] = { income: 0, expense: 0, count: 0 };
    }

    if (m.type === 'entrada') {
      summary[m.category].income += m.amount;
    } else {
      summary[m.category].expense += m.amount;
    }
    summary[m.category].count++;
  });

  return summary;
};

export const getInstallmentCompletionInfo = (movement: Movement) => {
  if (!movement.installments) return null;

  const paid = movement.installments.filter(i => i.isPaid).length;
  const total = movement.installments.length;
  const remaining = total - paid;
  
  const nextDue = movement.installments.find(i => !i.isPaid);
  const lastDue = [...movement.installments].reverse().find(i => !i.isPaid);

  return {
    paid,
    total,
    remaining,
    percentage: (paid / total) * 100,
    nextDueDate: nextDue?.dueDate,
    nextDueAmount: nextDue?.amount,
    finalDueDate: lastDue?.dueDate,
    finalAmount: lastDue?.amount,
    nextDueDaysRemaining: nextDue ? getDaysUntilDue(nextDue.dueDate) : 0,
  };
};

export const calculateTotalOverdue = (movements: Movement[]): number => {
  return movements
    .filter(m => m.isOverdue)
    .reduce((sum, m) => sum + (m.overdueAmount || m.amount), 0);
};

export const getOverdueBreakdown = (movements: Movement[]) => {
  const overdue = movements.filter(m => m.isOverdue);
  
  return {
    totalCount: overdue.length,
    totalAmount: calculateTotalOverdue(movements),
    byCategory: overdue.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    oldestDate: overdue.length > 0 ? overdue.map(m => m.date).sort()[0] : null,
  };
};

export const getProjectedCashFlow = (movements: Movement[], days = 90) => {
  const today = new Date();
  let projectedBalance = 0;

  const projection = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    movements.forEach(m => {
      if (m.isPaid) return;

      if (m.installments) {
        m.installments.forEach(inst => {
          if (!inst.isPaid && inst.dueDate === dateStr) {
            if (m.type === 'entrada') monthlyIncome += inst.amount;
            else monthlyExpense += inst.amount;
          }
        });
      } else if (m.date === dateStr && !m.isPaid) {
        if (m.type === 'entrada') monthlyIncome += m.amount;
        else monthlyExpense += m.amount;
      }
    });

    projectedBalance += monthlyIncome - monthlyExpense;

    if (monthlyIncome > 0 || monthlyExpense > 0) {
      projection.push({
        date: dateStr,
        income: monthlyIncome,
        expense: monthlyExpense,
        balance: projectedBalance,
        critical: projectedBalance < 0,
      });
    }
  }

  return projection;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

export const getMonthName = (monthString: string): string => {
  const [year, month] = monthString.split('-');
  const date = new Date(`${year}-${month}-01T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
};

export const getMovementTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    pix: '📱 Pix',
    credito_avista: '💳 Crédito à Vista',
    parcelado: '📅 Parcelado',
    dinheiro: '💵 Dinheiro',
    transferencia: '🏦 Transferência',
    boleto: '📄 Boleto',
    debito: '🏧 Débito',
  };
  return labels[type] || type;
};

export const getStatusLabel = (status: PaymentStatus): string => {
  const labels: Record<PaymentStatus, string> = {
    pago: '✅ Pago',
    parcial: '⚠️ Parcial',
    pendente: '⏳ Pendente',
    atrasado: '🔴 Atrasado',
  };
  return labels[status];
};

export const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    alta: '🔴 Alta',
    média: '🟡 Média',
    baixa: '🟢 Baixa',
  };
  return labels[priority] || priority;
};

// Função para contar quantidade de vendas (entradas) por mês
// Conta cada movimentação/transação como 1 venda (não por parcela)
export const getSalesCountByMonth = (transactions: Transaction[], movements: Movement[]): Array<{ month: string; count: number; monthName: string }> => {
  const months = new Map<string, number>();

  // Contar transações antigas
  transactions
    .filter(t => t.type === 'entrada')
    .forEach(t => {
      const monthKey = t.date.substring(0, 7);
      months.set(monthKey, (months.get(monthKey) || 0) + 1);
    });

  // Contar movimentações de entrada (cada movimentação = 1 venda)
  movements
    .filter(m => m.type === 'entrada')
    .forEach(m => {
      const monthKey = m.date.substring(0, 7);
      months.set(monthKey, (months.get(monthKey) || 0) + 1);
    });

  return Array.from(months.entries())
    .map(([month, count]) => ({
      month,
      count,
      monthName: getMonthName(month),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

// Calcula gastos fixos em tempo real considerando a duração
export const calculateRealTimeFixedExpenses = (movements: Movement[]): number => {
  const today = new Date();

  return movements
    .filter(m => m.type === 'saida' && m.classification === 'fixo')
    .reduce((sum, m) => {
      // Se não tem duração definida (indeterminado), contar como gasto fixo
      if (!m.fixedExpenseDuration) {
        return sum + m.amount;
      }

      // Se tem duração definida, verificar se ainda está dentro do período
      const movementDate = new Date(m.date);

      // Calcular data de término (data inicio + duração em meses)
      const endDate = new Date(movementDate);
      endDate.setMonth(endDate.getMonth() + m.fixedExpenseDuration);

      // Se a data de hoje está dentro do período, contar como gasto fixo ativo
      if (today <= endDate) {
        return sum + m.amount;
      }

      return sum;
    }, 0);
};

// Obter quantidade de entradas e saídas
export const getMovementCounts = (movements: Movement[]): { entradas: number; saidas: number } => {
  const entradas = movements.filter(m => m.type === 'entrada').length;
  const saidas = movements.filter(m => m.type === 'saida').length;
  return { entradas, saidas };
};

// Contar quantidade de pendências
export const getPendingCount = (movements: Movement[]): number => {
  return movements.filter(m => !m.isPaid).length;
};

// Calcula gastos fixos pagos neste mês
export const calculatePaidFixedExpensesThisMonth = (movements: Movement[]): number => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  return movements
    .filter(m => 
      m.type === 'saida' && 
      m.classification === 'fixo' && 
      m.isPaid &&
      m.paidDate
    )
    .reduce((sum, m) => {
      const paidDate = new Date(m.paidDate!);
      const paidYear = paidDate.getFullYear();
      const paidMonth = paidDate.getMonth() + 1;

      // Verificar se foi pago neste mês
      if (paidYear === currentYear && paidMonth === currentMonth) {
        return sum + m.amount;
      }

      return sum;
    }, 0);
};

// Função para contar quantidade de movimentações por categoria
export const getQuantityByCategory = (transactions: Transaction[], movements: Movement[]): Array<{ name: string; value: number }> => {
  const categories = new Map<string, number>();

  // Contar transações antigas
  transactions.forEach(t => {
    const current = categories.get(t.category) || 0;
    categories.set(t.category, current + 1);
  });

  // Contar movimentações (cada uma = 1)
  movements.forEach(m => {
    const current = categories.get(m.category) || 0;
    categories.set(m.category, current + 1);
  });

  return Array.from(categories.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

// Função para contar ganhos (entradas) por categoria
export const getGainsByCategory = (transactions: Transaction[], movements: Movement[]): Array<{ name: string; value: number }> => {
  const categories = new Map<string, number>();

  // Contar transações antigas de entrada
  transactions
    .filter(t => t.type === 'entrada')
    .forEach(t => {
      const current = categories.get(t.category) || 0;
      categories.set(t.category, current + t.amount);
    });

  // Contar movimentações de entrada - apenas pagas
  movements
    .filter(m => m.type === 'entrada')
    .forEach(m => {
      let amountToAdd = m.amount;
      
      // Para movimentações com parcelas, contar apenas as pagas
      if (m.installments && m.installments.length > 0) {
        amountToAdd = m.installments
          .filter(inst => inst.isPaid)
          .reduce((sum, inst) => sum + inst.amount, 0);
      }
      
      const current = categories.get(m.category) || 0;
      categories.set(m.category, current + amountToAdd);
    });

  return Array.from(categories.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

// Função para calcular renda fixa mensal em tempo real
export const calculateMonthlyFixedIncome = (movements: Movement[]): number => {
  const now = new Date();
  
  return movements
    .filter(m => {
      if (m.type !== 'entrada' || !m.category.includes('Renda Fixa')) {
        return false;
      }
      
      // Verificar se a movimentação tem classificação fixa ou se é recorrente
      if (m.classification !== 'fixo') {
        return false;
      }
      
      // Verificar duração do gasto fixo
      const movementDate = new Date(m.date);
      if (m.fixedExpenseDuration) {
        const endDate = new Date(movementDate);
        endDate.setMonth(endDate.getMonth() + m.fixedExpenseDuration);
        if (now > endDate) {
          return false; // Movimentação fixa já expirou
        }
      }
      
      return true;
    })
    .reduce((sum, m) => sum + m.amount, 0);
};

// Função para calcular previsão de saldo no final do mês
export const calculateEndOfMonthForecast = (movements: Movement[]): number => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Saldo atual (tudo que já foi pago até hoje)
  let currentBalance = 0;
  
  movements.forEach(m => {
    if (m.installments && m.installments.length > 0) {
      const paidAmount = m.installments
        .filter(inst => inst.isPaid)
        .reduce((sum, inst) => sum + inst.amount, 0);
      if (m.type === 'entrada') {
        currentBalance += paidAmount;
      } else {
        currentBalance -= paidAmount;
      }
    } else if (m.isPaid) {
      if (m.type === 'entrada') {
        currentBalance += m.amount;
      } else {
        currentBalance -= m.amount;
      }
    }
  });
  
  // Entradas previstas até o final do mês
  const expectedIncome = movements
    .filter(m => {
      if (m.type !== 'entrada') return false;
      
      // Parcelas não pagas que vencem este mês
      if (m.installments && m.installments.length > 0) {
        return m.installments.some(inst => 
          !inst.isPaid && 
          inst.dueDate.startsWith(currentMonth) &&
          new Date(inst.dueDate) <= lastDayOfMonth
        );
      }
      
      // Movimentações não pagas deste mês
      return !m.isPaid && 
        m.date.startsWith(currentMonth) &&
        new Date(m.date) <= lastDayOfMonth;
    })
    .reduce((sum, m) => {
      if (m.installments && m.installments.length > 0) {
        const unpaidThisMonth = m.installments
          .filter(inst => 
            !inst.isPaid && 
            inst.dueDate.startsWith(currentMonth) &&
            new Date(inst.dueDate) <= lastDayOfMonth
          )
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + unpaidThisMonth;
      }
      return sum + m.amount;
    }, 0);
  
  // Saídas previstas até o final do mês
  const expectedExpenses = movements
    .filter(m => {
      if (m.type !== 'saida') return false;
      
      // Parcelas não pagas que vencem este mês
      if (m.installments && m.installments.length > 0) {
        return m.installments.some(inst => 
          !inst.isPaid && 
          inst.dueDate.startsWith(currentMonth) &&
          new Date(inst.dueDate) <= lastDayOfMonth
        );
      }
      
      // Movimentações não pagas deste mês
      return !m.isPaid && 
        m.date.startsWith(currentMonth) &&
        new Date(m.date) <= lastDayOfMonth;
    })
    .reduce((sum, m) => {
      if (m.installments && m.installments.length > 0) {
        const unpaidThisMonth = m.installments
          .filter(inst => 
            !inst.isPaid && 
            inst.dueDate.startsWith(currentMonth) &&
            new Date(inst.dueDate) <= lastDayOfMonth
          )
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + unpaidThisMonth;
      }
      return sum + m.amount;
    }, 0);
  
  // Rendas fixas ativas (receita mensal garantida)
  const fixedIncome = movements
    .filter(m => {
      if (m.type !== 'entrada' || m.classification !== 'fixo') return false;
      if (!m.category.includes('Renda Fixa')) return false;
      
      const movementDate = new Date(m.date);
      if (m.fixedExpenseDuration) {
        const endDate = new Date(movementDate);
        endDate.setMonth(endDate.getMonth() + m.fixedExpenseDuration);
        if (now > endDate) return false;
      }
      
      return true;
    })
    .reduce((sum, m) => sum + m.amount, 0);
  
  // Gastos fixos ativos (despesa mensal garantida)
  const fixedExpenses = movements
    .filter(m => {
      if (m.type !== 'saida' || m.classification !== 'fixo') return false;
      
      const movementDate = new Date(m.date);
      if (m.fixedExpenseDuration) {
        const endDate = new Date(movementDate);
        endDate.setMonth(endDate.getMonth() + m.fixedExpenseDuration);
        if (now > endDate) return false;
      }
      
      return true;
    })
    .reduce((sum, m) => sum + m.amount, 0);
  
  // Previsão final: saldo atual + entradas previstas - saídas previstas + rendas fixas - gastos fixos
  return currentBalance + expectedIncome - expectedExpenses + fixedIncome - fixedExpenses;
};

// Função para calcular evolução de renda fixa e gastos fixos
export const getFixedIncomeVsExpenseEvolution = (movements: Movement[], period: '1m' | '6m' | '1y' | '5y') => {
  const now = new Date();
  const months: { month: string; rendaFixa: number; gastoFixo: number }[] = [];
  
  let monthsToShow = 1;
  switch (period) {
    case '1m': monthsToShow = 1; break;
    case '6m': monthsToShow = 6; break;
    case '1y': monthsToShow = 12; break;
    case '5y': monthsToShow = 60; break;
  }

  // Gerar os últimos N meses
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
    
    // Calcular renda fixa do mês
    const rendaFixa = movements
      .filter(m => 
        m.type === 'entrada' && 
        m.category.includes('Renda Fixa') &&
        m.date.startsWith(monthKey)
      )
      .reduce((sum, m) => {
        if (m.installments && m.installments.length > 0) {
          const paidAmount = m.installments
            .filter(inst => inst.isPaid && inst.dueDate.startsWith(monthKey))
            .reduce((s, inst) => s + inst.amount, 0);
          return sum + paidAmount;
        }
        return m.isPaid ? sum + m.amount : sum;
      }, 0);

    // Calcular gasto fixo do mês
    const gastoFixo = movements
      .filter(m => 
        m.type === 'saida' && 
        m.classification === 'fixo' &&
        m.date.startsWith(monthKey)
      )
      .reduce((sum, m) => {
        if (m.installments && m.installments.length > 0) {
          const paidAmount = m.installments
            .filter(inst => inst.isPaid && inst.dueDate.startsWith(monthKey))
            .reduce((s, inst) => s + inst.amount, 0);
          return sum + paidAmount;
        }
        return m.isPaid ? sum + m.amount : sum;
      }, 0);

    months.push({
      month: monthKey,
      rendaFixa,
      gastoFixo
    });
  }

  return months;
};

// Calcular quanto a pagar no mês atual
export const getMonthlyPayables = (movements: Movement[]): number => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  
  return movements
    .filter(m => m.type === 'saida' && !m.isPaid)
    .reduce((sum, m) => {
      // Se tem parcelas, verificar parcelas não pagas com vencimento neste mês
      if (m.installments && m.installments.length > 0) {
        const unpaidThisMonth = m.installments
          .filter(inst => !inst.isPaid && inst.dueDate.startsWith(currentMonth))
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + unpaidThisMonth;
      }
      // Se não tem parcelas, verificar se a data de vencimento é neste mês
      if (m.date.startsWith(currentMonth)) {
        return sum + m.amount;
      }
      return sum;
    }, 0);
};

// Calcular quanto a receber no mês atual
export const getMonthlyReceivables = (movements: Movement[]): number => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  
  return movements
    .filter(m => m.type === 'entrada' && !m.isPaid)
    .reduce((sum, m) => {
      // Se tem parcelas, verificar parcelas não pagas com vencimento neste mês
      if (m.installments && m.installments.length > 0) {
        const unpaidThisMonth = m.installments
          .filter(inst => !inst.isPaid && inst.dueDate.startsWith(currentMonth))
          .reduce((s, inst) => s + inst.amount, 0);
        return sum + unpaidThisMonth;
      }
      // Se não tem parcelas, verificar se a data de vencimento é neste mês
      if (m.date.startsWith(currentMonth)) {
        return sum + m.amount;
      }
      return sum;
    }, 0);
};



