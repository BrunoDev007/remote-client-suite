## Objetivo
Aplicar máscara de moeda brasileira (R$ 1.657,40) em todos os campos de valor do sistema.

## Implementação

1. **Criar utilitário `formatCurrency`** em `src/lib/utils.ts`:
   - `formatBRL(value)` → usa `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` retornando `R$ 1.657,40`.
   - `formatBRLNumber(value)` → mesma formatação sem o prefixo `R$` (para casos como observações de mudança).

2. **Substituir todos os `R$ X.toFixed(2)`** pelos helpers nos arquivos:
   - `src/pages/Dashboard.tsx` (5 ocorrências — cards e resumo financeiro)
   - `src/pages/Financial.tsx` (cards de receita/pendente, lista de registros com valor riscado/novo, modal de valor original, total do relatório CSV, e ajuste do `Valor` exportado)
   - `src/pages/Plans.tsx` (selects, cards de planos, total mensal, lista clientes vinculados)
   - `src/components/financial/FinancialRecordActions.tsx` (confirmação de exclusão)
   - `src/components/financial/LateFeeCalculator.tsx` (lista de seleção de registro)
   - `src/hooks/useFinancial.ts` (texto de observações no histórico de alteração)

3. **Parsing reverso no Financial.tsx (linha 583)**: ajustar para extrair número do texto formatado em BR (remover `R$`, pontos e trocar vírgula por ponto) antes de somar, mantendo o total do relatório correto.

## Fora de escopo
- Inputs de digitação de valor (ex.: campo "Valor Mensal" do plano) seguem aceitando entrada numérica padrão; somente exibições mudam.
- Nenhuma alteração de lógica de negócio, banco ou cálculos.
