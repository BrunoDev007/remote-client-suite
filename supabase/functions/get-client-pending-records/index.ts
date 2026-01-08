import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientPendingRecord {
  id: string;
  client_id: string;
  client_name: string;
  plan_name: string;
  value: number;
  due_date: string;
  status: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');

    console.log("Fetching pending records for client:", clientId);

    // Query base - buscar registros pendentes
    let query = supabase
      .from('financial_records')
      .select(`
        id,
        client_id,
        value,
        due_date,
        status,
        clients!inner(name, company_name),
        plans!inner(name)
      `)
      .eq('status', 'pendente')
      .order('due_date', { ascending: true });

    // Se um clientId foi especificado, filtrar por ele
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching records:", error);
      throw error;
    }

    // Formatar os dados
    const formattedRecords: ClientPendingRecord[] = (data || []).map((record: any) => ({
      id: record.id,
      client_id: record.client_id,
      client_name: record.clients.company_name || record.clients.name,
      plan_name: record.plans.name,
      value: Number(record.value),
      due_date: record.due_date,
      status: record.status
    }));

    console.log(`Found ${formattedRecords.length} pending records`);

    return new Response(
      JSON.stringify({ records: formattedRecords }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao buscar registros pendentes" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
