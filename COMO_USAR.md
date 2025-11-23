// 📌 INSTRUÇÕES DE USO DO SISTEMA DE CAIXA

// ============================================================================
// 1️⃣ INICIANDO A APLICAÇÃO
// ============================================================================

// Terminal:
// cd c:\Users\Crmv\Desktop\sistema-caixa
// npm run dev

// Depois acesse: http://localhost:5173/


// ============================================================================
// 2️⃣ NAVEGAÇÃO
// ============================================================================

// 📊 DASHBOARD
// - Mostra resumo financeiro completo
// - Cards com totais de entrada, saída, líquido e lucro
// - Gráficos de tendência mensal
// - Identifica mês com maior entrada e saída

// 💰 TRANSAÇÕES
// - Formulário para registrar nova transação
// - Histórico completo com opções de editar/deletar
// - Filtros por tipo (Todas, Entradas, Saídas)


// ============================================================================
// 3️⃣ TIPOS DE CATEGORIAS
// ============================================================================

// ENTRADAS (💰)
// - Venda
// - Serviço
// - Devolução
// - Outro

// SAÍDAS (💸)
// - Compra
// - Fornecedor
// - Aluguel
// - Salário
// - Transporte
// - Outro


// ============================================================================
// 4️⃣ EXEMPLO DE TRANSAÇÕES PARA TESTAR
// ============================================================================

// ENTRADAS:
// ✓ 1.500,00 - Venda - Venda de produtos XYZ
// ✓ 800,00 - Serviço - Consultoria de negócios
// ✓ 200,00 - Devolução - Devolução de cliente
// ✓ 450,00 - Venda - Venda de acessórios

// SAÍDAS:
// ✓ 600,00 - Compra - Compra de estoque mensal
// ✓ 250,00 - Fornecedor - Pagamento fornecedor A
// ✓ 1.200,00 - Aluguel - Aluguel do estabelecimento
// ✓ 1.500,00 - Salário - Pagamento funcionário
// ✓ 150,00 - Transporte - Entrega de produtos


// ============================================================================
// 5️⃣ FUNCIONALIDADES
// ============================================================================

// ✅ ADICIONAR TRANSAÇÃO
// 1. Clique em "Transações"
// 2. Escolha Entrada ou Saída
// 3. Digite o valor (ex: 1500.50)
// 4. Selecione categoria
// 5. Adicione descrição detalhada
// 6. Clique "Registrar Transação"

// ✅ EDITAR TRANSAÇÃO
// 1. Encontre a transação na tabela
// 2. Clique no ícone ✏️ (editar)
// 3. Modifique os campos
// 4. Clique ✓ para salvar

// ✅ DELETAR TRANSAÇÃO
// 1. Encontre a transação na tabela
// 2. Clique no ícone 🗑️ (deletar)
// 3. Transação é removida imediatamente

// ✅ FILTRAR TRANSAÇÕES
// Clique em um dos botões no topo:
// - "Todas" - Mostra tudo
// - "Entradas" - Apenas entradas
// - "Saídas" - Apenas saídas


// ============================================================================
// 6️⃣ DASHBOARD - O QUE VOCÊ VÊ
// ============================================================================

// 4 CARDS PRINCIPAIS:
// 💰 Entrada Total - Soma de todas as entradas
// 💸 Saída Total - Soma de todas as saídas
// 💹 Líquido - Entrada Total - Saída Total
// 📈 Lucro - Igual ao Líquido

// 2 CARDS INFORMATIVOS:
// 🏆 Mês com Maior Entrada - Qual mês teve mais dinheiro entrando
// ⚠️ Mês com Maior Saída - Qual mês teve mais gastos

// 3 GRÁFICOS:
// 📊 Entradas vs Saídas por Mês - Gráfico de barras
// 📈 Evolução do Líquido - Gráfico de linha
// 🎯 Distribuição por Categorias - Gráfico de pizza


// ============================================================================
// 7️⃣ ARMAZENAMENTO DE DADOS
// ============================================================================

// Todos os dados são salvos automaticamente no LocalStorage do navegador
// Isso significa que:
// ✓ Os dados persistem se você fechar a aba/navegador
// ✓ Os dados são apenas deste dispositivo
// ✓ Não é necessário login
// ✓ Para limpar dados: Abra DevTools (F12) > Application > LocalStorage


// ============================================================================
// 8️⃣ DICAS E TRUQUES
// ============================================================================

// 💡 Use descrições detalhadas para melhor rastreamento
// 💡 Organise as categorias conforme sua necessidade comercial
// 💡 Verifique o Dashboard regularmente para monitorar tendências
// 💡 Os gráficos mostram dados de todos os meses registrados
// 💡 Em mobile, use o menu hambúrguer (☰) para acessar navegação


// ============================================================================
// 9️⃣ BOAS PRÁTICAS
// ============================================================================

// ✅ Registre transações no mesmo dia que ocorrem
// ✅ Use categorias consistentes para melhor análise
// ✅ Revise o histórico regularmente
// ✅ Faça backup dos dados periodicamente (copie o LocalStorage)
// ✅ Use o filtro para análises específicas


// ============================================================================
// 🔟 TECLAS DE ATALHO (Futura Implementação)
// ============================================================================

// Sugestões para melhorias:
// Ctrl+N - Nova transação
// Ctrl+D - Ir para Dashboard
// Ctrl+L - Limpar filtros
// / - Buscar transação


// ============================================================================
// SUPORTE E ERROS COMUNS
// ============================================================================

// ❌ "Dados não aparecem após recarregar"
// ✓ Verifique se o LocalStorage está habilitado
// ✓ Limpe cache do navegador
// ✓ Tente em outro navegador

// ❌ "Gráficos em branco"
// ✓ Certifique-se de ter adicionado pelo menos 2 transações
// ✓ Gráfico de linha precisa de dados de meses diferentes

// ❌ "Aplicação lenta"
// ✓ Se tiver muitas transações (1000+), considere exportar dados antigos
// ✓ Limpe o cache e feche outras abas


// ============================================================================
// FIM DO GUIA
// ============================================================================
// Aproveite o sistema! 🚀
