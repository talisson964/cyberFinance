# Melhorias na Exportação de Movimentações

## ✅ Implementado

### 1. **Expansão de Itens Agrupados**
- Todas as compras que foram agrupadas (ex: fornecedores) agora são exportadas como itens individuais
- Cada item mostra:
  - Nome do produto/serviço
  - Quantidade x Preço unitário
  - Valor total do item

**Exemplo:**
- **Antes:** 1 linha "Compra Fornecedor X - R$ 500,00"
- **Agora:** 3 linhas individuais:
  - "Compra Fornecedor X - Produto A" - 2x R$ 100,00 - R$ 200,00
  - "Compra Fornecedor X - Produto B" - 1x R$ 150,00 - R$ 150,00
  - "Compra Fornecedor X - Produto C" - 3x R$ 50,00 - R$ 150,00

### 2. **Correção de Caracteres Especiais**
- ✅ Adicionado BOM UTF-8 no CSV para garantir acentuação correta no Excel
- ✅ Escape correto de aspas duplas em textos (evita quebra de colunas)
- ✅ Fonte correta no PDF para suportar caracteres portugueses

### 3. **Aumento de Largura de Colunas**
- **PDF:** Modo paisagem (A4 horizontal) para mais espaço
- **Excel:** Colunas expandidas:
  - Descrição: 50 caracteres
  - Observações: 40 caracteres
  - Detalhe Item: 30 caracteres
- **CSV:** Sem limite de largura (definido pelo Excel ao abrir)

### 4. **Novas Colunas Adicionadas**

#### PDF:
| Coluna | Descrição |
|--------|-----------|
| Data | Data da movimentação |
| Tipo | Entrada/Saída |
| Forma Pagto | PIX, Cartão, Dinheiro, etc. |
| Classif. | Fixo/Temporário |
| Categoria | Categoria da movimentação |
| Descrição | Descrição detalhada |
| **Detalhe** | ✨ NOVO: Quantidade x Preço (para itens) |
| **Parcelas** | ✨ NOVO: Pagas/Total (ex: 2/5) |
| Valor | Valor em reais |
| Status | Pago/Pendente |
| Obs | Observações adicionais |

#### Excel e CSV:
- Data
- Tipo
- Forma de Pagamento
- Classificação
- Categoria
- Descrição
- **Detalhe Item** ✨ NOVO
- **Parcelas Pagas** ✨ NOVO
- **Total Parcelas** ✨ NOVO
- Valor
- Status
- **Data Pagamento** ✨ NOVO
- Observações

### 5. **Melhorias Visuais PDF**
- Fonte reduzida para 7pt (cabe mais informação)
- Cabeçalho em negrito com fundo cinza escuro
- Linhas alternadas coloridas para melhor leitura
- Bordas sutis entre células
- Alinhamento adequado (valores à direita, status centralizado)

## 📋 Como Usar

1. Acesse **Histórico de Movimentações**
2. Aplique filtros desejados (Tipo, Status)
3. Clique em um dos botões de exportação:
   - 📄 **PDF** - Melhor para impressão e visualização
   - 📊 **CSV** - Melhor para Excel/Google Sheets
   - 📑 **Excel** - Melhor para análises e relatórios

## 🔍 O Que é Exportado

### Itens Agrupados
Se uma movimentação tiver itens de compra cadastrados, CADA item será exportado como uma linha separada, mantendo:
- Todas as informações da movimentação original
- Nome específico do item
- Quantidade e preço unitário
- Valor total do item

### Parcelas
Para movimentações parceladas:
- Status de cada parcela (paga/pendente)
- Total: quantas parcelas pagas / total de parcelas
- Data de vencimento da primeira parcela

### Observações
Campo "notes" da movimentação é exportado na coluna "Observações"

## ⚠️ Notas Importantes

1. **CSV no Excel:** Sempre abre corretamente com acentuação (BOM UTF-8)
2. **Largura de colunas:** Ajustadas automaticamente no Excel
3. **PDF paisagem:** Mais espaço horizontal para evitar cortes
4. **Filtros respeitados:** Apenas movimentações filtradas são exportadas

## 🎯 Casos de Uso

### Exemplo 1: Fornecedores com Itens
```
Movimentação: Compra Material de Escritório - R$ 350,00
Itens cadastrados:
- Papel A4 (5x R$ 30,00)
- Canetas (20x R$ 2,50)
- Grampeador (2x R$ 25,00)

Exportação: 3 linhas separadas, cada uma com seu valor individual
```

### Exemplo 2: Parcelado
```
Movimentação: Compra Equipamento - 5x R$ 200,00
Parcelas pagas: 2

Exportação: Coluna "Parcelas" mostra "2/5"
```

### Exemplo 3: Movimentação Simples
```
Movimentação: Venda - R$ 1.500,00

Exportação: 1 linha com todas as informações
```
