# 🚀 INICIAR AGORA - Sistema v1.1.0

## ⚡ Quick Start (30 segundos)

### 1. Abra o PowerShell/Terminal
```powershell
cd c:\Users\Crmv\Desktop\sistema-caixa
```

### 2. Instale as dependências (primeira vez apenas)
```powershell
npm install
```

### 3. Inicie o servidor
```powershell
npm run dev
```

### 4. Abra no navegador
```
http://localhost:5173/
```

**Pronto! ✅**

---

## 🎮 Primeiros Passos

### 1. Explore o Dashboard
- Clique em **Dashboard** no menu lateral
- Veja os 4 cards principais (Entrada, Saída, Líquido, Lucro)
- Veja os 3 cards de classificação (Fixo, Temporário, Pendências) - NOVO v1.1.0
- Observe os 4 gráficos

### 2. Teste com Transações (v1.0.0)
- Clique em **Transações** 
- Clique em **Adicionar Transação**
- Preencha um exemplo:
  - Tipo: Entrada
  - Valor: 1000
  - Categoria: Venda
  - Descrição: Teste
- Clique em **Adicionar**

### 3. Teste Movimentações (v1.1.0 - NOVO!)
- Clique em **Movimentações** (novo menu item com 💳)
- Clique em **Registrar Movimentação**
- Teste registrando:
  
  **Exemplo 1: Pix simples**
  ```
  Tipo de Transação: Entrada
  Tipo de Movimentação: 📱 Pix
  Valor: 500
  Categoria: Venda
  Descrição: Venda por Pix
  ```
  
  **Exemplo 2: Compra Parcelada**
  ```
  Tipo de Transação: Saída
  Tipo de Movimentação: 📅 Parcelado
  Valor: 3000
  Classificação: ⏱️ Temporário
  Categoria: Compra
  Descrição: Equipamento
  Parcelas: 12
  Data 1ª Parcela: 2025-12-01
  ```

### 4. Marque como Pago
- No histórico, clique em **✅ Marcar como Pago**
- Veja a cor mudar de amarelo (pendente) para verde (pago)

### 5. Volte ao Dashboard
- Veja os valores atualizados em tempo real
- Observe o card de Pendências
- Veja o novo gráfico "Fixo vs Temporário"

---

## 📚 Documentação Completa

| Arquivo | O que é |
|---------|---------|
| **README_v1.1.0.md** | Visão geral completa do projeto |
| **GUIA_V1.1.0.md** | Como usar todas as funcionalidades |
| **STATUS.txt** | Resumo técnico e estatísticas |
| **RESUMO_V1.1.0.txt** | Overview com checklist |
| **ATUALIZACAO_V1.1.0.md** | Mudanças técnicas de v1.0 → v1.1 |

---

## 💡 Dicas Úteis

### Ver os dados no localStorage
Abra o navegador (F12) e execute no console:

```javascript
// Ver movimentações
JSON.parse(localStorage.getItem('caixa_movements'))

// Ver transações
JSON.parse(localStorage.getItem('caixa_transactions'))

// Copiar para clipboard
copy(JSON.parse(localStorage.getItem('caixa_movements')))
```

### Build para Produção
```powershell
npm run build
```

Os arquivos estão em `dist/`

### Limpar Dados
```javascript
localStorage.clear();
location.reload();
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Porta 5173 em uso | `npm run dev -- --port 5174` |
| Módulos não encontrados | `npm install` |
| TypeScript errors | `npm run build` para ver detalhes |
| Dados sumiram | `localStorage` foi limpo (use F12 para verificar) |
| Servidor não inicia | Feche outras instâncias do Vite |

---

## ✨ O que é Novo em v1.1.0?

✨ **Movimentações** - Tipos: Pix, Crédito, Parcelado, Dinheiro, Transferência, Boleto  
✨ **Classificação** - Fixo vs Temporário para controlar despesas  
✨ **Parcelas** - Rastreie compras parceladas com progresso (1/12, 2/12, etc)  
✨ **Histórico Filtrado** - Status e tipos de filtro avançados  
✨ **Dashboard Completo** - Novos cards de classificação e gráfico Fixo vs Temporário  
✨ **Página Dedicada** - /movimentacoes com formulário e histórico  

---

## 🎯 Próximos Passos (Após Testar)

1. Leia **GUIA_V1.1.0.md** para explorar todas as funcionalidades
2. Configure dados reais no seu negócio
3. Use diariamente para acompanhar o caixa
4. Considere fazer backup dos dados periodicamente

---

## 📞 Precisa de Ajuda?

1. Consulte os arquivos de documentação
2. Abra DevTools (F12) para verificar console
3. Verifique localStorage em Application → LocalStorage

---

**Divirta-se gerenciando seu caixa! 🎉**
