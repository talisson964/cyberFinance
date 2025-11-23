# Sistema de Controle de Caixa - v2.0.0 - Melhorias Implementadas

## 🎯 Visão Geral

Versão 2.0.0 traz **melhorias significativas de funcionalidades de gestão e controle de caixa**, focando em rastreamento detalhado de installments, previsão de fluxo de caixa, análise de atrasos e muito mais.

## ✨ Principais Melhorias

### 1. **Sistema de Priorização** 🔴🟡🟢
- Cada movimentação pode ser classificada com prioridade (Alta, Média, Baixa)
- Filtragem por prioridade para melhor gestão
- Visualização de atrasados por nível de prioridade

### 2. **Data Manual para Transações e Movimentações** 📅
- Possibilidade de registrar data customizada para qualquer entrada/saída
- Data padrão é o dia atual, mas pode ser alterada
- Importante para registrar eventos passados ou planejados

### 3. **Sistema Avançado de Parcelas** 📊
- Rastreamento individual de cada parcela (número, valor, data de vencimento, status)
- Marcar parcelas individuais como pagas com data customizada
- Visualizar progresso de quitação (ex: 7/12 parcelas pagas = 58%)
- Suporte de 2 a 48 parcelas

### 4. **Anotações e Observações** 📝
- Campo de anotações em cada movimentação
- Permite adicionar contexto ou observações importantes
- Útil para rastreabilidade e histórico

### 5. **Dashboard Melhorado** 📈
Novos cards de status de pagamento:
- **🔴 Atrasado**: Valores com vencimento passado não pagos
- **🟡 Pendente**: Valores a vencer (próximos 30 dias)
- **🟢 A Receber**: Total de entradas esperadas
- **🔵 A Pagar**: Total de saídas esperadas

### 6. **Página de Relatórios Avançados** 📊
Nova página com 4 seções principais:

#### 6.1 **Análise de Atrasados**
- Total de valor atrasado
- Quantidade de itens atrasados
- Data do item mais antigo
- Gráficos:
  - Atrasados por categoria
  - Atrasados por nível de prioridade
- Tabela detalhada de itens atrasados

#### 6.2 **Previsão de Fluxo de Caixa (30 dias)**
- Gráfico de linha: Entradas vs Saídas esperadas
- Informações resumidas:
  - Total de entradas previstas
  - Total de saídas previstas
  - Saldo líquido esperado

#### 6.3 **Acompanhamento de Parcelas**
- Lista de todas as movimentações parceladas
- Barra de progresso visual (% de conclusão)
- Número de parcelas pagas vs total
- Código de cores por progresso:
  - 🟢 100% concluído
  - 🟡 50-99%
  - 🔴 < 50%

#### 6.4 **Próximos Vencimentos (7 dias)**
- Lista de parcelas vencendo nos próximos 7 dias
- Ordenadas por data
- Informações:
  - Descrição e valor
  - Categoria
  - Nível de prioridade
  - Número da parcela

## 🔧 Alterações Técnicas

### Tipos TypeScript Expandidos (`src/types/index.ts`)

#### Nova Interface `Installment`
```typescript
interface Installment {
  id: string;
  number: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  isPaid: boolean;
  daysPastDue: number;
}
```

#### Novos Enums
- `PaymentStatus`: 'pendente' | 'parcial' | 'pago' | 'atrasado'
- `Priority`: 'alta' | 'média' | 'baixa'

#### Interface `Movement` Estendida
```typescript
- date: string (data customizada da movimentação)
- priority: Priority (nível de prioridade)
- installments: Installment[] (array de parcelas individuais)
- paidInstallments: number (contador de parcelas pagas)
- partialPaidAmount: number (valor parcialmente pago)
- overdue: boolean (se está atrasado)
- reminderDate?: string (data de lembrete)
- notes?: string (anotações)
- attachmentUrls?: string[] (URLs de anexos)
```

#### Novas Interfaces
- `CashFlowReport`: Relatório mensal de fluxo de caixa
- `OverdueAnalysis`: Análise detalhada de atrasados
- `FutureFlowForecast`: Previsão de fluxo futuro

### Context API Expandido (`src/context/CaixaContext.tsx`)

#### Novas Funções (27+)

**Gerenciamento de Transações:**
- `addTransaction(date, recurrence, priority, ...)`
- `editTransaction(id, date, recurrence, priority, ...)`
- `deleteTransaction(id)`

**Marcação de Pagamentos:**
- `markMovementAsPaid(id, paidDate)`
- `markInstallmentAsPaid(movementId, installmentNumber, paidDate)`
- `markInstallmentAsPartiallyPaid(movementId, installmentNumber, amount)`
- `payPartialMovement(id, amount, paidDate)`

**Filtros e Consultas:**
- `getMovementsByStatus(status)`
- `getMovementsByPriority(priority)`
- `getMovementsByCategory(category)`
- `getMovementsByDateRange(startDate, endDate)`
- `getOverdueMovements()`

**Relatórios:**
- `getCashFlowReport(monthYear?)`
- `getOverdueAnalysis()`
- `getFutureFlowForecast(days)`
- `getInstallmentProgressByMovement(movementId)`
- `getNextDueInstallments(days)`

**Gerenciamento:**
- `addReminder(movementId, reminderDate)`
- `removeReminder(movementId)`
- `getDueReminders()`
- `addNotes(movementId, notes)`
- `searchMovements(term)`
- `getMovementsNearDueDate(days)`
- `getRecurringTransactions()`

### Utilitários Expandidos (`src/utils/calculations.ts`)

#### 15+ Novas Funções
- `calculateInstallmentProgress(movement)` - % de conclusão
- `getDaysUntilDue(dueDate)` - dias até vencimento
- `isOverdue(movement)` - verificar atraso
- `getDaysPastDue(overdueDate)` - dias vencidos
- `getPaymentStatus(movement)` - determinar status
- `calculateCashFlowForecast(movements, days)` - projetar 30 dias
- `getMovementByPriority(movements, priority)` - filtrar
- `getMovementSummaryByCategory(movements)` - agrupar por categoria
- `getInstallmentCompletionInfo(movement)` - info completa
- `calculateTotalOverdue(movements)` - somar atrasados
- `getOverdueBreakdown(movements)` - detalhar por categoria
- `getProjectedCashFlow(movements, days)` - projeção 90 dias
- `getStatusLabel(status)` - formatar status
- `getPriorityLabel(priority)` - formatar prioridade

### Componentes Atualizados

#### `MovementForm.tsx` (Totalmente Refatorado)
- Adiciona campo de data customizada
- Adiciona seletor de prioridade (Alta/Média/Baixa)
- Adiciona campo de anotações (opcional)
- Suporta 2-48 parcelas com data da primeira parcela
- Nova assinatura de `addMovement()` com todos os parâmetros

#### `MovementHistory.tsx` (Corrigido)
- Acesso correto a array de `Installment`
- Calcula corretamente progresso de parcelas
- Exibe (pago/total) para cada item

#### `Dashboard.tsx` (Expandido)
- Nova seção `paymentStatusGrid` com 4 cards
- Cores e ícones específicos para cada status
- Informações em tempo real

#### `AdvancedReports.tsx` (Nova Página)
- 4 abas de relatórios
- Gráficos com Recharts
- Tabelas interativas
- Responsivo para mobile

## 📊 Casos de Uso

### 1. **Gerenciar Dívidas com Parcelas**
```
"Compra no fornecedor em 12x"
→ Adicionar movimentação com 12 parcelas
→ Visualizar data de cada vencimento
→ Marcar como paga quando quitar
→ Ver progresso (7/12 parcelas pagas)
```

### 2. **Acompanhar Recebimentos Parcelados**
```
"Venda de mercadoria em 6x"
→ Registrar entrada parcelada
→ Priorizar se está atrasado
→ Marcar parcela como recebida
→ Anotação: "Cliente pagou com cheque"
```

### 3. **Analisar Saúde Financeira**
```
→ Ver Dashboard com status geral
→ Clicar em "Relatórios Avançados"
→ Verificar "Análise de Atrasados" (💰 total vencido?)
→ Consultar "Previsão 30 dias" (saldo esperado?)
→ Acompanhar "Próximos Vencimentos" (o que vence?)
```

### 4. **Registrar Evento Passado**
```
"Pagamento do mês passado que esqueci de registrar"
→ Abrir MovementForm
→ Mudar data para mês passado
→ Definir prioridade
→ Adicionar nota: "Retroativo - janeiro"
```

## 🎨 Interface

### Novo Menu Lateral
- 📊 Dashboard (existente)
- 💵 Transações (existente)
- 💳 Movimentações (existente)
- 📈 **Relatórios Avançados** (NOVO)

### Cores Padrão
- 🔴 Atrasado: #c0392b (vermelho)
- 🟡 Pendente: #e67e22 (laranja)
- 🟢 Receber/Disponível: #27ae60 (verde)
- 🔵 A Pagar: #e74c3c (vermelho claro)

## 📦 Dependências

Nenhuma dependência nova adicionada. Projeto continua usando:
- React 19.2 + TypeScript 5.9
- Vite 7.2.2
- Recharts 3.4 (para gráficos)
- Context API (state management)
- localStorage (persistência)

## 🚀 Como Usar as Novas Funções

### Exemplo 1: Registrar Entrada Parcelada
```typescript
const { addMovement } = useCaixa();

addMovement(
  'entrada',           // type
  'pix',              // movementType
  3000,               // amount (total)
  'Venda',            // category
  'Venda de produto', // description
  'nenhum',           // classification
  '2024-01-15',       // movementDate (data customizada!)
  'alta',             // priority (NOVO!)
  6,                  // totalInstallments (6 parcelas)
  '2024-02-01',       // firstInstallmentDate (primeira em 01/02)
  'Cliente X'         // notes (NOVO!)
);
```

### Exemplo 2: Marcar Parcela como Paga
```typescript
const { markInstallmentAsPaid } = useCaixa();

markInstallmentAsPaid(
  'mov-id-123',  // movementId
  3,             // installmentNumber (parcela 3)
  '2024-02-28'   // paidDate (com data customizada!)
);
```

### Exemplo 3: Analisar Atrasados
```typescript
const { getOverdueAnalysis } = useCaixa();

const analysis = getOverdueAnalysis();
// {
//   totalOverdueAmount: 5500,
//   numberOfOverdueItems: 4,
//   oldestOverdueDate: '2024-01-10',
//   overdueItems: [...]
// }
```

### Exemplo 4: Previsão 30 Dias
```typescript
const { getFutureFlowForecast } = useCaixa();

const forecast = getFutureFlowForecast(30);
// Array com 30 dias de previsão
// {
//   date: '2024-02-01',
//   expectedIncome: 5000,
//   expectedExpense: 2000,
//   criticalDates: [...]
// }
```

## 🎯 Próximas Melhorias Sugeridas

1. **Transações Recorrentes**
   - Campo para definir frequência (diária, semanal, mensal, anual)
   - Auto-geração de transações baseadas em recorrência

2. **Modal de Edição de Parcelas**
   - Permitir editar data/valor de parcelas individuais
   - Interface melhor para marcar como paga

3. **Alertas e Notificações**
   - Alerta para itens vencendo hoje
   - Notificação para atrasados críticos

4. **Exportação de Relatórios**
   - PDF com análises
   - CSV para análise em Excel

5. **Integração com Banco**
   - Importar movimentações do banco automaticamente
   - Reconciliação automática

6. **Metas e Orçamentos**
   - Definir metas por categoria
   - Alertar quando ultrapassar

## 📋 Checklist de Funcionalidades

✅ Marcar parcelas individuais como pagas
✅ Data manual para todas as transações
✅ Sistema de priorização (alta/média/baixa)
✅ Visualizar quando parcelas serão concluídas
✅ Visualizar quando receberá parcelados
✅ Dashboard com status de pagamento
✅ Relatórios avançados com 4 abas
✅ Análise de atrasados por categoria/prioridade
✅ Previsão de fluxo de caixa 30 dias
✅ Acompanhamento de progresso de parcelas
✅ Próximos vencimentos em destaque
✅ Anotações em movimentações

## 📞 Suporte

Todas as funcionalidades foram testadas e compiladas com sucesso.
Build: ✅ SEM ERROS
Prod: ✅ PRONTO PARA DEPLOY

---

**Sistema de Controle de Caixa v2.0.0**
*Melhorando a gestão financeira comercial*
