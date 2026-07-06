import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "financial_summary",
  title: "Resumo financeiro",
  description:
    "Retorna totais de recebido, pendente e atrasado. Pode filtrar por intervalo de vencimento.",
  inputSchema: {
    due_from: z.string().optional().describe("Data mínima de vencimento (YYYY-MM-DD)."),
    due_to: z.string().optional().describe("Data máxima de vencimento (YYYY-MM-DD)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ due_from, due_to }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    let q = sb.from("financial_records").select("value, status, due_date");
    if (due_from) q = q.gte("due_date", due_from);
    if (due_to) q = q.lte("due_date", due_to);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const today = new Date().toISOString().split("T")[0];
    let paid = 0,
      pending = 0,
      overdue = 0;
    for (const r of data ?? []) {
      const v = Number(r.value) || 0;
      if (r.status === "quitado") paid += v;
      else if (r.status === "atrasado") overdue += v;
      else if (r.status === "pendente") {
        if (r.due_date < today) overdue += v;
        else pending += v;
      }
    }
    const summary = {
      paid,
      pending,
      overdue,
      total: paid + pending + overdue,
      count: data?.length ?? 0,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
