import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkUpdateRequest {
  recordId: string;
  newDueDate: string;
  applyToFuture: boolean;
  userId?: string;
}

interface UpdateResult {
  success: boolean;
  updatedCount: number;
  affectedRecords?: {
    id: string;
    oldDueDate: string;
    newDueDate: string;
  }[];
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: BulkUpdateRequest = await req.json();
    console.log("Received bulk update request:", JSON.stringify(body));

    const { recordId, newDueDate, applyToFuture, userId } = body;

    if (!recordId || !newDueDate) {
      return new Response(
        JSON.stringify({ success: false, error: "recordId e newDueDate são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar o registro original
    const { data: originalRecord, error: fetchError } = await supabase
      .from('financial_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (fetchError || !originalRecord) {
      console.error("Error fetching original record:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Registro não encontrado" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o registro pode ser alterado (não pode ser quitado)
    if (originalRecord.status === 'quitado') {
      return new Response(
        JSON.stringify({ success: false, error: "Não é possível alterar registros quitados" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const affectedRecords: { id: string; oldDueDate: string; newDueDate: string }[] = [];
    const oldDueDate = originalRecord.due_date;
    const newDueDateObj = new Date(newDueDate);
    const newDay = newDueDateObj.getUTCDate();

    // Atualizar o registro original
    const { error: updateError } = await supabase
      .from('financial_records')
      .update({ due_date: newDueDate })
      .eq('id', recordId);

    if (updateError) {
      console.error("Error updating original record:", updateError);
      throw updateError;
    }

    affectedRecords.push({
      id: recordId,
      oldDueDate,
      newDueDate
    });

    // Se applyToFuture for true, atualizar registros futuros
    if (applyToFuture) {
      // Buscar registros futuros do mesmo client_plan_id que estão pendentes
      const { data: futureRecords, error: futureError } = await supabase
        .from('financial_records')
        .select('id, due_date')
        .eq('client_plan_id', originalRecord.client_plan_id)
        .neq('id', recordId)
        .eq('status', 'pendente')
        .gt('due_date', oldDueDate)
        .order('due_date', { ascending: true });

      if (futureError) {
        console.error("Error fetching future records:", futureError);
      } else if (futureRecords && futureRecords.length > 0) {
        for (const record of futureRecords) {
          const recordDate = new Date(record.due_date);
          // Manter o mesmo dia do mês da nova data (cálculo direto em UTC)
          const year = recordDate.getUTCFullYear();
          const month = recordDate.getUTCMonth();
          const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
          const adjustedDay = Math.min(newDay, lastDayOfMonth);
          const newRecordDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(adjustedDay).padStart(2, '0')}`;

          const { error: updateFutureError } = await supabase
            .from('financial_records')
            .update({ due_date: newRecordDateStr })
            .eq('id', record.id);

          if (!updateFutureError) {
            affectedRecords.push({
              id: record.id,
              oldDueDate: record.due_date,
              newDueDate: newRecordDateStr
            });
          }
        }
      }
    }

    // Log de auditoria (console para agora, pode ser expandido para tabela de auditoria)
    console.log("Audit log:", {
      userId,
      timestamp: new Date().toISOString(),
      action: 'bulk_due_date_update',
      originalRecordId: recordId,
      oldDueDate,
      newDueDate,
      applyToFuture,
      recordsUpdated: affectedRecords.length
    });

    const result: UpdateResult = {
      success: true,
      updatedCount: affectedRecords.length,
      affectedRecords
    };

    console.log("Update result:", JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao processar a requisição" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
