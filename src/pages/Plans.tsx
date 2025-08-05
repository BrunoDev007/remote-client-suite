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
import { usePlans } from "@/hooks/usePlans"
import { useClients } from "@/hooks/useClients"

const formasPagamento = [
  "Dinheiro",
  "PIX",
  "Cartão de Crédito",
  "Cartão de Débito", 
  "Boleto Bancário",
  "Transferência Bancária"
]

export default function Plans() {
  const { 
    plans, 
    clientPlans, 
    loading, 
    createPlan, 
    updatePlan, 
    deletePlan, 
    linkClientToPlan, 
    unlinkClient 
  } = usePlans()
  
  const { clients } = useClients()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("plans")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [planFormData, setPlanFormData] = useState({
    name: "",
    description: "",
    value: 0
  })

  const [linkFormData, setLinkFormData] = useState({
    client_id: "",
    plan_id: "",
    payment_method: "",
    payment_date: "",
    contract_url: ""
  })

  const handleSavePlan = async () => {
    if (!planFormData.name || !planFormData.value) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      })
      return
    }

    if (editingPlan) {
      await updatePlan(editingPlan.id, planFormData)
    } else {
      await createPlan(planFormData)
    }

    setIsDialogOpen(false)
    resetPlanForm()
  }

  const handleLinkClient = async () => {
    if (!linkFormData.client_id || !linkFormData.plan_id || !linkFormData.payment_method || !linkFormData.payment_date) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      })
      return
    }

    await linkClientToPlan(linkFormData)
    setIsLinkDialogOpen(false)
    resetLinkForm()
  }

  const handleUnlinkClient = async (planClientId: string) => {
    await unlinkClient(planClientId)
  }

  const handleDeletePlan = async (id: string) => {
    await deletePlan(id)
  }

  const resetPlanForm = () => {
    setEditingPlan(null)
    setPlanFormData({
      name: "",
      description: "",
      value: 0
    })
  }

  const resetLinkForm = () => {
    setLinkFormData({
      client_id: "",
      plan_id: "",
      payment_method: "",
      payment_date: "",
      contract_url: ""
    })
  }

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPlanClients = clientPlans.filter(pc =>
    pc.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pc.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    )
  }

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
                      value={linkFormData.client_id} 
                      onValueChange={(value) => setLinkFormData({ ...linkFormData, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                       {clients.map(client => (
                           <SelectItem key={client.id} value={client.id}>
                             {client.name}
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Plano</Label>
                     <Select 
                       value={linkFormData.plan_id} 
                       onValueChange={(value) => setLinkFormData({ ...linkFormData, plan_id: value })}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Selecione o plano" />
                       </SelectTrigger>
                       <SelectContent>
                         {plans.map(plan => (
                           <SelectItem key={plan.id} value={plan.id}>
                             {plan.name} - R$ {Number(plan.value).toFixed(2)}
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
                       value={linkFormData.payment_method} 
                       onValueChange={(value) => setLinkFormData({ ...linkFormData, payment_method: value })}
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
                       value={linkFormData.payment_date}
                       onChange={(e) => setLinkFormData({ ...linkFormData, payment_date: e.target.value })}
                     />
                  </div>
                </div>

                 <div className="space-y-2">
                   <Label>URL do Contrato (Opcional)</Label>
                   <Input
                     type="url"
                     placeholder="https://exemplo.com/contrato.pdf"
                     value={linkFormData.contract_url}
                     onChange={(e) => setLinkFormData({ ...linkFormData, contract_url: e.target.value })}
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
                   <Label htmlFor="name">Nome do Plano *</Label>
                   <Input
                     id="name"
                     value={planFormData.name}
                     onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                     placeholder="Ex: Básico, Premium, Empresarial"
                   />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="description">Descrição</Label>
                   <Textarea
                     id="description"
                     value={planFormData.description}
                     onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                     placeholder="Descreva os recursos e benefícios do plano"
                     rows={3}
                   />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="value">Valor Mensal (R$) *</Label>
                   <Input
                     id="value"
                     type="number"
                     step="0.01"
                     min="0"
                     value={planFormData.value || ""}
                     onChange={(e) => setPlanFormData({ ...planFormData, value: parseFloat(e.target.value) || 0 })}
                     placeholder="0.00"
                   />
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
                          <h3 className="font-semibold text-foreground">{plan.name}</h3>
                          <Badge variant="default">
                            Ativo
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {Number(plan.value).toFixed(2)}/mês
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {clientPlans.filter(pc => pc.plan_id === plan.id).length} clientes
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Criado em {new Date(plan.created_at).toLocaleDateString()}
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
                       setPlanFormData({
                         name: plan.name,
                         description: plan.description || "",
                         value: Number(plan.value)
                       })
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
                          <h3 className="font-semibold text-foreground">{planClient.client_name}</h3>
                          <Badge variant="default">{planClient.plan_name}</Badge>
                          <Badge variant="default">
                            Ativo
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {Number(planClient.value).toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {planClient.payment_method}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Vence dia {new Date(planClient.payment_date).getDate()}
                          </div>
                          {planClient.contract_url && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <a href={planClient.contract_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
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
                  {plans.length} ativos
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
                <div className="text-3xl font-bold text-primary">{clientPlans.length}</div>
                <p className="text-muted-foreground text-sm">
                  {clientPlans.length} ativos
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
                  R$ {clientPlans.reduce((sum, pc) => sum + Number(pc.value), 0).toFixed(2)}
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
                  const linkedClients = clientPlans.filter(pc => pc.plan_id === plan.id)
                  const revenue = linkedClients.reduce((sum, pc) => sum + Number(pc.value), 0)
                  
                  return (
                    <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {Number(plan.value).toFixed(2)}/mês</p>
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