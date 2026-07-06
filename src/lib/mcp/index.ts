import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listClientsTool from "./tools/list-clients";
import listPlansTool from "./tools/list-plans";
import listClientPlansTool from "./tools/list-client-plans";
import listFinancialRecordsTool from "./tools/list-financial-records";
import financialSummaryTool from "./tools/financial-summary";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "gerenciador-online-mcp",
  title: "Gerenciador Online MCP",
  version: "0.1.0",
  instructions:
    "Ferramentas para consultar clientes, planos, contratos e situação financeira do Gerenciador Online. Use list_clients para buscar clientes, list_plans e list_client_plans para planos e contratos, e list_financial_records/financial_summary para dados financeiros.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listClientsTool,
    listPlansTool,
    listClientPlansTool,
    listFinancialRecordsTool,
    financialSummaryTool,
  ],
});
