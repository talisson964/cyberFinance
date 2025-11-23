# 💼 Sistema de Controle de Caixa Comercial

**Versão:** 1.1.0 | **Status:** ✅ Pronto para Produção

Um sistema completo e moderno para gerenciar entradas e saídas de dinheiro, com suporte a múltiplos tipos de movimentação, classificação de despesas (fixo/temporário), rastreamento de parcelas e dashboard interativo.

---

## 🎯 Funcionalidades

### v1.0.0 - Base
- ✅ Registro de entradas e saídas manuais
- ✅ 4 categorias de entrada + 6 de saída
- ✅ Dashboard com 4 métricas principais
- ✅ 3 gráficos interativos (barras, linha, pizza)
- ✅ Edição e exclusão de transações
- ✅ Histórico com filtros
- ✅ Responsividade completa (mobile/tablet/desktop)

### v1.1.0 - Movimentações (NOVO!)
- ✨ 6 tipos de movimentação: Pix, Crédito, Parcelado, Dinheiro, Transferência, Boleto
- ✨ Classificação de despesas: Fixo (🔄), Temporário (⏱️), Nenhum
- ✨ Rastreamento de parcelas (2-48 parcelas por movimento)
- ✨ Histórico de movimentações com filtros avançados
- ✨ Marcação de pagamentos realizados
- ✨ Dashboard aprimorado com cards de classificação
- ✨ Gráfico adicional: Fixo vs Temporário
- ✨ Cálculos de pendências (a receber/pagar)
- ✨ Nova página dedicada: /movimentacoes

---

## 🚀 Quick Start

### 1. Clonar/Abrir o Projeto
```bash
cd c:\Users\Crmv\Desktop\sistema-caixa
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Iniciar Desenvolvimento
```bash
npm run dev
```

Acesse: **http://localhost:5173/**

### 4. Build para Produção
```bash
npm run build
```

---

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Dashboard.tsx                 # Painel de controle
│   ├── TransactionForm.tsx          # Formulário v1.0.0
│   ├── TransactionList.tsx          # Histórico v1.0.0
│   ├── MovementForm.tsx             # Formulário v1.1.0
│   ├── MovementHistory.tsx          # Histórico v1.1.0
│   └── *.module.css                 # Estilos encapsulados
├── pages/               # Páginas/Rotas
│   ├── DashboardPage.tsx
│   ├── TransactionsPage.tsx
│   └── MovementsPage.tsx
├── context/             # Estado Global (Context API)
│   └── CaixaContext.tsx
├── types/               # Interfaces TypeScript
│   └── index.ts
├── utils/               # Funções utilitárias
│   └── calculations.ts
├── App.tsx              # Componente raiz + Routing
└── main.tsx             # Entry point
```

---

## 💻 Stack Tecnológico

| Layer | Tecnologia | Versão |
|-------|-----------|--------|
| **Renderização** | React | 19.2 |
| **Tipagem** | TypeScript | 5.9 |
| **Build** | Vite | 7.2.2 |
| **Routing** | React Router DOM | 7.9 |
| **Gráficos** | Recharts | 3.4 |
| **Ícones** | React Icons | 5.5 |
| **Estado** | Context API | — |
| **Dados** | LocalStorage | — |
| **Estilo** | CSS Modules | — |
| **Linting** | ESLint | 9.39 |

---

## 📊 Dashboard

O dashboard mostra:

### Métricas Principais (4 cards)
- 💰 **Entrada Total** - Sum de todas as entradas
- 💸 **Saída Total** - Sum de todas as saídas
- 💹 **Líquido** - Entrada - Saída
- 📈 **Lucro** - Cálculo financeiro final

### Classificação de Despesas (3 cards - v1.1.0)
- 🔄 **Gasto Fixo** - Total de despesas fixas pendentes
- ⏱️ **Gasto Temporário** - Total de despesas temporárias pendentes
- ⏳ **Pendências** - Entradas a receber + Saídas a pagar

### Gráficos (4 visualizações)
1. **Entrada vs Saída** - Barras por mês
2. **Evolução do Líquido** - Linha temporal
3. **Distribuição por Categorias** - Pizza (transações)
4. **Fixo vs Temporário** - Pizza (v1.1.0)

---

## 🎮 Como Usar

### Registrar uma Transação (v1.0.0)

1. Acesse **Transações** no menu lateral
2. Preencha:
   - Tipo (Entrada/Saída)
   - Valor
   - Categoria
   - Descrição
   - Data
3. Clique em **Adicionar**

### Registrar uma Movimentação (v1.1.0)

1. Acesse **Movimentações** no menu lateral
2. Preencha:
   - Tipo de Transação (Entrada/Saída)
   - Tipo de Movimentação (Pix, Crédito, etc)
   - Valor
   - Classificação (Fixo/Temporário - apenas saídas)
   - Categoria
   - Descrição
3. Se escolher "Parcelado":
   - Número de parcelas (2-48)
   - Data da primeira parcela
4. Clique em **Registrar Movimentação**
5. No histórico, marque como pago clicando em **✅**

---

## 📱 Tipos de Movimentação (v1.1.0)

| Tipo | Emoji | Uso |
|------|-------|-----|
| Pix | 📱 | Transferências instantâneas |
| Crédito | 💳 | Pagamento com cartão na data |
| Parcelado | 📅 | Compras parceladas (com rastreamento) |
| Dinheiro | 💵 | Pagamento em espécie |
| Transferência | 🔄 | Transferências bancárias |
| Boleto | 📋 | Pagamentos de boleto |

---

## 🏷️ Classificação de Despesas (v1.1.0)

Apenas para **saídas**:

| Classificação | Emoji | Descrição |
|---------------|-------|-----------|
| Fixo | 🔄 | Recorrente (aluguel, salário, etc) |
| Temporário | ⏱️ | Pontual (compra, conserto, etc) |
| Nenhum | — | Sem classificação |

---

## 💾 Persistência de Dados

Os dados são salvos automaticamente no **LocalStorage** do navegador:

- `caixa_transactions` - Transações v1.0.0
- `caixa_movements` - Movimentações v1.1.0

**Isso significa:**
- ✅ Sem necessidade de backend
- ✅ Dados persistem entre sessões
- ✅ Funciona offline
- ⚠️ Limpar cache do navegador = perder dados

---

## 📈 Estatísticas

- **Linhas de Código:** ~1500+
- **Componentes:** 5 principais
- **Páginas:** 3
- **Gráficos:** 4
- **Tipos de Movimentação:** 6
- **Build Time:** 8.72s
- **Dev Server Startup:** 558ms

---

## 🎨 Responsividade

O sistema se adapta perfeitamente em:

- 📱 **Mobile** - < 768px (menu hambúrguer)
- 📱 **Tablet** - 768px a 1024px (layout adaptado)
- 🖥️ **Desktop** - 1920px+ (layout completo)

---

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev       # Iniciar servidor de desenvolvimento
npm run build     # Build para produção
npm run preview   # Preview do build
npm run lint      # Executar ESLint
```

### Adicionar Nova Funcionalidade

1. Defina tipos em `src/types/index.ts`
2. Adicione lógica em `src/context/CaixaContext.tsx`
3. Crie componente em `src/components/`
4. Adicione rota em `src/App.tsx` (se necessário)
5. Teste com `npm run dev`

---

## 🐛 Troubleshooting

### Servidor não inicia?
```bash
# Limpe cache e reinstale
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Dados sumiram?
1. Abra DevTools (F12)
2. Application → LocalStorage
3. Procure por `caixa_movements` ou `caixa_transactions`

### TypeScript com erros?
```bash
npm run build  # Verifica erros de compilação
```

---

## 📚 Documentação

- **STATUS.txt** - Resumo técnico do projeto
- **GUIA_V1.1.0.md** - Guia completo das novas funcionalidades
- **ATUALIZACAO_V1.1.0.md** - Detalhes técnicos da v1.1.0
- **README_v1.1.0.md** - Este arquivo

---

## ✨ Destaques

✨ Interface moderna com gradiente roxo/azul  
✨ Gráficos interativos com Recharts  
✨ TypeScript 100% - Zero erros de compilação  
✨ Responsividade total  
✨ UX intuitiva com ícones significativos  
✨ Performance otimizada com Vite  
✨ Sem necessidade de backend  
✨ Documentação completa  

---

## 📄 Licença

Este projeto foi criado como exemplo educacional.

---

## 🎉 Próximas Melhorias

- [ ] Editar movimentações existentes
- [ ] Duplicar despesas fixas para próximos meses
- [ ] Exportar relatório em PDF
- [ ] Integração com API bancária
- [ ] Notificações de vencimentos
- [ ] Projeção de fluxo de caixa

---

## 💬 Suporte

Consulte a documentação completa em `GUIA_V1.1.0.md`

---

**Criado com ❤️ usando React + TypeScript + Vite**
