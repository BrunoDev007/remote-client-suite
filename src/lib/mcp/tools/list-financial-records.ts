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
  name: "list_financial_records",
  title: "Listar registros financeiros",
  description:
    "Lista os registros financeiros (mensalidades) com filtros por status, cliente e intervalo de vencimento.",
  inputSchema: {
    status: z
      .enum(["pendente", "quitado", "atrasado"])
      .optional()
      .describe("Filtrar por status."),
    client_id: z.string().uuid().optional().describe("ID do cliente."),
    due_from: z.string().optional().describe("Data mínima de vencimento (YYYY-MM-DD)."),
    due_to: z.string().optional().describe("Data máxima de vencimento (YYYY-MM-DD)."),
    limit: z.number().int().positive().max(500).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, client_id, due_from, due_to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("financial_records")
      .select(
        "id, client_id, plan_id, client_plan_id, value, original_value, due_date, payment_date, payment_method, status, observations, clients(name, company_name)",
      )
      .order("due_date", { ascending: false })
      .limit(limit ?? 100);
    if (status) q = q.eq("status", status);
    if (client_id) q = q.eq("client_id", client_id);
    if (due_from) q = q.gte("due_date", due_from);
    if (due_to) q = q.lte("due_date", due_to);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { records: data ?? [] },
    };
  },
});
