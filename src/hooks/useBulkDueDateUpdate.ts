import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BulkUpdateResult {
  success: boolean;
  updatedCount: number;
  affectedRecords?: {
    id: string;
    oldDueDate: string;
    newDueDate: string;
  }[];
  error?: string;
}

export interface FutureRecordsPreview {
  count: number;
  records: {
    id: string;
    due_date: string;
  }[];
}

export function useBulkDueDateUpdate() {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<FutureRecordsPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewFutureRecords = async (recordId: string, clientPlanId: string, currentDueDate: string): Promise<FutureRecordsPreview | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Buscar registros futuros do mesmo client_plan_id
      const { data, error: fetchError } = await supabase
        .from('financial_records')
        .select('id, due_date')
        .eq('client_plan_id', clientPlanId)
        .neq('id', recordId)
        .eq('status', 'pendente')
        .gt('due_date', currentDueDate)
        .order('due_date', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const preview: FutureRecordsPreview = {
        count: data?.length || 0,
        records: data || []
      };

      setPreviewData(preview);
      return preview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar registros futuros';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDueDateBulk = async (
    recordId: string,
    newDueDate: string,
    applyToFuture: boolean
  ): Promise<BulkUpdateResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('bulk-update-due-date', {
        body: {
          recordId,
          newDueDate,
          applyToFuture
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao atualizar');
      }

      return data as BulkUpdateResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar datas';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPreviewData(null);
    setError(null);
  };

  return {
    previewFutureRecords,
    updateDueDateBulk,
    reset,
    previewData,
    isLoading,
    error
  };
}
