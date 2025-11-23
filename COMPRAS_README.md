# Sistema de Itens de Compra

## Visão Geral

Foi implementado um sistema completo para gerenciar compras com múltiplos itens. Quando uma saída é registrada na categoria **Fornecedores**, o sistema permite adicionar itens individuais de compra, que são somados automaticamente.

## Funcionalidades

### 1. Adicionar Itens de Compra
- Disponível apenas para **Saídas** na categoria **Fornecedores**
- Cada item contém:
  - Nome do produto
  - Quantidade
  - Preço unitário
  - Total (calculado automaticamente)

### 2. Cálculo Automático
- O valor total da movimentação é calculado automaticamente pela soma de todos os itens
- O campo de valor fica desabilitado quando há itens adicionados
- Atualização em tempo real conforme itens são adicionados/removidos

### 3. Visualização com Tooltip
- No histórico de movimentações, compras com itens mostram um ícone de sacola 🛍️
- Ao passar o mouse sobre o ícone, um tooltip elegante exibe:
  - Lista completa de itens
  - Quantidade e preço unitário de cada item
  - Total individual e total geral

## Componentes Criados

### PurchaseItemsManager
- **Localização**: `src/components/PurchaseItemsManager.tsx`
- **Função**: Gerenciar adição/remoção de itens de compra
- **Recursos**:
  - Formulário inline para adicionar itens
  - Lista de itens com valores calculados
  - Badge com total da compra
  - Botão de remoção para cada item

### PurchaseItemsTooltip
- **Localização**: `src/components/PurchaseItemsTooltip.tsx`
- **Função**: Exibir itens de compra ao passar o mouse
- **Recursos**:
  - Tooltip animado com efeito fade-in
  - Design executivo (cores slate/gray/gold)
  - Responsivo e elegante
  - Scroll automático para muitos itens

## Estrutura de Dados

### Interface PurchaseItem
```typescript
interface PurchaseItem {
  id: string;          // ID único do item
  name: string;        // Nome do produto
  quantity: number;    // Quantidade comprada
  unitPrice: number;   // Preço unitário
  total: number;       // Total (quantity * unitPrice)
}
```

### Movement (atualizado)
```typescript
interface Movement {
  // ... campos existentes
  purchaseItems?: PurchaseItem[];  // Lista de itens da compra
}
```

## Fluxo de Uso

1. **Cadastro de Compra**:
   - Selecionar "Saída"
   - Escolher categoria "🏭 Fornecedores"
   - Adicionar itens no gerenciador:
     - Digitar nome do produto
     - Definir quantidade
     - Informar preço unitário
     - Clicar em "+" para adicionar
   - O valor total é calculado automaticamente
   - Preencher demais campos (descrição, forma de pagamento, etc.)
   - Submeter formulário

2. **Visualização**:
   - No histórico, compras aparecem normalmente
   - Ícone de sacola 🛍️ com badge indicando número de itens
   - Passar mouse sobre ícone para ver detalhes
   - Tooltip mostra todos os produtos e valores

3. **Edição**:
   - Itens de compra são preservados no histórico
   - Sistema mantém registro de todos os produtos comprados

## Validações

- ✅ Categoria "Fornecedores" requer pelo menos 1 item
- ✅ Quantidade e preço devem ser maiores que zero
- ✅ Nome do item é obrigatório
- ✅ Total calculado automaticamente
- ✅ Campo de valor desabilitado quando há itens

## Estilos

### PurchaseItemsManager
- Background com gradiente executivo
- Border dourado (accent color)
- Itens com hover effect
- Badge dourado com total
- Botão de adicionar com gradiente gold
- Botão de remover vermelho suave

### PurchaseItemsTooltip
- Modal flutuante com sombra elegante
- Animação fade-in suave
- Header/footer com background sutilizado
- Lista scrollável para muitos itens
- Seta indicadora posicionada no gatilho
- Badge com número de itens

## Integração

### Arquivos Modificados
1. `src/types/index.ts` - Interface PurchaseItem e campo purchaseItems
2. `src/context/CaixaContext.tsx` - Suporte a purchaseItems no addMovement
3. `src/components/MovementForm.tsx` - Gerenciador de itens integrado
4. `src/components/MovementHistory.tsx` - Tooltip de visualização
5. `src/components/EditMovementModal.tsx` - Suporte ao tipo cartao_credito

### Arquivos Criados
1. `src/components/PurchaseItemsManager.tsx`
2. `src/components/PurchaseItemsManager.module.css`
3. `src/components/PurchaseItemsTooltip.tsx`
4. `src/components/PurchaseItemsTooltip.module.css`

## Benefícios

✅ **Organização**: Compras com múltiplos produtos organizadas em um único registro
✅ **Rastreabilidade**: Histórico detalhado de cada item comprado
✅ **Praticidade**: Cálculo automático evita erros manuais
✅ **Visualização**: Interface limpa com detalhes sob demanda
✅ **Profissionalismo**: Design executivo e elegante

## Próximos Passos (Sugestões)

- [ ] Exportar lista de itens para PDF/Excel
- [ ] Filtrar histórico por itens específicos
- [ ] Estatísticas de itens mais comprados
- [ ] Comparação de preços ao longo do tempo
- [ ] Adicionar foto/comprovante para cada item
