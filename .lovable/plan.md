
## Problema

Na tela Financeiro, ao filtrar um mês, o sistema chama `generateMonthlyRecords(year, month)` em `src/hooks/useFinancial.ts` que:

- Cria registros para **todos** os planos ativos, sem checar se o plano já começou.
- Usa vencimento fixo no **dia 10** do mês filtrado, ignorando o `payment_date` do plano.

Resultado: clientes como **VAL AUTO PECAS LTDA** e **E M V COMERCIO DE ALIMENTOS LTDA** (PL 75, `start_date = 2026-06-25`, `payment_date = 2026-07-05`) ganharam cobranças automáticas em 10/05/2026 e 10/06/2026, antes do início real do contrato.

## Correção

### 1. Ajustar `generateMonthlyRecords` em `src/hooks/useFinancial.ts`

Para cada plano ativo, antes de criar o registro do mês filtrado:

- **Filtrar por início do plano**: comparar o primeiro dia do mês filtrado com a referência de início. A referência usada será `payment_date` se existir, senão `start_date`. Se o vencimento calculado for **anterior** a essa data de referência, pular o plano (não gerar cobrança).
- **Usar o dia correto de vencimento**: extrair o dia de `payment_date` (ou `start_date` como fallback) e montar `due_date = year-month-DD`. Manter dia 10 apenas como último fallback quando nenhum dos dois existir.
- **Manter** a checagem atual de duplicidade por `client_plan_id` no mês.

Manipulação de datas via string `YYYY-MM-DD` (sem `new Date()`) para evitar shift de timezone, conforme padrão do projeto.

### 2. Limpar registros gerados indevidamente

Para os 4 planos afetados na imagem, apagar as cobranças `pendente` com `due_date` anterior ao `payment_date` do respectivo `client_plan`. Isso remove os 8 registros de 10/05/2026 e 10/06/2026 listados abaixo, mantendo apenas os corretos a partir de 05/07/2026:

```
client_plan_id                        | due_date    | empresa
724a78ce... (VAL AUTO PL 75)          | 2026-05-10  | remover
724a78ce... (VAL AUTO PL 75)          | 2026-06-10  | remover
65517389... (E M V PL 75)             | 2026-05-10  | remover
65517389... (E M V PL 75)             | 2026-06-10  | remover
e244def1... (E M V PL 75)             | 2026-05-10  | remover
e244def1... (E M V PL 75)             | 2026-06-10  | remover
98c4bd16... (E M V PL 75)             | 2026-05-10  | remover
98c4bd16... (E M V PL 75)             | 2026-06-10  | remover
```

A limpeza será feita via comando SQL DELETE restrito a `status = 'pendente'` e `due_date < client_plans.payment_date` apenas para esses 4 `client_plan_id`, para não tocar em nada já quitado ou de outros clientes.

### 3. Não alterar

- UI da tela Financeiro.
- Lógica de quitação, recálculo de juros, ou demais hooks.
- Demais planos cujos registros antigos sejam legítimos.

## Detalhes técnicos

Arquivos:
- `src/hooks/useFinancial.ts` — ajustar `generateMonthlyRecords`.
- Operação de dados (DELETE) executada via ferramenta de insert/update do Supabase, não migration.

Pseudocódigo do filtro novo dentro de `generateMonthlyRecords`:

```text
for plan in activePlans:
  ref = plan.payment_date || plan.start_date   // 'YYYY-MM-DD'
  day = ref ? Number(ref.slice(8,10)) : 10
  dueDate = `${year}-${MM}-${String(day).padStart(2,'0')}`
  if ref && dueDate < ref: continue            // ainda não começou
  if existingPlanIds.has(plan.id): continue
  push(record)
```
