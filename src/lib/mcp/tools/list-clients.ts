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
  name: "list_clients",
  title: "Listar clientes",
  description: "Lista os clientes cadastrados (razão social, CNPJ/CPF, contatos).",
  inputSchema: {
    search: z.string().optional().describe("Filtro por nome, razão social ou CNPJ."),
    limit: z.number().int().positive().max(200).optional().describe("Máximo de registros (padrão 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("clients")
      .select("id, code, name, company_name, fantasy_name, cnpj, cpf, email, phone, city, state, client_type")
      .order("name")
      .limit(limit ?? 50);
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(`name.ilike.${s},company_name.ilike.${s},fantasy_name.ilike.${s},cnpj.ilike.${s}`);
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { clients: data ?? [] },
    };
  },
});
