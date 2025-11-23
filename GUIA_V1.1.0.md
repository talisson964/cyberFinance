# 📋 Guia Completo v1.1.0 - Sistema de Movimentações

## 🎯 O que é novo na v1.1.0?

A versão 1.1.0 adiciona um **sistema robusto de movimentações** ao seu controle de caixa. Isso permite rastrear diferentes tipos de pagamentos, classificar despesas como fixas ou temporárias, e gerenciar parcelas com confirmação de pagamento.

---

## 📱 Tipos de Movimentação

A v1.1.0 oferece **6 tipos de movimentação** para cada transação:

| Tipo | Emoji | Descrição |
|------|-------|-----------|
| **Pix** | 📱 | Transferências instantâneas |
| **Crédito à Vista** | 💳 | Pagamentos com cartão crédito na data |
| **Parcelado** | 📅 | Compras parceladas (2-48 vezes) |
| **Dinheiro** | 💵 | Pagamentos em espécie |
| **Transferência** | 🔄 | Transferências bancárias |
| **Boleto** | 📋 | Pagamentos de boleto |

---

## 💰 Classificação de Despesas

Cada movimentação de **saída** pode ser classificada como:

| Classificação | Emoji | Descrição |
|---------------|-------|-----------|
| **Fixo** | 🔄 | Despesas recorrentes (aluguel, salário, etc) |
| **Temporário** | ⏱️ | Despesas pontuais (consertos, compras) |
| **Nenhum** | — | Sem classificação |

**Nota:** Movimentações de entrada não precisam de classificação.

---

## 🔧 Como Usar - Passo a Passo

### 1️⃣ Acessar a Página de Movimentações

1. Abra a aplicação em `http://localhost:5173/`
2. Clique no menu lateral em **💳 Movimentações**
3. Você verá:
   - **Formulário de Movimentação** (acima)
   - **Histórico de Movimentações** (abaixo)

---

### 2️⃣ Registrar uma Movimentação Simples

**Exemplo: Venda por Pix (R$ 500)**

1. Preencha o formulário:
   ```
   Tipo de Transação:  Entrada
   Tipo de Movimentação: 📱 Pix
   Valor: 500.00
   Categoria: Venda
   Descrição: Venda de produto
   Data: (hoje)
   ```

2. Clique em **Registrar Movimentação**
3. A movimentação aparecerá no histórico com status ✅ **PAGA**

---

### 3️⃣ Registrar Compra Parcelada

**Exemplo: Compra de equipamento em 12 parcelas (R$ 3.000)**

1. Preencha o formulário:
   ```
   Tipo de Transação: Saída
   Tipo de Movimentação: 📅 Parcelado
   Valor Total: 3000.00
   Classificação: ⏱️ Temporário
   Categoria: Compra
   Descrição: Equipamento para loja
   Data: (hoje)
   ```

2. Um campo "Parcelas" aparecerá:
   ```
   Número Total de Parcelas: 12
   Data da 1ª Parcela: 2025-12-01
   ```

3. Clique em **Registrar Movimentação**
4. No histórico, verá: `1/12` na descrição

---

### 4️⃣ Marcar Parcela Como Paga

**Quando você paga uma parcela:**

1. Localize a movimentação no **Histórico de Movimentações**
2. Clique no botão verde **✅ Marcar como Pago**
3. A movimentação muda:
   - Borda de **amarelo** (pendente) para **verde** (pago)
   - Número de parcela incrementa: `1/12` → `2/12`

---

## 📊 Dashboard v1.1.0

O dashboard agora mostra informações mais detalhadas:

### Cards de Resumo
- **💰 Entrada Total** - Sum de todas as entradas
- **💸 Saída Total** - Sum de todas as saídas
- **💹 Líquido** - Diferença entre entrada e saída
- **📈 Lucro** - Cálculo financeiro final

### Cards de Classificação (NOVO)
- **🔄 Gasto Fixo** - Total de despesas fixas (não pago ainda)
- **⏱️ Gasto Temporário** - Total de despesas temporárias (não pago ainda)
- **⏳ Pendências** - Entradas a Receber + Saídas a Pagar

### Gráficos
1. **Entrada vs Saída** - Barras por mês
2. **Evolução do Líquido** - Linha ao longo do tempo
3. **Distribuição por Categorias** - Pizza (transações)
4. **Fixo vs Temporário** - Pizza (novo v1.1.0)

---

## 🔍 Histórico com Filtros

### Status de Filtro
- **Todas** - Mostra pendentes e pagas
- **Pendentes** - Apenas não pagas
- **Pagas** - Apenas pagas

### Tipo de Filtro
- **Todas** - Entradas e Saídas
- **Entrada** - Apenas entradas
- **Saída** - Apenas saídas

### Indicadores Visuais
- 🟨 **Borda Amarela** = Pendente de pagamento
- 🟩 **Borda Verde** = Já foi pago
- **Parcelas** = `(1/12)` no final da descrição

---

## 💾 Dados e Persistência

### Onde os Dados são Guardados?

A v1.1.0 usa **2 chaves diferentes** no localStorage:

- `caixa_transactions` - Transações antigas (v1.0.0)
- `caixa_movements` - Movimentações novas (v1.1.0)

Isso significa:
✅ Dados v1.0.0 continuam funcionando
✅ Novo sistema é completamente separado
✅ Você pode ter ambos em paralelo

### Como Acessar os Dados?

**No console do navegador (F12):**

```javascript
// Ver movimentações
const movimentos = JSON.parse(localStorage.getItem('caixa_movements') || '[]');
console.log(movimentos);

// Exportar como JSON
copy(movimentos);
```

---

## 📈 Exemplos Práticos

### Exemplo 1: Despesa Fixa Recorrente

**Aluguel de R$ 2.000 no crédito:**

```
Tipo de Transação: Saída
Tipo de Movimentação: 💳 Crédito à Vista
Valor: 2000.00
Classificação: 🔄 Fixo
Categoria: Aluguel
Descrição: Aluguel loja - novembro
Data: 2025-11-01
```

No dashboard:
- Aumenta o **Gasto Fixo**
- Depois de marcar pago: status muda para verde
- Ainda será contado nos gastos fixos totais

---

### Exemplo 2: Venda em Installments (Crediário)

**Venda de R$ 800 em 4 parcelas (entrada):**

```
Tipo de Transação: Entrada
Tipo de Movimentação: 📅 Parcelado
Valor Total: 800.00
Categoria: Venda
Descrição: Venda a prazo - Cliente XYZ
Data: 2025-11-01

Parcelas:
- Total: 4
- Primeira: 2025-12-01
```

Você receberá:
- Parte 1: R$ 200 em 2025-12-01
- Parte 2: R$ 200 em 2026-01-01
- E assim por diante...

---

### Exemplo 3: Compra com Múltiplas Parcelas

**Equipamento de R$ 6.000 em 24 parcelas:**

```
Tipo de Transação: Saída
Tipo de Movimentação: 💳 Crédito à Vista
Valor: 6000.00
Classificação: ⏱️ Temporário
Categoria: Compra
Descrição: Equipamento de produção
Data: 2025-11-17

Parcelas:
- Total: 24
- Primeira: 2025-12-17
```

Cada parcela = R$ 250
Rastreie o progresso: `1/24`, `2/24`, ... `24/24`

---

## 🐛 Troubleshooting

### Problema: Não vejo o botão de Movimentações

**Solução:**
1. Recarregue a página (Ctrl+F5)
2. Limpe o cache (DevTools → Application → Clear Storage)
3. Reinicie o servidor (`npm run dev`)

---

### Problema: Parcelas não aparecem

**Verifique:**
1. Você selecionou **"Parcelado"** como tipo?
2. Preencheu o número de parcelas (2-48)?
3. Selecionou uma data válida?

---

### Problema: Os dados sumiram após reload

**Verifique:**
1. Abra DevTools (F12)
2. Vá para **Application → LocalStorage**
3. Procure por `caixa_movements` ou `caixa_transactions`
4. Se não existir, os dados foram perdidos (recarregue com dados de teste)

---

## 🎓 Conceitos-Chave

### Movimentação vs Transação

- **Transação** (v1.0.0): Simples entrada ou saída
- **Movimentação** (v1.1.0): Transação com tipo, classificação e rastreamento de parcelas

### Fixo vs Temporário

- **Fixo**: Despesa que se repete (aluguel, salário)
- **Temporário**: Despesa pontual (compra, conserto)
- **Nenhum**: Não classificado (padrão)

### Status de Pagamento

- **Pendente** (🟨): Ainda não foi marcado como pago
- **Pago** (🟩): Já foi confirmado o pagamento
- **Parcelas**: `(X/Y)` indica progresso

---

## 📚 Arquivos Relacionados

- `src/types/index.ts` - Definição de tipos
- `src/context/CaixaContext.tsx` - Lógica de estado
- `src/components/MovementForm.tsx` - Formulário
- `src/components/MovementHistory.tsx` - Histórico
- `src/utils/calculations.ts` - Cálculos financeiros

---

## ✨ Próximas Melhorias Planejadas

- [ ] Editar movimentações existentes
- [ ] Duplicar despesas fixas para próximos meses
- [ ] Exportar relatório em PDF
- [ ] Integração com banco (API)
- [ ] Notificações de parcelas vencendo
- [ ] Gráficos de fluxo de caixa projetado

---

## 🚀 Conclusão

A v1.1.0 transforma o sistema de simples controle de caixa para um **gestor de fluxo de caixa profissional**. Com suporte a movimentações, classificação de despesas e rastreamento de parcelas, você tem visibilidade total sobre suas finanças!

**Aproveite! 🎉**
