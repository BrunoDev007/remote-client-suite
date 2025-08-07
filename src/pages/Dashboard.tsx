import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, DollarSign, Monitor, TrendingUp, AlertCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface DashboardStats {
  totalClients: number
  activePlans: number
  totalReceivable: number
  paidAmount: number
  overdueAmount: number
  recentRemoteAccess: any[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activePlans: 0,
    totalReceivable: 0,
    paidAmount: 0,
    overdueAmount: 0,
    recentRemoteAccess: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get total clients
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      // Get active plans
      const { count: plansCount } = await supabase
        .from('client_plans')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Get financial data with due date
      const { data: financialData } = await supabase
        .from('financial_records')
        .select('value, status, due_date')

      // Get recent remote access
      const { data: recentAccess } = await supabase
        .from('remote_access')
        .select(`
          *,
          clients (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Calculate financial stats
      let totalReceivable = 0
      let paidAmount = 0
      let overdueAmount = 0
      const today = new Date().toISOString().split('T')[0]

      financialData?.forEach(record => {
        if (record.status === 'quitado') {
          paidAmount += parseFloat(record.value.toString())
        } else if (record.status === 'pendente') {
          // Check if it's overdue
          if (record.due_date < today) {
            overdueAmount += parseFloat(record.value.toString())
          } else {
            totalReceivable += parseFloat(record.value.toString())
          }
        } else if (record.status === 'atrasado') {
          overdueAmount += parseFloat(record.value.toString())
        }
      })

      setStats({
        totalClients: clientsCount || 0,
        activePlans: plansCount || 0,
        totalReceivable,
        paidAmount,
        overdueAmount,
        recentRemoteAccess: recentAccess || []
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-card transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planos Ativos</p>
                <p className="text-2xl font-bold text-foreground">{stats.activePlans}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Recebida</p>
                <p className="text-2xl font-bold text-success">R$ {stats.paidAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Atraso</p>
                <p className="text-2xl font-bold text-destructive">R$ {stats.overdueAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Situação Financeira
            </CardTitle>
            <CardDescription>Resumo dos valores financeiros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">A Receber</span>
              <span className="font-medium">R$ {stats.totalReceivable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Recebido</span>
              <span className="font-medium text-success">R$ {stats.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Em Atraso</span>
              <span className="font-medium text-destructive">R$ {stats.overdueAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Últimos Acessos Remotos
            </CardTitle>
            <CardDescription>Acessos remotos cadastrados recentemente</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentRemoteAccess.length > 0 ? (
              <div className="space-y-3">
                {stats.recentRemoteAccess.map((access, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{access.clients?.name}</p>
                      <p className="text-sm text-muted-foreground">{access.computer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{access.access_id}</p>
                      <p className="text-xs text-muted-foreground">{access.application_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum acesso remoto cadastrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}