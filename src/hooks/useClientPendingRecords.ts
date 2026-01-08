import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientPendingRecord {
  id: string;
  client_id: string;
  client_name: string;
  plan_name: string;
  value: number;
  due_date: string;
  status: string;
}

export function useClientPendingRecords() {
  const [records, setRecords] = useState<ClientPendingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingRecords = async (clientId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
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

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const formattedRecords: ClientPendingRecord[] = (data || []).map((record: any) => ({
        id: record.id,
        client_id: record.client_id,
        client_name: record.clients.company_name || record.clients.name,
        plan_name: record.plans.name,
        value: Number(record.value),
        due_date: record.due_date,
        status: record.status
      }));

      setRecords(formattedRecords);
      return formattedRecords;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar registros';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setRecords([]);
    setError(null);
  };

  return {
    records,
    fetchPendingRecords,
    reset,
    isLoading,
    error
  };
}
