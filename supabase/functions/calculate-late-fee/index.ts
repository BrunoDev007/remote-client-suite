import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculateLateFeeRequest {
  valorDevido: number;
  dataVencimento: string;
  dataPagamento?: string;
  percentualMulta?: number;
  percentualMoraDiaria?: number;
}

interface CalculateLateFeeResponse {
  valorOriginal: number;
  diasAtraso: number;
  valorMulta: number;
  valorMora: number;
  totalEncargos: number;
  valorFinal: number;
  percentualMulta: number;
  percentualMoraDiaria: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CalculateLateFeeRequest = await req.json();
    
    console.log("Received request:", JSON.stringify(body));

    const { 
      valorDevido, 
      dataVencimento, 
      dataPagamento,
      percentualMulta = 2,
      percentualMoraDiaria = 1
    } = body;

    // Validações
    if (!valorDevido || valorDevido < 0) {
      console.error("Invalid valorDevido:", valorDevido);
      return new Response(
        JSON.stringify({ error: "Valor devido deve ser um número positivo" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dataVencimento) {
      console.error("Missing dataVencimento");
      return new Response(
        JSON.stringify({ error: "Data de vencimento é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse das datas
    const vencimento = new Date(dataVencimento);
    const pagamento = dataPagamento ? new Date(dataPagamento) : new Date();

    // Normalizar as datas para meia-noite UTC para cálculo correto
    vencimento.setUTCHours(0, 0, 0, 0);
    pagamento.setUTCHours(0, 0, 0, 0);

    // Calcular dias em atraso
    const diffTime = pagamento.getTime() - vencimento.getTime();
    const diasAtraso = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    console.log("Dias em atraso:", diasAtraso);

    let valorMulta = 0;
    let valorMora = 0;

    // Aplicar multa e mora apenas se houver atraso
    if (diasAtraso > 0) {
      // Multa: percentual único sobre o valor devido
      valorMulta = valorDevido * (percentualMulta / 100);
      
      // Mora: percentual por dia sobre o valor original
      valorMora = valorDevido * (percentualMoraDiaria / 100) * diasAtraso;
    }

    const totalEncargos = valorMulta + valorMora;
    const valorFinal = valorDevido + totalEncargos;

    const response: CalculateLateFeeResponse = {
      valorOriginal: Number(valorDevido.toFixed(2)),
      diasAtraso,
      valorMulta: Number(valorMulta.toFixed(2)),
      valorMora: Number(valorMora.toFixed(2)),
      totalEncargos: Number(totalEncargos.toFixed(2)),
      valorFinal: Number(valorFinal.toFixed(2)),
      percentualMulta,
      percentualMoraDiaria
    };

    console.log("Response:", JSON.stringify(response));

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar a requisição" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
