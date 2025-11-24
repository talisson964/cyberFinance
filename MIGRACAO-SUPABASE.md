# 🔄 Migração para Supabase - CyberFinance

## 📋 O que foi implementado

A migração do localStorage para o Supabase PostgreSQL foi completamente implementada, garantindo que seus dados estejam seguros, sincronizados e acessíveis de qualquer lugar.

---

## ✨ Benefícios da Migração

### 🔒 **Segurança**
- Dados protegidos no banco de dados PostgreSQL
- Row Level Security (RLS) - cada usuário vê apenas seus dados
- Criptografia em trânsito e em repouso
- Backup automático pelo Supabase

### ☁️ **Sincronização Multi-dispositivo**
- Acesse seus dados de qualquer navegador
- Sincronização automática em tempo real
- Não perca mais dados ao limpar o navegador

### 💾 **Backup e Recuperação**
- Backups automáticos diários
- Histórico completo de transações
- Recuperação de dados facilitada

### 🚀 **Performance**
- Consultas otimizadas com índices
- Paginação para grandes volumes de dados
- Realtime updates automáticos

---

## 🛠️ Passos para Implementação

### 1️⃣ **Executar o Schema SQL no Supabase**

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Abra seu projeto
3. Vá em **SQL Editor**
4. Execute o arquivo `supabase-schema-updated.sql`
5. Aguarde a confirmação "Completed successfully"

```sql
-- O arquivo contém:
✅ Atualização da tabela movements com novos campos
✅ Atualização da tabela transactions
✅ Triggers automáticos para campos derivados
✅ Função de migração do localStorage
✅ View com estatísticas calculadas
✅ Índices para performance
```

### 2️⃣ **Trocar o CaixaContext**

Abra o arquivo `src/main.tsx` ou onde o `CaixaProvider` é importado:

**ANTES:**
```tsx
import { CaixaProvider } from './context/CaixaContext';
```

**DEPOIS:**
```tsx
import { CaixaProvider } from './context/CaixaContextSupabase';
```

### 3️⃣ **Adicionar o Componente de Migração**

No arquivo `src/App.tsx`, adicione o componente `MigrationNotice`:

```tsx
import { MigrationNotice } from './components/MigrationNotice';

function App() {
  return (
    <AuthProvider>
      <CaixaProvider>
        <MigrationNotice /> {/* Adicione esta linha */}
        {/* resto do seu app */}
      </CaixaProvider>
    </AuthProvider>
  );
}
```

---

## 📊 Estrutura das Tabelas Atualizadas

### **movements** (Movimentações)
```
- id (UUID)
- user_id (UUID) ← Isolamento por usuário
- transaction_id (UUID)
- type ('entrada' | 'saida')
- movement_type ('pix' | 'cartao_credito' | 'parcelado' | ...)
- amount (NUMERIC)
- category (TEXT)
- subcategory (TEXT)
- description (TEXT)
- date (DATE)
- timestamp (BIGINT)
- classification ('fixo' | 'ocasional' | 'nenhum')
- status ('pendente' | 'parcial' | 'pago' | 'atrasado')
- is_paid (BOOLEAN)
- paid_date (DATE)
- partial_paid_amount (NUMERIC)
- last_payment_date (DATE)
- reminder_date (DATE)
- is_overdue (BOOLEAN)
- overdue_amount (NUMERIC)
- notes (TEXT)
- attachment_url (TEXT)
- comprovante (TEXT)
- fixed_expense_duration (INTEGER)
- installments (JSONB) ← Array de parcelas
- total_installments (INTEGER)
- paid_installments (INTEGER)
- purchase_items (JSONB) ← Array de itens de compra
- payment_method (TEXT)
- bank (TEXT)
- created_at (TIMESTAMP)
```

### **transactions** (Transações)
```
- id (UUID)
- user_id (UUID)
- type ('receive' | 'pay')
- amount (NUMERIC)
- category (TEXT)
- description (TEXT)
- due_date (DATE)
- completion_date (DATE)
- status ('pending' | 'completed' | 'overdue')
- timestamp (BIGINT)
- recurrence ('unica' | 'diaria' | 'semanal' | 'mensal' | 'anual')
- export_type ('contabil' | 'boleto' | 'nenhum')
- created_at (TIMESTAMP)
```

---

## 🔐 Segurança Implementada

### **Row Level Security (RLS)**

Cada usuário pode acessar **APENAS** seus próprios dados:

```sql
-- Exemplo de policy
CREATE POLICY "Usuários podem visualizar suas próprias movimentações"
ON public.movements FOR SELECT
USING (auth.uid() = user_id);
```

### **Políticas por Operação**

- ✅ **SELECT**: Usuário vê apenas seus dados
- ✅ **INSERT**: Usuário cria apenas para si
- ✅ **UPDATE**: Usuário edita apenas seus dados
- ✅ **DELETE**: Usuário deleta apenas seus dados

---

## 🔄 Migração Automática

### **Como Funciona**

1. O sistema detecta dados no localStorage
2. Exibe um modal elegante com as opções
3. Ao clicar em "Migrar Dados", executa a função `migrate_local_data` do Supabase
4. Remove os dados do localStorage após sucesso
5. Marca a migração como concluída

### **Dados Migrados**

- ✅ Todas as movimentações (`caixa_movements`)
- ✅ Todas as transações (`caixa_transactions`)
- ✅ Juros de dívidas (`caixa_debt_interests`)
- ✅ Multas de dívidas (`caixa_debt_fines`)

---

## 🎯 Hooks Disponíveis

### **useMovements()**
```tsx
const { 
  movements,         // Array de movimentações
  loading,           // Estado de carregamento
  error,             // Erro se houver
  addMovement,       // Adicionar nova movimentação
  updateMovement,    // Atualizar movimentação
  deleteMovement,    // Deletar movimentação
  refresh            // Recarregar dados manualmente
} = useMovements();
```

### **useTransactions()**
```tsx
const { 
  transactions,      // Array de transações
  loading,
  error,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  refresh
} = useTransactions();
```

### **useMigrateLocalStorage()**
```tsx
const { 
  migrateData,       // Função para migrar
  migrating,         // Estado de migração
  migrationResult    // Resultado da migração
} = useMigrateLocalStorage();
```

---

## 🔥 Realtime Subscriptions

Os hooks implementam **Supabase Realtime** automaticamente:

```tsx
// Atualização automática quando dados mudam
useEffect(() => {
  const channel = supabase
    .channel('movements_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'movements',
      filter: `user_id=eq.${user.id}`,
    }, () => {
      fetchMovements(); // Recarrega automaticamente
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [user]);
```

### **Benefícios:**
- 📊 Dashboard atualiza em tempo real
- 🔄 Múltiplas abas sincronizadas
- 👥 Colaboração futura (multi-usuário)

---

## 🧪 Testando a Migração

### **1. Verificar dados locais**
```javascript
// No console do navegador
console.log(localStorage.getItem('caixa_movements'));
console.log(localStorage.getItem('caixa_transactions'));
```

### **2. Executar migração**
- Faça login no sistema
- O modal de migração aparecerá automaticamente
- Clique em "Migrar Dados"
- Aguarde confirmação de sucesso

### **3. Verificar no Supabase**
```sql
-- No SQL Editor do Supabase
SELECT COUNT(*) FROM movements WHERE user_id = 'seu-user-id';
SELECT COUNT(*) FROM transactions WHERE user_id = 'seu-user-id';
```

### **4. Testar operações CRUD**
- ✅ Criar nova movimentação
- ✅ Editar movimentação existente
- ✅ Deletar movimentação
- ✅ Marcar como pago
- ✅ Verificar sincronização em tempo real

---

## 📈 Performance

### **Índices Criados**
```sql
✅ idx_movements_user_id       -- Consultas por usuário
✅ idx_movements_date          -- Ordenação por data
✅ idx_movements_type          -- Filtro por tipo
✅ idx_movements_category      -- Filtro por categoria
✅ idx_movements_status        -- Filtro por status
✅ idx_movements_classification -- Filtro por classificação
✅ idx_movements_is_paid       -- Consultas de pagos/pendentes
✅ idx_movements_is_overdue    -- Consultas de atrasados
✅ idx_movements_timestamp     -- Ordenação por timestamp
```

### **Triggers Automáticos**
```sql
✅ update_movement_derived_fields  -- Atualiza campos derivados
✅ update_overdue_transactions     -- Atualiza status de atrasados
```

---

## 🛡️ Backup e Recuperação

### **Backup Automático**
O Supabase realiza backups automáticos diários.

### **Backup Manual**
```sql
-- Exportar todas as movimentações de um usuário
SELECT * FROM movements 
WHERE user_id = 'seu-user-id'
ORDER BY date DESC;
```

### **Limpar Dados de Teste**
```sql
-- Usar a função criada
SELECT public.clear_user_data();
```

---

## 🐛 Troubleshooting

### **Erro: "Usuário não autenticado"**
- Verifique se o usuário está logado
- Confirme que `useAuth()` retorna um `user` válido

### **Erro: "RLS policy violation"**
- Verifique se as policies foram criadas
- Confirme que `user_id` está sendo enviado corretamente

### **Dados não aparecem**
- Verifique o console do navegador por erros
- Confirme que a migração foi executada
- Teste a query SQL diretamente no Supabase

### **Realtime não funciona**
- Verifique se o Realtime está habilitado no Supabase
- Confirme que as subscriptions estão ativas
- Verifique logs do console

---

## 📝 Checklist de Implementação

- [ ] Executar `supabase-schema-updated.sql` no Supabase
- [ ] Trocar import do CaixaContext
- [ ] Adicionar componente MigrationNotice
- [ ] Testar login e autenticação
- [ ] Executar migração de dados
- [ ] Verificar dados no Supabase
- [ ] Testar CRUD de movimentações
- [ ] Testar sincronização realtime
- [ ] Fazer backup dos dados
- [ ] Commit e push das alterações

---

## 🎉 Conclusão

Após esta migração, o CyberFinance estará usando uma arquitetura profissional com:

- ✅ Banco de dados PostgreSQL robusto
- ✅ Autenticação e segurança por usuário
- ✅ Sincronização multi-dispositivo
- ✅ Backup automático
- ✅ Realtime updates
- ✅ Escalabilidade ilimitada

**Seus dados nunca mais serão perdidos! 🚀**

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique a seção de Troubleshooting
2. Consulte a documentação do Supabase
3. Abra uma issue no GitHub

**Versão:** 2.0.0 com Supabase  
**Data:** 24 de novembro de 2025
