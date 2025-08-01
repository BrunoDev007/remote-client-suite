import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/integrations/supabase/types'

type RemoteAccess = Database['public']['Tables']['remote_access']['Row']
type RemoteAccessInsert = Database['public']['Tables']['remote_access']['Insert']

export function useRemoteAccess() {
  const [accesses, setAccesses] = useState<RemoteAccess[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRemoteAccesses()
  }, [])

  const fetchRemoteAccesses = async () => {
    try {
      const { data, error } = await supabase
        .from('remote_access')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccesses(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar acessos remotos: " + error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const createAccess = async (accessData: Omit<RemoteAccessInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('remote_access')
        .insert([accessData])
        .select()
        .single()

      if (error) throw error

      setAccesses([data, ...accesses])
      toast({
        title: "Acesso cadastrado!",
        description: "Novo acesso remoto foi adicionado.",
      })
      return { success: true, data }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar acesso: " + error.message,
      })
      return { success: false, error }
    }
  }

  const updateAccess = async (id: string, accessData: Partial<RemoteAccessInsert>) => {
    try {
      const { data, error } = await supabase
        .from('remote_access')
        .update(accessData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setAccesses(accesses.map(access => access.id === id ? data : access))
      toast({
        title: "Acesso atualizado!",
        description: "As informações de acesso foram atualizadas.",
      })
      return { success: true, data }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar acesso: " + error.message,
      })
      return { success: false, error }
    }
  }

  const deleteAccess = async (id: string) => {
    try {
      const { error } = await supabase
        .from('remote_access')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAccesses(accesses.filter(access => access.id !== id))
      toast({
        title: "Acesso removido!",
        description: "Acesso foi removido.",
      })
      return { success: true }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir acesso: " + error.message,
      })
      return { success: false, error }
    }
  }

  const getFilteredAccesses = (filters: {
    searchTerm?: string
    selectedClient?: string
  }) => {
    return accesses.filter(access => {
      const matchesSearch = !filters.searchTerm || 
        access.computer_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        access.access_id.includes(filters.searchTerm)
      
      const matchesClient = !filters.selectedClient || 
        access.client_id === filters.selectedClient
      
      return matchesSearch && matchesClient
    })
  }

  return {
    accesses,
    loading,
    createAccess,
    updateAccess,
    deleteAccess,
    getFilteredAccesses,
    refetchAccesses: fetchRemoteAccesses
  }
}