
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

  const generateMonthlyRecords = async (year: number, month: number) => {
    try {
      // Buscar todos os planos ativos dos clientes
      const { data: activePlans, error: plansError } = await supabase
        .from('client_plans')
        .select(`
          *,
          clients!inner(id, name, company_name),
          plans!inner(id, name, value)
        `)
        .eq('is_active', true)

      if (plansError) throw plansError

      if (!activePlans || activePlans.length === 0) return

      // Data de vencimento para o mês selecionado (sempre dia do pagamento ou dia 10 como padrão)
      const dueDate = new Date(year, month - 1, 10).toISOString().split('T')[0]

      // Verificar quais registros já existem para este mês
      const startMonth = month.toString().padStart(2, '0')
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const endMonth = nextMonth.toString().padStart(2, '0')

      const { data: existingRecords, error: existingError } = await supabase
        .from('financial_records')
        .select('client_plan_id')
        .gte('due_date', `${year}-${startMonth}-01`)
        .lt('due_date', `${nextYear}-${endMonth}-01`)

      if (existingError) throw existingError

      const existingPlanIds = new Set(existingRecords?.map(r => r.client_plan_id) || [])

      // Criar registros para planos que não têm registro neste mês
      const recordsToCreate = activePlans
        .filter(plan => !existingPlanIds.has(plan.id))
        .map(plan => ({
          client_plan_id: plan.id,
          client_id: plan.client_id,
          plan_id: plan.plan_id,
          value: plan.value,
          original_value: plan.value,
          due_date: dueDate,
          status: 'pendente',
          payment_method: plan.payment_method || 'Não informado'
        }))

      if (recordsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('financial_records')
          .insert(recordsToCreate)

        if (insertError) throw insertError

        console.log(`${recordsToCreate.length} novos registros financeiros criados para ${month}/${year}`)
      }

    } catch (error: any) {
      console.error('Erro ao gerar registros mensais:', error)
    }
  }

  const fetchFinancialRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          clients!inner(name, company_name),
          plans!inner(name)
        `)
        .order('due_date', { ascending: false })

      if (error) throw error
      
      const formattedData = data?.map(record => ({
        ...record,
        client_name: record.clients.company_name || record.clients.name,
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
          clients!inner(name, company_name),
          plans!inner(name)
        `)
        .single()

      if (error) throw error

      const formattedData = {
        ...data,
        client_name: data.clients.company_name || data.clients.name,
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
          clients!inner(name, company_name),
          plans!inner(name)
        `)
        .single()

      if (error) throw error

      const formattedData = {
        ...data,
        client_name: data.clients.company_name || data.clients.name,
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

  const getFilteredRecords = async (filters: {
    searchTerm?: string
    statusFilter?: string
    dateFilter?: string
  }) => {
    // Se há filtro de data, gerar registros para o mês se necessário
    if (filters.dateFilter) {
      const [year, month] = filters.dateFilter.split('-').map(Number)
      await generateMonthlyRecords(year, month)
      
      // Recarregar os registros após gerar novos
      await fetchFinancialRecords()
    }

    return records.filter(record => {
      const matchesSearch = !filters.searchTerm || 
        record.client_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        record.plan_name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      
      const matchesStatus = !filters.statusFilter || 
        filters.statusFilter === "todos" || 
        record.status === filters.statusFilter
      
      const matchesDate = !filters.dateFilter || (() => {
        const recordDate = new Date(record.due_date)
        const filterDate = new Date(filters.dateFilter + "-01")
        return recordDate.getFullYear() === filterDate.getFullYear() && 
               recordDate.getMonth() === filterDate.getMonth()
      })()
      
      return matchesSearch && matchesStatus && matchesDate
    })
  }

  const deleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('financial_records')
        .delete()
        .eq('id', recordId)

      if (error) throw error

      setRecords(records.filter(record => record.id !== recordId))
      toast({
        title: "Conta excluída!",
        description: "A conta pendente foi removida do sistema.",
      })
      return { success: true }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir conta: " + error.message,
      })
      return { success: false, error }
    }
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

  const updateRecordDueDate = async (recordId: string, newDueDate: string) => {
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .update({ due_date: newDueDate })
        .eq('id', recordId)
        .select(`
          *,
          clients!inner(name, company_name),
          plans!inner(name)
        `)
        .single()

      if (error) throw error

      const formattedData = {
        ...data,
        client_name: data.clients.company_name || data.clients.name,
        plan_name: data.plans.name
      }

      setRecords(records.map(record => 
        record.id === recordId ? formattedData : record
      ))

      toast({
        title: "Data atualizada!",
        description: "Data de vencimento foi alterada com sucesso.",
      })
      return { success: true }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar data: " + error.message,
      })
      return { success: false, error }
    }
  }

  return {
    records,
    loading,
    updateRecordStatus,
    updateRecordValue,
    updateRecordDueDate,
    deleteRecord,
    getFilteredRecords,
    getStats,
    refetchRecords: fetchFinancialRecords,
    generateMonthlyRecords
  }
}
