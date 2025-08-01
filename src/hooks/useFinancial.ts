import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/integrations/supabase/types'

type FinancialRecord = Database['public']['Tables']['financial_records']['Row'] & {
  client_name: string
  plan_name: string
}

export function useFinancial() {
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchFinancialRecords()
  }, [])

  const fetchFinancialRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          clients!inner(name),
          plans!inner(name)
        `)
        .order('due_date', { ascending: false })

      if (error) throw error
      
      const formattedData = data?.map(record => ({
        ...record,
        client_name: record.clients.name,
        plan_name: record.plans.name
      })) || []
      
      setRecords(formattedData)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar registros financeiros: " + error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const updateRecordStatus = async (recordId: string, status: 'quitado' | 'pendente') => {
    try {
      const updateData: any = { status }
      
      if (status === 'quitado') {
        updateData.payment_date = new Date().toISOString().split('T')[0]
      } else {
        updateData.payment_date = null
      }

      const { data, error } = await supabase
        .from('financial_records')
        .update(updateData)
        .eq('id', recordId)
        .select(`
          *,
          clients!inner(name),
          plans!inner(name)
        `)
        .single()

      if (error) throw error

      const formattedData = {
        ...data,
        client_name: data.clients.name,
        plan_name: data.plans.name
      }

      setRecords(records.map(record => 
        record.id === recordId ? formattedData : record
      ))

      const actionText = status === 'quitado' ? 'quitado' : 'desquitado'
      toast({
        title: `Pagamento ${actionText}!`,
        description: `Conta foi marcada como ${status}.`,
      })
      return { success: true }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar status: " + error.message,
      })
      return { success: false, error }
    }
  }

  const updateRecordValue = async (recordId: string, newValue: number, reason: string) => {
    try {
      const record = records.find(r => r.id === recordId)
      if (!record) throw new Error('Registro não encontrado')

      const observations = `Valor alterado de R$ ${record.original_value.toFixed(2)} para R$ ${newValue.toFixed(2)}. Motivo: ${reason}`

      const { data, error } = await supabase
        .from('financial_records')
        .update({
          value: newValue,
          change_reason: reason,
          observations
        })
        .eq('id', recordId)
        .select(`
          *,
          clients!inner(name),
          plans!inner(name)
        `)
        .single()

      if (error) throw error

      const formattedData = {
        ...data,
        client_name: data.clients.name,
        plan_name: data.plans.name
      }

      setRecords(records.map(record => 
        record.id === recordId ? formattedData : record
      ))

      toast({
        title: "Valor atualizado!",
        description: "Valor da conta foi alterado com sucesso.",
      })
      return { success: true }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar valor: " + error.message,
      })
      return { success: false, error }
    }
  }

  const getFilteredRecords = (filters: {
    searchTerm?: string
    statusFilter?: string
    dateFilter?: string
  }) => {
    return records.filter(record => {
      const matchesSearch = !filters.searchTerm || 
        record.client_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        record.plan_name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      
      const matchesStatus = !filters.statusFilter || 
        filters.statusFilter === "todos" || 
        record.status === filters.statusFilter
      
      const matchesDate = !filters.dateFilter || 
        record.due_date.includes(filters.dateFilter)
      
      return matchesSearch && matchesStatus && matchesDate
    })
  }

  const getStats = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    const recordsWithStatus = records.map(record => {
      if (record.status === 'pendente' && record.due_date < today) {
        return { ...record, status: 'atrasado' as const }
      }
      return record
    })

    return {
      total: records.length,
      quitados: recordsWithStatus.filter(r => r.status === 'quitado').length,
      pendentes: recordsWithStatus.filter(r => r.status === 'pendente').length,
      atrasados: recordsWithStatus.filter(r => r.status === 'atrasado' || (r.status === 'pendente' && r.due_date < today)).length,
      totalReceita: recordsWithStatus.filter(r => r.status === 'quitado').reduce((sum, r) => sum + Number(r.value), 0),
      totalPendente: recordsWithStatus.filter(r => r.status !== 'quitado').reduce((sum, r) => sum + Number(r.value), 0)
    }
  }

  return {
    records,
    loading,
    updateRecordStatus,
    updateRecordValue,
    getFilteredRecords,
    getStats,
    refetchRecords: fetchFinancialRecords
  }
}