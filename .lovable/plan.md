
## Plano: Adicionar Card "A Receber" na Tela Financeiro

### Objetivo
Adicionar um novo card de estatísticas chamado "A Receber" que mostra o total de valores pendentes/atrasados quando o usuário filtra por mês.

---

### Situação Atual

O hook `useFinancial.ts` já calcula `totalPendente` (linha 291):
```typescript
totalPendente: recordsWithStatus.filter(r => r.status !== 'quitado').reduce((sum, r) => sum + Number(r.value), 0)
```

Porém, esse valor **não está sendo exibido** na tela. Atualmente existem 4 cards:
1. Quitados (quantidade)
2. Pendentes (quantidade)
3. Em Atraso (quantidade)
4. Receita (valor total quitado)

---

### Solução

Adicionar um **5º card** chamado **"A Receber"** que exibe o valor de `stats.totalPendente`.

---

### Mudanças no Código

**Arquivo:** `src/pages/Financial.tsx`

**Localização:** Grid de cards de estatísticas (linhas 273-330)

**Antes:**
```
grid-cols-2 lg:grid-cols-4
```

**Depois:**
```
grid-cols-2 lg:grid-cols-5
```

**Novo Card a Adicionar (após o card "Receita"):**

```tsx
<Card>
  <CardContent className="p-3 sm:p-4">
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-muted-foreground truncate">A Receber</p>
        <p className="text-base sm:text-2xl font-bold text-warning truncate">
          R$ {stats.totalPendente.toFixed(2)}
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### Comportamento

| Ação | Resultado |
|------|-----------|
| Usuário filtra por mês | Card "A Receber" mostra soma dos valores pendentes/atrasados daquele mês |
| Usuário clica em "Quitar" | Valor sai de "A Receber" e vai para "Receita" |
| Usuário clica em "Desquitar" | Valor sai de "Receita" e volta para "A Receber" |

---

### Layout Final dos Cards

```
+----------+----------+----------+----------+------------+
| Quitados | Pendentes| Em Atraso|  Receita | A Receber  |
|    5     |    3     |    2     | R$500,00 | R$ 300,00  |
+----------+----------+----------+----------+------------+
```

---

### Detalhes Técnicos

- O valor é calculado automaticamente pelo `getStats(filteredRecords)` que já existe
- Quando um registro é quitado, `updateRecordStatus` atualiza o estado e os cards refletem a mudança instantaneamente
- A cor do card será **warning (amarelo/laranja)** para indicar valores pendentes
