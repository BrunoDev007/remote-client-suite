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
  name: "list_client_plans",
  title: "Listar planos de clientes",
  description: "Lista os vínculos de planos com clientes (contratos ativos e inativos).",
  inputSchema: {
    client_id: z.string().uuid().optional(),
    only_active: z.boolean().optional().describe("Apenas contratos ativos."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ client_id, only_active }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("client_plans")
      .select(
        "id, client_id, plan_id, value, payment_date, payment_method, start_date, end_date, is_active, clients(name, company_name), plans(name)",
      )
      .order("created_at", { ascending: false });
    if (client_id) q = q.eq("client_id", client_id);
    if (only_active) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { client_plans: data ?? [] },
    };
  },
});
