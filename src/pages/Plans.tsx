import { useState } from "react"
import { Plus, Search, Edit, Trash2, CreditCard, Users, FileText, Link, Unlink, DollarSign, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface Plan {
  id: number
  nome: string
  descricao: string
  valor: number
  status: "ativo" | "inativo"
  createdAt: string
}

interface PlanClient {
  id: number
  clientId: number
  planId: number
  clientName: string
  planName: string
  formaPagamento: string
  dataPagamento: string
  valor: number
  contratoUrl?: string
  status: "ativo" | "inativo"
  vinculadoEm: string
}

const formasPagamento = [
  "Dinheiro",
  "PIX",
  "Cartão de Crédito",
  "Cartão de Débito", 
  "Boleto Bancário",
  "Transferência Bancária"
]

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: 1,
      nome: "Básico",
      descricao: "Plano básico com suporte essencial",
      valor: 59.90,
      status: "ativo",
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      nome: "Premium",
      descricao: "Plano premium com recursos avançados",
      valor: 129.90,
      status: "ativo",
      createdAt: "2024-01-15"
    }
  ])

  const [planClients, setPlanClients] = useState<PlanClient[]>([
    {
      id: 1,
      clientId: 1,
      planId: 1,
      clientName: "João Silva",
      planName: "Básico",
      formaPagamento: "PIX",
      dataPagamento: "2024-01-25",
      valor: 59.90,
      status: "ativo",
      vinculadoEm: "2024-01-15"
    }
  ])

  const [activeTab, setActiveTab] = useState("plans")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [planFormData, setPlanFormData] = useState<Partial<Plan>>({
    nome: "",
    descricao: "",
    valor: 0,
    status: "ativo"
  })

  const [linkFormData, setLinkFormData] = useState({
    clientId: "",
    planId: "",
    formaPagamento: "",
    dataPagamento: "",
    contratoFile: null as File | null
  })

  const { toast } = useToast()

  // Mock clients data
  const mockClients = [
    { id: 1, nome: "João Silva" },
    { id: 2, nome: "Maria Santos" },
    { id: 3, nome: "Pedro Oliveira" }
  ]

  const handleSavePlan = () => {
    if (!planFormData.nome || !planFormData.valor) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      })
      return
    }

    if (editingPlan) {
      const updatedPlans = plans.map(plan => 
        plan.id === editingPlan.id 
          ? { ...editingPlan, ...planFormData }
          : plan
      )
      setPlans(updatedPlans)
      
      // Atualizar valor nos clientes vinculados
      setPlanClients(planClients.map(pc => 
        pc.planId === editingPlan.id 
          ? { ...pc, valor: planFormData.valor || pc.valor, planName: planFormData.nome || pc.planName }
          : pc
      ))
      
      toast({
        title: "Plano atualizado!",
        description: "O plano foi atualizado e os valores dos clientes vinculados foram atualizados.",
      })
    } else {
      const newPlan: Plan = {
        id: Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
        ...planFormData as Plan
      }
      setPlans([...plans, newPlan])
      toast({
        title: "Plano cadastrado!",
        description: "Novo plano foi adicionado com sucesso.",
      })
    }

    setIsDialogOpen(false)
    resetPlanForm()
  }

  const handleLinkClient = () => {
    if (!linkFormData.clientId || !linkFormData.planId || !linkFormData.formaPagamento || !linkFormData.dataPagamento) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      })
      return
    }

    const client = mockClients.find(c => c.id === parseInt(linkFormData.clientId))
    const plan = plans.find(p => p.id === parseInt(linkFormData.planId))

    if (!client || !plan) return

    const newPlanClient: PlanClient = {
      id: Date.now(),
      clientId: client.id,
      planId: plan.id,
      clientName: client.nome,
      planName: plan.nome,
      formaPagamento: linkFormData.formaPagamento,
      dataPagamento: linkFormData.dataPagamento,
      valor: plan.valor,
      status: "ativo",
      vinculadoEm: new Date().toISOString().split('T')[0],
      contratoUrl: linkFormData.contratoFile ? URL.createObjectURL(linkFormData.contratoFile) : undefined
    }

    setPlanClients([...planClients, newPlanClient])
    setIsLinkDialogOpen(false)
    resetLinkForm()
    
    toast({
      title: "Cliente vinculado!",
      description: `${client.nome} foi vinculado ao plano ${plan.nome}.`,
    })
  }

  const handleUnlinkClient = (planClientId: number) => {
    const planClient = planClients.find(pc => pc.id === planClientId)
    setPlanClients(planClients.filter(pc => pc.id !== planClientId))
    
    toast({
      title: "Cliente desvinculado!",
      description: `${planClient?.clientName} foi desvinculado do plano.`,
    })
  }

  const handleDeletePlan = (id: number) => {
    const linkedClients = planClients.filter(pc => pc.planId === id)
    if (linkedClients.length > 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não é possível excluir um plano com clientes vinculados.",
      })
      return
    }

    setPlans(plans.filter(plan => plan.id !== id))
    toast({
      title: "Plano removido!",
      description: "O plano foi removido do sistema.",
    })
  }

  const resetPlanForm = () => {
    setEditingPlan(null)
    setPlanFormData({
      nome: "",
      descricao: "",
      valor: 0,
      status: "ativo"
    })
  }

  const resetLinkForm = () => {
    setLinkFormData({
      clientId: "",
      planId: "",
      formaPagamento: "",
      dataPagamento: "",
      contratoFile: null
    })
  }

  const filteredPlans = plans.filter(plan =>
    plan.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPlanClients = planClients.filter(pc =>
    pc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pc.planName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planos</h1>
          <p className="text-muted-foreground">Gerencie planos e vinculações de clientes</p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetLinkForm}>
                <Link className="h-4 w-4 mr-2" />
                Vincular Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vincular Cliente ao Plano</DialogTitle>
                <DialogDescription>
                  Selecione um cliente e plano para realizar a vinculação
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select 
                      value={linkFormData.clientId} 
                      onValueChange={(value) => setLinkFormData({ ...linkFormData, clientId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockClients.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Plano</Label>
                    <Select 
                      value={linkFormData.planId} 
                      onValueChange={(value) => setLinkFormData({ ...linkFormData, planId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.filter(p => p.status === "ativo").map(plan => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.nome} - R$ {plan.valor.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select 
                      value={linkFormData.formaPagamento} 
                      onValueChange={(value) => setLinkFormData({ ...linkFormData, formaPagamento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPagamento.map(forma => (
                          <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Pagamento</Label>
                    <Input
                      type="date"
                      value={linkFormData.dataPagamento}
                      onChange={(e) => setLinkFormData({ ...linkFormData, dataPagamento: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contrato (Opcional)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setLinkFormData({ ...linkFormData, contratoFile: e.target.files?.[0] || null })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleLinkClient} variant="premium">
                    Vincular
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="premium" onClick={resetPlanForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Editar Plano" : "Novo Plano"}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan ? "Altere os dados do plano" : "Preencha os dados do novo plano"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Plano *</Label>
                  <Input
                    id="nome"
                    value={planFormData.nome || ""}
                    onChange={(e) => setPlanFormData({ ...planFormData, nome: e.target.value })}
                    placeholder="Ex: Básico, Premium, Empresarial"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={planFormData.descricao || ""}
                    onChange={(e) => setPlanFormData({ ...planFormData, descricao: e.target.value })}
                    placeholder="Descreva os recursos e benefícios do plano"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor Mensal (R$) *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={planFormData.valor || ""}
                      onChange={(e) => setPlanFormData({ ...planFormData, valor: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={planFormData.status || "ativo"} 
                      onValueChange={(value) => setPlanFormData({ ...planFormData, status: value as "ativo" | "inativo" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePlan} variant="premium">
                    {editingPlan ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="linked">Clientes Vinculados</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar planos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Plans List */}
          <div className="grid gap-4">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-card transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary-foreground" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{plan.nome}</h3>
                          <Badge variant={plan.status === "ativo" ? "default" : "secondary"}>
                            {plan.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.descricao}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {plan.valor.toFixed(2)}/mês
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {planClients.filter(pc => pc.planId === plan.id).length} clientes
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Criado em {new Date(plan.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPlan(plan)
                          setPlanFormData(plan)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="linked" className="space-y-4">
          {/* Search for linked clients */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar clientes vinculados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Linked Clients List */}
          <div className="grid gap-4">
            {filteredPlanClients.map((planClient) => (
              <Card key={planClient.id} className="hover:shadow-card transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary-foreground" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{planClient.clientName}</h3>
                          <Badge variant="default">{planClient.planName}</Badge>
                          <Badge variant={planClient.status === "ativo" ? "default" : "secondary"}>
                            {planClient.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {planClient.valor.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {planClient.formaPagamento}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Vence dia {new Date(planClient.dataPagamento).getDate()}
                          </div>
                          {planClient.contratoUrl && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <a href={planClient.contratoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                Contrato
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnlinkClient(planClient.id)}
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Desvincular
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPlanClients.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Nenhum cliente vinculado</h3>
                <p className="text-muted-foreground">
                  Comece vinculando clientes aos planos disponíveis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Total de Planos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{plans.length}</div>
                <p className="text-muted-foreground text-sm">
                  {plans.filter(p => p.status === "ativo").length} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes Vinculados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{planClients.length}</div>
                <p className="text-muted-foreground text-sm">
                  {planClients.filter(pc => pc.status === "ativo").length} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Receita Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  R$ {planClients.filter(pc => pc.status === "ativo").reduce((sum, pc) => sum + pc.valor, 0).toFixed(2)}
                </div>
                <p className="text-muted-foreground text-sm">
                  Estimativa mensal
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Relatório de Planos</CardTitle>
              <CardDescription>Lista detalhada de todos os planos e estatísticas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map(plan => {
                  const linkedClients = planClients.filter(pc => pc.planId === plan.id)
                  const revenue = linkedClients.reduce((sum, pc) => sum + pc.valor, 0)
                  
                  return (
                    <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{plan.nome}</h4>
                        <p className="text-sm text-muted-foreground">{plan.descricao}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {plan.valor.toFixed(2)}/mês</p>
                        <p className="text-sm text-muted-foreground">
                          {linkedClients.length} clientes • R$ {revenue.toFixed(2)} total
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}