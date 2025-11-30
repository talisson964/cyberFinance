# Correção de Problema: Itens Marcados Incorretamente como Atrasados

## 🔍 Problema Identificado

Itens com data de vencimento (`due_date`) no futuro estavam sendo marcados incorretamente como atrasados, mesmo quando a data ainda não havia chegado.

**Exemplo:** Um item com data de movimentação 24/11 e data de vencimento 10/12 aparecia como atrasado mesmo em 30/11.

## 🔎 Causa Raiz

O problema estava em um **trigger do PostgreSQL** no Supabase que calculava automaticamente o campo `is_overdue` **ANTES** de cada INSERT ou UPDATE.

### O Trigger Antigo (com problema):
```sql
IF NEW.date < CURRENT_DATE AND NEW.is_paid = false THEN
    NEW.is_overdue = true;
ELSE
    NEW.is_overdue = false;
END IF;
```

**Problema:** O trigger usava `NEW.date` (data da movimentação) em vez de `NEW.due_date` (data de vencimento). Isso causava:
- ✅ Logs do frontend mostrando cálculo correto: "Is overdue? false"
- ❌ Mas o trigger do banco sobrescrevia para `true` antes de salvar
- ❌ Lista de atrasados continuava mostrando o item incorretamente

## ✅ Solução Implementada

### 1. Atualização do Trigger
Criado arquivo `supabase-fix-overdue-trigger.sql` que:
- Remove o trigger e função antiga
- Cria nova função que prioriza `due_date` quando disponível
- Só marca como atrasado se a data de vencimento JÁ PASSOU
- Para parcelas, permite o frontend controlar o cálculo

### 2. Correção de Dados Existentes
Criado arquivo `supabase-fix-overdue-records.sql` que:
- Corrige registros com `due_date` no futuro marcados incorretamente
- Limpa flag de atraso em parcelas (frontend calcula corretamente)
- Fornece query para verificar resultados

### 3. Logs de Debug Adicionados
No arquivo `CaixaContextSupabase.tsx`:
- Adicionados logs detalhados no processo de atualização
- Mostra quando tenta atualizar e se teve sucesso
- Facilita identificar problemas futuros

## 📝 Como Aplicar a Correção

### Passo 1: Executar no Supabase SQL Editor
```sql
-- 1. Execute primeiro (corrige o trigger):
-- Arquivo: supabase-fix-overdue-trigger.sql
```

### Passo 2: Corrigir Dados Existentes
```sql
-- 2. Execute depois (corrige registros):
-- Arquivo: supabase-fix-overdue-records.sql
```

### Passo 3: Verificar no Console
1. Abra o navegador e vá para a aplicação
2. Abra Console (F12)
3. Verifique os logs:
   - `"Is overdue? false"` - cálculo correto
   - `"✓ Successfully updated..."` - atualização bem-sucedida
   - Nenhum erro 400 ou de atualização

### Passo 4: Remover Logs de Debug (Depois de Confirmar)
Após verificar que tudo funciona:
```typescript
// Em CaixaContextSupabase.tsx, remover os console.log adicionados:
// - Linha ~216-220: logs do cálculo de dueDate
// - Linha ~257-263: logs de atualização
```

## 🎯 Resultado Esperado

Após aplicar a correção:
- ✅ Itens com vencimento futuro NÃO aparecem como atrasados
- ✅ Itens com vencimento passado SÃO marcados como atrasados
- ✅ Cálculo de parcelas atrasadas funciona corretamente
- ✅ Relatório "Análise de Atrasados" mostra apenas itens realmente atrasados

## 🔧 Lógica Atualizada

### Ordem de Prioridade para Cálculo:
1. **Com due_date:** Verifica se `due_date < hoje`
2. **Com parcelas:** Verifica cada parcela individualmente (no frontend)
3. **Sem nenhum:** NÃO marca como atrasado automaticamente

### Regras:
- Se `is_paid = true`: **NUNCA** atrasado
- Se `due_date` no futuro: **NÃO** atrasado
- Se `due_date` no passado E não pago: **ATRASADO**
- Se tem parcelas: Frontend calcula (verifica cada parcela)

## 📊 Verificação de Funcionamento

Execute esta query para verificar:
```sql
SELECT 
    description,
    date,
    due_date,
    is_overdue,
    is_paid,
    CASE 
        WHEN due_date >= CURRENT_DATE THEN 'OK: Futuro'
        WHEN due_date < CURRENT_DATE AND is_overdue = true THEN 'OK: Atrasado'
        ELSE 'ERRO: Inconsistente'
    END as status_check
FROM public.movements
WHERE due_date IS NOT NULL
AND is_paid = false
ORDER BY due_date DESC;
```

Todos os registros devem mostrar "OK" na coluna `status_check`.

## 🚨 Atenção

- Execute os scripts SQL **na ordem especificada**
- Faça backup antes de executar (opcional, mas recomendado)
- Verifique no console do navegador se não há erros após aplicar
- Remova os logs de debug após confirmar funcionamento

## 📝 Arquivos Criados/Modificados

1. ✅ `supabase-fix-overdue-trigger.sql` - Corrige trigger do banco
2. ✅ `supabase-fix-overdue-records.sql` - Corrige dados existentes
3. ✅ `CaixaContextSupabase.tsx` - Logs de debug adicionados
4. ✅ `CORRECAO_ATRASOS_FALSOS.md` - Este documento

## 🎉 Conclusão

O problema era causado pela lógica antiga no trigger do PostgreSQL que não considerava o campo `due_date`. Com a correção aplicada, o sistema agora calcula corretamente os atrasos baseando-se na data de vencimento real.
