import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LateFeeResult {
  valorOriginal: number;
  diasAtraso: number;
  valorMulta: number;
  valorMora: number;
  totalEncargos: number;
  valorFinal: number;
  percentualMulta: number;
  percentualMoraDiaria: number;
}

export interface LateFeeInput {
  valorDevido: number;
  dataVencimento: string;
  dataPagamento?: string;
  percentualMulta?: number;
  percentualMoraDiaria?: number;
}

export function useLateFeeCalculator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LateFeeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = async (input: LateFeeInput): Promise<LateFeeResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calculate-late-fee', {
        body: input
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    calculate,
    reset,
    result,
    isLoading,
    error
  };
}
