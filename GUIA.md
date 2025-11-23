# 💼 Sistema de Controle de Caixa Comercial

Um sistema completo e moderno para controle de entrada e saída de dinheiro em comercios, desenvolvido com React, TypeScript e Vite.

## 🎯 Funcionalidades Principais

### 📊 Dashboard
- **Resumo Financeiro**: Mostra total de entradas, saídas, líquido e lucro
- **Gráficos Inteligentes**: 
  - Gráfico de barras comparando entradas vs saídas por mês
  - Gráfico de linha mostrando evolução do líquido
  - Gráfico de pizza com distribuição por categorias
- **Análise de Meses**: Identifica o mês com maior entrada e maior saída
- **Atualização em Tempo Real**: Os dados são atualizados imediatamente conforme novas transações são registradas

### 💰 Controle de Transações
- **Registro Manual**: Adicione entradas e saídas facilmente
- **Categorização**: 
  - **Entradas**: Venda, Serviço, Devolução, Outro
  - **Saídas**: Compra, Fornecedor, Aluguel, Salário, Transporte, Outro
- **Descrições Detalhadas**: Adicione descrições para cada transação
- **Histórico Completo**: Visualize, edite ou delete transações
- **Filtros**: Filtre por tipo (Todas, Entradas, Saídas)

### 💾 Persistência de Dados
- Todos os dados são salvos automaticamente no LocalStorage
- Os dados persistem mesmo após fechar o navegador

## 🚀 Como Começar

### Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn

### Instalação

1. Navegue até a pasta do projeto:
```bash
cd c:\Users\Crmv\Desktop\sistema-caixa
```

2. Instale as dependências (se não instalou):
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra seu navegador em:
```
http://localhost:5173/
```

## 📦 Dependências Principais

- **React 19.2** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool rápido
- **React Router DOM** - Navegação
- **Recharts** - Gráficos interativos
- **React Icons** - Ícones

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── TransactionForm.tsx  # Formulário de transações
│   ├── TransactionList.tsx  # Lista de transações
│   └── *.module.css     # Estilos
├── pages/              # Páginas da aplicação
│   ├── DashboardPage.tsx
│   └── TransactionsPage.tsx
├── context/            # Estado global (Context API)
│   └── CaixaContext.tsx
├── types/              # Tipos TypeScript
│   └── index.ts
├── utils/              # Funções utilitárias
│   └── calculations.ts
├── App.tsx             # Componente principal
├── App.css             # Estilos globais
└── main.tsx           # Entry point
```

## 🎨 Design e UX

- **Interface Responsiva**: Funciona perfeitamente em desktop, tablet e mobile
- **Sidebar Navegável**: Menu lateral com links para Dashboard e Transações
- **Gradiente Moderno**: Design com cores gradiente roxo/azul
- **Cards e Gráficos**: Interface limpa e profissional
- **Ícones Intuitivos**: Emojis e ícones para melhor visualização

## 🔧 Scripts Disponíveis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Preview da build de produção
npm run preview

# Lint do código
npm run lint
```

## 💡 Como Usar

### Registrar uma Transação

1. Clique em "Transações" no menu lateral
2. Escolha o tipo (💰 Entrada ou 💸 Saída)
3. Preencha o valor em reais
4. Selecione a categoria apropriada
5. Adicione uma descrição
6. Clique em "Registrar Transação"

### Visualizar Dashboard

1. Clique em "Dashboard" no menu lateral
2. Veja o resumo de suas finanças com:
   - Totais de entrada e saída
   - Valor líquido
   - Gráficos de tendência
   - Meses com maior movimento

### Editar ou Deletar Transação

1. Na página de Transações, localize a transação na tabela
2. Clique no ícone ✏️ para editar ou 🗑️ para deletar
3. Se editando, faça as alterações e clique em ✓ para salvar

## 🧮 Cálculos

- **Líquido**: Entrada Total - Saída Total
- **Lucro**: Igual ao Líquido neste contexto
- **Resumos Mensais**: Agregação automática de dados por mês

## 📱 Responsividade

- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (< 768px)

A sidebar se torna um menu hambúrguer em dispositivos móveis para melhor experiência.

## 🔒 Segurança

Os dados são armazenados localmente no navegador. Para maior segurança em ambiente de produção, considere:
- Implementar backend com autenticação
- Usar HTTPS
- Criptografar dados sensíveis

## 🐛 Troubleshooting

### Dados não persistem
- Verifique se o LocalStorage está ativado no navegador
- Limpe o cache do navegador e tente novamente

### Gráficos não aparecem
- Aguarde o carregamento completo da página
- Certifique-se de ter adicionado pelo menos uma transação

### Erro de compilação
- Delete a pasta `node_modules` e a pasta `dist`
- Execute `npm install` novamente
- Reinicie o servidor com `npm run dev`

## 📈 Próximas Melhorias Sugeridas

- [ ] Exportar dados em CSV/PDF
- [ ] Importar dados de arquivo
- [ ] Autenticação de usuário
- [ ] Múltiplas contas/perfis
- [ ] Relatórios mais detalhados
- [ ] Previsões financeiras
- [ ] Integração com bancos

## 📄 Licença

Este projeto é de uso livre para fins educacionais e comerciais.

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ usando React, TypeScript e Vite

---

**Versão**: 1.0.0  
**Última Atualização**: 2025-11-17
