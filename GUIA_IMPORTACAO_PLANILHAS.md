# Guia de Importação de Planilhas - Sistema de Controle de Caixa

## Formato de Arquivo

O sistema aceita arquivos **Excel (.xlsx, .xls)** e **CSV (.csv)**.

## Colunas Obrigatórias

A planilha deve conter exatamente as seguintes colunas (em qualquer ordem):

| Coluna | Tipo | Formato | Exemplo |
|--------|------|---------|---------|
| **Data** | String/Data | DD/MM/YYYY ou YYYY-MM-DD | 15/01/2025 ou 2025-01-15 |
| **Descrição** | String | Texto livre | Venda de Produto A |
| **Tipo** | String | "entrada" ou "saida" | entrada |
| **Valor** | Número | Número positivo | 1500.50 |
| **Forma de Pagamento** | String | Nome do método | Pix, Crédito, Dinheiro, Transferência, Débito, Boleto, Cheque |
| **Quantidade de Parcelas** | Número | Número inteiro (mín: 1) | 3 |
| **Valor por Parcela** | Número | Número positivo | 500 |
| **Parcelas Pagas** | Número | 0 até Quantidade de Parcelas | 2 |

## Exemplos de Planilhas

### Exemplo 1: Arquivo Excel com múltiplas movimentações

```
Data            | Descrição           | Tipo    | Valor  | Forma de Pagamento | Quantidade de Parcelas | Valor por Parcela | Parcelas Pagas
2025-01-10      | Venda Balcão        | entrada | 500    | Dinheiro          | 1                      | 500               | 1
2025-01-12      | Venda Online        | entrada | 1500   | Pix               | 1                      | 1500              | 1
2025-01-15      | Compra Fornecedor   | saida   | 2000   | Crédito           | 3                      | 666.67            | 2
2025-01-18      | Aluguel             | saida   | 3000   | Transferência     | 1                      | 3000              | 0
2025-01-20      | Serviço Prestado    | entrada | 1200   | Débito            | 2                      | 600               | 1
```

### Exemplo 2: Arquivo CSV

```csv
Data,Descrição,Tipo,Valor,Forma de Pagamento,Quantidade de Parcelas,Valor por Parcela,Parcelas Pagas
15/01/2025,Produto X,entrada,250,Pix,1,250,1
18/01/2025,Serviço Y,saida,500,Boleto,2,250,0
20/01/2025,Devolução,entrada,100,Dinheiro,1,100,1
```

## Notas Importantes

1. **Datas**: Aceita tanto formato DD/MM/YYYY quanto YYYY-MM-DD
   - Exemplos válidos: `15/01/2025`, `2025-01-15`

2. **Tipo**: Deve ser exatamente "entrada" ou "saida" (sem acentuação)
   - ✅ Válido: entrada, saida
   - ❌ Inválido: Entrada, Saída, ENTRADA

3. **Forma de Pagamento**: O sistema reconhece automaticamente:
   - Pix, Crédito, Débito, Dinheiro, Transferência, Boleto, Cheque
   - O valor será normalizado automaticamente

4. **Valores**: Devem ser números positivos
   - ✅ Válido: 1500, 1500.50, 1500,50 (dependendo da localização)
   - ❌ Inválido: -500, 1.500 (como milhares)

5. **Parcelas**: 
   - Se Quantidade de Parcelas = 1, será considerado pagamento único
   - Parcelas Pagas não pode ser maior que Quantidade de Parcelas
   - Exemplo: Se tem 3 parcelas, Parcelas Pagas pode ser 0, 1, 2 ou 3

6. **Linhas Vazias**: São automaticamente ignoradas

## Processo de Importação

1. Acesse a página **Movimentações**
2. Localize a seção **"📤 Importar Movimentações via Planilha"**
3. Clique em **"Clique para selecionar arquivo"**
4. Selecione seu arquivo Excel ou CSV
5. O sistema validará automaticamente as colunas
6. Se houver erros, você verá a lista de problemas
7. Se tudo estiver correto, clique em **"✅ Importar"**
8. As movimentações serão adicionadas ao histórico

## Tratamento de Erros

O sistema mostrará mensagens de erro específicas para:
- Colunas obrigatórias faltantes
- Datas em formato inválido
- Tipos não reconhecidos (não "entrada" ou "saida")
- Valores negativos ou zero
- Formas de pagamento vazias
- Quantidade de parcelas inválida
- Parcelas pagas fora do intervalo permitido

## Dicas

- Comece com um pequeno arquivo de teste para verificar o formato
- Mantenha os nomes de colunas consistentes (case-insensitive)
- Use extensão .xlsx para melhor compatibilidade
- Não deixe células vazias nas colunas obrigatórias
- Verifique se os separadores decimais estão corretos para sua localização
