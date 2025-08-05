import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/integrations/supabase/types'

type Plan = Database['public']['Tables']['plans']['Row']
type PlanInsert = Database['public']['Tables']['plans']['Insert']
type ClientPlan = Database['public']['Tables']['client_plans']['Row'] & {
  client_name: string
  plan_name: string
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPlans()
    fetchClientPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlans(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar planos: " + error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClientPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('client_plans')
        .select(`
          *,
          clients!inner(name),
          plans!inner(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const formattedData = data?.map(item => ({
        ...item,
        client_name: item.clients.name,
        plan_name: item.plans.name
      })) || []
      
      setClientPlans(formattedData)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar vinculações: " + error.message,
      })
    }
  }

  const createPlan = async (planData: Omit<PlanInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .insert([planData])
        .select()
        .single()

      if (error) throw error

      setPlans([data, ...plans])
      toast({
        title: "Plano cadastrado!",
        description: "Novo plano foi adicionado com sucesso.",
      })
      return { success: true, data }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar plano: " + error.message,
      })
      return { success: false, error }
    }
  }

  const updatePlan = async (id: string, planData: Partial<PlanInsert>) => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .update(planData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setPlans(plans.map(plan => plan.id === id ? data : plan))
      
      // Refresh client plans to get updated values
      await fetchClientPlans()
      
      toast({
        title: "Plano atualizado!",
        description: "O plano foi atualizado e os valores dos clientes vinculados foram atualizados.",
      })
      return { success: true, data }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar plano: " + error.message,
      })
      return { success: false, error }
    }
  }

  const deletePlan = async (id: string) => {
    try {
      // Check if plan has linked clients
      const { data: linkedClients } = await supabase
        .from('client_plans')
        .select('id')
        .eq('plan_id', id)
        .eq('is_active', true)

      if (linkedClients && linkedClients.length > 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não é possível excluir um plano com clientes vinculados.",
        })
        return { success: false }
      }

      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPlans(plans.filter(plan => plan.id !== id))
      toast({
        title: "Plano removido!",
        description: "O plano foi removido do sistema.",
      })
      return { success: true }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir plano: " + error.message,
      })
      return { success: false, error }
    }
  }

  const linkClientToPlan = async (linkData: {
    client_id: string
    plan_id: string
    payment_method: string
    payment_date: string
    contract_url?: string
  }) => {
    try {
      // Get plan data for value
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('value')
        .eq('id', linkData.plan_id)
        .single()

      if (planError) throw planError

      const { data, error } = await supabase
        .from('client_plans')
        .insert([{
          ...linkData,
          value: planData.value
        }])
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

      setClientPlans([formattedData, ...clientPlans])
      
      // Create financial record
      await createFinancialRecord(linkData.client_id, linkData.plan_id, data.id, planData.value, linkData)
      
      toast({
        title: "Cliente vinculado!",
        description: `Cliente foi vinculado ao plano com sucesso.`,
      })
      return { success: true, data: formattedData }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao vincular cliente: " + error.message,
      })
      return { success: false, error }
    }
  }

  const unlinkClient = async (clientPlanId: string) => {
    try {
      const { error } = await supabase
        .from('client_plans')
        .update({ is_active: false })
        .eq('id', clientPlanId)

      if (error) throw error

      setClientPlans(clientPlans.filter(cp => cp.id !== clientPlanId))
      toast({
        title: "Cliente desvinculado!",
        description: "Cliente foi desvinculado do plano.",
      })
      return { success: true }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao desvincular cliente: " + error.message,
      })
      return { success: false, error }
    }
  }

  const createFinancialRecord = async (clientId: string, planId: string, clientPlanId: string, value: number, linkData: {
    client_id: string
    plan_id: string
    payment_method: string
    payment_date: string
    contract_url?: string
  }) => {
    try {
      // Calculate next due date (30 days from payment date)
      const paymentDate = new Date(linkData.payment_date)
      const dueDate = new Date(paymentDate)
      dueDate.setMonth(dueDate.getMonth() + 1)

      const { error } = await supabase
        .from('financial_records')
        .insert([{
          client_id: clientId,
          plan_id: planId,
          client_plan_id: clientPlanId,
          value: value,
          original_value: value,
          due_date: dueDate.toISOString().split('T')[0],
          payment_method: linkData.payment_method,
          status: 'pendente'
        }])

      if (error) throw error
    } catch (error: any) {
      console.error('Erro ao criar registro financeiro:', error)
    }
  }

  return {
    plans,
    clientPlans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    linkClientToPlan,
    unlinkClient,
    refetchPlans: fetchPlans,
    refetchClientPlans: fetchClientPlans
  }
}