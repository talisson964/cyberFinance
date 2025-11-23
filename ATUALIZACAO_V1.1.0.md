# 📋 Atualização v1.1.0 - Sistema de Movimentações e Parcelas

## ✨ O que foi adicionado

### 🎯 Tipos de Movimentação
Agora você pode especificar **como** o dinheiro entrou ou saiu:

- **📱 Pix** - Transferências instantâneas
- **💳 Crédito à Vista** - Pagamento à vista com cartão
- **📅 Parcelado** - Pagamento em múltiplas parcelas
- **💵 Dinheiro** - Pagamento em espécie
- **🏦 Transferência** - Transferência bancária
- **📄 Boleto** - Pagamento via boleto

### 💰 Classificação de Gastos (Saídas)

Para saídas, você pode marcar como:
- **🔄 Gasto Fixo** - Despesas recorrentes (aluguel, salário, assinatura)
- **⏱️ Gasto Temporário** - Despesas ocasionais
- **Nenhum** - Sem classificação

### 📊 Parcelamento

Para movimentações parceladas, você pode:
- Definir o total de parcelas (2-48 parcelas)
- Registrar a data da primeira parcela
- Rastrear automaticamente o progresso do parcelamento

### 📖 Histórico de Movimentações

Nova página completa com:
- **Tabela detalhada** de todas as movimentações
- **Filtros avançados**:
  - Status: Todos, Pendentes, Pagos
  - Tipo: Todos, Entradas, Saídas
- **Marcação de pagamento** - Confirme quando uma movimentação foi paga
- **Resumo de pendências** - Veja quanto você tem a receber/pagar

### 📈 Dashboard Atualizado

Novos elementos no dashboard:
- **Card de Gasto Fixo** (🔄) - Total de despesas recorrentes
- **Card de Gasto Temporário** (⏱️) - Total de despesas ocasionais
- **Card de Pendências** (⏳) - Saldo de movimentações não confirmadas
- **Gráfico: Gasto Fixo vs Temporário** - Visualização em pizza
- **Cálculos detalhados** que incluem movimentações

## 🏗️ Arquitetura

### Novos Componentes
- `MovementForm.tsx` - Formulário para registrar movimentações
- `MovementHistory.tsx` - Histórico com filtros e ações
- `MovementsPage.tsx` - Página dedicada

### Atualizado
- `Dashboard.tsx` - Agora inclui dados de movimentações
- `CaixaContext.tsx` - Novo sistema de movimentações separado
- `calculations.ts` - Funções para cálculo com movimentações

### Novo Banco de Dados
- `movements` - Dados armazenados em LocalStorage
- Separado de `transactions` para melhor organização

## 🚀 Como Usar

### Registrar uma Movimentação

1. Vá para **Movimentações** no menu
2. Preencha o formulário:
   - Tipo (Entrada/Saída)
   - Tipo de Movimentação (Pix, Crédito, etc)
   - Classificação (apenas para saída)
   - Valor
   - Categoria
   - Descrição

### Parcelamento

1. Escolha "Parcelado" como tipo
2. Marque "Registrar como parcelado"
3. Defina:
   - Total de parcelas
   - Data da primeira parcela
4. O sistema rastreará automaticamente

### Marcar Como Pago

1. Na aba "Pendentes" do histórico
2. Clique no ícone ✅ para confirmar pagamento
3. A movimentação será marcada como paga
4. Contribuirá automaticamente para o cálculo do dashboard

## 📊 Exemplos de Uso

### Exemplo 1: Venda Parcelada
```
Tipo: Entrada
Movimentação: Parcelado
Valor: R$ 3.000,00
Parcelas: 3x
Data: 20/11/2025
Descrição: Venda do projeto X
```

### Exemplo 2: Aluguel Mensal
```
Tipo: Saída
Movimentação: Transferência
Classificação: Gasto Fixo
Valor: R$ 2.500,00
Categoria: Aluguel
Descrição: Aluguel dezembro
```

### Exemplo 3: Compra Não Recorrente
```
Tipo: Saída
Movimentação: Pix
Classificação: Gasto Temporário
Valor: R$ 1.200,00
Categoria: Compra
Descrição: Compra de equipamento
```

## 💡 Diferenças: Transações vs Movimentações

### Transações (Legacy)
- Sistema simples de entrada/saída
- Imediatas
- Sem tipos específicos
- Mantido para compatibilidade

### Movimentações (Novo)
- Sistema completo e flexível
- Suporta parcelamento
- Tipos de pagamento específicos
- Classificação de gasto
- Status de confirmação
- **Recomendado usar este sistema**

## 📈 Dashboard: O Que Mudou

Antes:
- Total Entrada, Total Saída, Líquido, Lucro

Agora:
- Total Entrada, Total Saída, Líquido, Lucro
- **Gasto Fixo** (separado)
- **Gasto Temporário** (separado)
- **Pendências** (não confirmadas)
- Gráfico de Fixo vs Temporário
- Cálculos incluem movimentações

## 🔄 Fluxo de Dados

```
Movimentação Criada
        ↓
Armazenada no LocalStorage
        ↓
Aparece em "Pendentes" até marcação
        ↓
Marca como Pago
        ↓
Contribui para cálculos do Dashboard
        ↓
Aparece em histórico de "Pagos"
```

## 🎯 Benefícios

✅ Rastreamento completo de receitas/despesas  
✅ Visualização de gastos fixos vs variáveis  
✅ Previsão de caixa com pendências  
✅ Histórico detalhado de pagamentos  
✅ Suporte para parcelamento  
✅ Múltiplos tipos de pagamento  
✅ Status de confirmação de pagamento  

## 🔐 Dados Persistidos

Tudo é salvo automaticamente em LocalStorage:
- `caixa_transactions` - Transações antigas
- `caixa_movements` - Novos movimentos
- Sincroniza em tempo real

## 📱 Responsividade

Totalmente responsivo:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

Filtros se adaptam em telas menores.

## 🐛 Troubleshooting

**Pendências não aparecem:**
- Marque como "não pago" ao criar
- Verifique o filtro de status

**Parcelamento não funciona:**
- Escolha "Parcelado" como tipo
- Marque o checkbox "Registrar como parcelado"

**Valores não aparecem no Dashboard:**
- As movimentações precisam estar marcadas como "Pago"
- Marque com o ícone ✅

## 📝 Notas Importantes

- ⚠️ Transações antigas continuam funcionando
- ✅ Use Movimentações para novo sistema
- 💾 Dados são separados por tipo
- 🔄 Dashboard calcula ambos os sistemas

## 🚀 Próximas Melhorias

- [ ] Editarparcelas existentes
- [ ] Duplicação automática de gastos fixos
- [ ] Alertas de vencimento
- [ ] Exportar relatório de pendências
- [ ] Integração com calendário

---

**Versão**: 1.1.0  
**Data**: 2025-11-17  
**Status**: ✅ Completo e Testado
