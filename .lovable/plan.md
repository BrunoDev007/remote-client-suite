## Plano: Agrupar múltiplos CNPJs em um único plano

### Objetivo
Permitir que vários clientes (CNPJs) sejam vinculados juntos a um mesmo plano, compartilhando uma única cobrança mensal (ex.: 4 CNPJs vinculados ao PL 300 → apenas R$ 300 por mês no total, não R$ 300 por CNPJ).

---

### Situação Atual
Hoje, cada vinculação em `client_plans` representa **1 cliente ↔ 1 plano**, e gera **1 registro financeiro por cliente por mês**. Se 4 CNPJs forem vinculados ao mesmo plano, são geradas 4 cobranças mensais.

---

### Solução: Grupo de Faturamento

Introduzir o conceito de **Grupo de Cobrança** (billing group) na vinculação:
- Uma vinculação pode conter **vários clientes** (CNPJs).
- Um dos CNPJs é marcado como **CNPJ Responsável pela Cobrança** (recebe a fatura).
- Os demais são "membros do grupo" — aparecem listados, mas não geram cobrança própria.
- O sistema gera **apenas 1 registro financeiro mensal** por grupo, com o valor do plano.

---

### Mudanças no Banco de Dados

**Nova tabela `client_plan_members`** para listar os CNPJs adicionais que pertencem a uma vinculação:

```
client_plan_members
├── id
├── client_plan_id  → FK client_plans (vinculação principal/grupo)
├── client_id       → FK clients (CNPJ membro)
├── created_at
└── UNIQUE (client_plan_id, client_id)
```

A vinculação em `client_plans` continua representando o **CNPJ responsável** pela cobrança. Os CNPJs adicionais ficam em `client_plan_members`.

Política RLS: mesma regra de leitura/escrita usada hoje em `client_plans` (usuário autenticado).

---

### Mudanças na Tela "Planos" (aba Vincular Cliente)

Modificar o diálogo "Vincular Cliente ao Plano":

1. **Cliente Responsável (Cobrança)** — campo atual (select de 1 CNPJ).
2. **Novo campo: "CNPJs adicionais no mesmo grupo"** — multi-select de clientes (opcional).
3. Mensagem informativa: *"Todos os CNPJs deste grupo compartilham a mesma cobrança mensal de R$ X. Apenas o CNPJ responsável receberá a fatura."*

Na listagem de vinculações ativas:
- Mostrar o CNPJ responsável e, abaixo, a lista de CNPJs membros do grupo (badge tipo "+3 CNPJs vinculados").

---

### Mudanças no Financeiro

Nenhuma alteração na lógica de geração mensal: ela já cria 1 registro por `client_plan` ativo. Como o grupo é representado por **1 único `client_plan`** (do responsável), continua gerando **1 cobrança mensal pelo valor do plano**.

Adicional: na exibição do registro financeiro, indicar visualmente se há CNPJs agrupados (ex.: badge "Grupo: 4 CNPJs") ao lado do nome do cliente responsável.

---

### Detalhes Técnicos

**Arquivos a editar:**
- `supabase/migrations/...` — criar tabela `client_plan_members` com GRANTs e RLS.
- `src/hooks/usePlans.ts`:
  - `linkClientToPlan` aceita novo parâmetro `additional_client_ids: string[]` e insere em `client_plan_members` após criar a vinculação.
  - `fetchClientPlans` faz join/leitura de `client_plan_members` para retornar `members: Client[]` em cada vinculação.
  - `unlinkClient` apaga membros do grupo junto com a vinculação.
- `src/pages/Plans.tsx`:
  - Adicionar multi-select de clientes adicionais no diálogo de vincular.
  - Exibir membros do grupo na lista de vinculações.
- `src/pages/Financial.tsx` (opcional, visual): badge "Grupo (N CNPJs)" no nome do cliente quando houver membros.

**Comportamento de exclusão:**
- Remover um CNPJ membro: deleta apenas o registro em `client_plan_members`.
- Desvincular o responsável: remove a vinculação inteira + membros + registros financeiros pendentes (igual hoje).

---

### Resultado para o exemplo do usuário

Vinculação ao PL 300:
- Responsável: CNPJ `28.205.133/0001-13`
- Membros: `28.205.133/0002-02`, `28.205.133/0003-85`, `21.303.691/0001-72`
- Cobrança gerada por mês: **1 registro de R$ 300** (em nome do responsável, com badge "Grupo: 4 CNPJs").
