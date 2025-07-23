import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Search, Edit, Trash2, User, Building, Phone, Mail, MapPin, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Client {
  id: string
  code: number
  client_type: "fisica" | "juridica"
  name: string
  birth_date?: string
  phone?: string
  cep?: string
  address?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  email?: string
  
  // Pessoa Física
  cpf?: string
  rg?: string
  
  // Pessoa Jurídica
  company_name?: string
  fantasy_name?: string
  cnpj?: string
  state_registration?: string
  
  created_at?: string
  updated_at?: string
}

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientType, setClientType] = useState<"fisica" | "juridica">("fisica")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<Partial<Client>>({})
  const { toast } = useToast()

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('code', { ascending: true })

      if (error) throw error

      setClients((data || []) as Client[])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async () => {
    try {
      if (!formData.name || !formData.phone || !formData.email) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Preencha todos os campos obrigatórios (nome, telefone e e-mail).",
        })
        return
      }

      const clientData = {
        client_type: clientType,
        name: formData.name,
        birth_date: formData.birth_date,
        phone: formData.phone,
        cep: formData.cep,
        address: formData.address,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        email: formData.email,
        cpf: formData.cpf,
        rg: formData.rg,
        company_name: formData.company_name,
        fantasy_name: formData.fantasy_name,
        cnpj: formData.cnpj,
        state_registration: formData.state_registration
      }

      const { error } = await supabase
        .from('clients')
        .insert([clientData])

      if (error) throw error

      await loadClients()
      setShowAddDialog(false)
      setFormData({})
      
      toast({
        title: "Cliente adicionado!",
        description: `${formData.name} foi adicionado com sucesso.`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar cliente",
        description: error.message,
      })
    }
  }

  const handleEditClient = async () => {
    if (!selectedClient) return

    try {
      const { error } = await supabase
        .from('clients')
        .update(formData)
        .eq('id', selectedClient.id)

      if (error) throw error

      await loadClients()
      setShowEditDialog(false)
      setSelectedClient(null)
      setFormData({})
      
      toast({
        title: "Cliente atualizado!",
        description: "As alterações foram salvas com sucesso.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar cliente",
        description: error.message,
      })
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      const clientToDelete = clients.find(c => c.id === clientId)
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error

      await loadClients()
      
      toast({
        title: "Cliente removido!",
        description: `${clientToDelete?.name} foi removido do sistema.`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover cliente",
        description: error.message,
      })
    }
  }

  const openAddDialog = () => {
    setFormData({})
    setClientType("fisica")
    setShowAddDialog(true)
  }

  const openEditDialog = (client: Client) => {
    setSelectedClient(client)
    setFormData(client)
    setClientType(client.client_type)
    setShowEditDialog(true)
  }

  const openViewDialog = (client: Client) => {
    setSelectedClient(client)
    setShowViewDialog(true)
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf?.includes(searchTerm) ||
    client.cnpj?.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e suas informações</p>
        </div>
        
        <Button variant="premium" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, e-mail, CPF ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <div className="grid gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-card transition-smooth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    {client.client_type === "fisica" ? (
                      <User className="h-6 w-6 text-primary-foreground" />
                    ) : (
                      <Building className="h-6 w-6 text-primary-foreground" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{client.name}</h3>
                      <Badge variant={client.client_type === "fisica" ? "default" : "secondary"}>
                        {client.client_type === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">#{client.code}</span>
                    </div>
                    {client.client_type === "juridica" && client.company_name && (
                      <p className="text-sm text-muted-foreground">{client.company_name}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                      )}
                      {client.city && client.state && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {client.city}/{client.state}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openViewDialog(client)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente ajustar os filtros de busca" : "Comece cadastrando um novo cliente"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Tabs value={clientType} onValueChange={(value) => setClientType(value as "fisica" | "juridica")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fisica">Pessoa Física</TabsTrigger>
                <TabsTrigger value="juridica">Pessoa Jurídica</TabsTrigger>
              </TabsList>

              <TabsContent value="fisica" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      placeholder="Nome completo"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date || ""}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf || ""}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      placeholder="00.000.000-0"
                      value={formData.rg || ""}
                      onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="juridica" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Responsável *</Label>
                    <Input
                      id="name"
                      placeholder="Nome do responsável"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Razão Social</Label>
                    <Input
                      id="company_name"
                      placeholder="Razão social da empresa"
                      value={formData.company_name || ""}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fantasy_name">Nome Fantasia</Label>
                    <Input
                      id="fantasy_name"
                      placeholder="Nome fantasia"
                      value={formData.fantasy_name || ""}
                      onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date || ""}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj || ""}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state_registration">Inscrição Estadual</Label>
                    <Input
                      id="state_registration"
                      placeholder="000.000.000.000"
                      value={formData.state_registration || ""}
                      onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Campos comuns */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-foreground">Informações de Contato</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone/Celular *</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formData.cep || ""}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    placeholder="Rua, Avenida, etc."
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    placeholder="123"
                    value={formData.number || ""}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Bairro"
                    value={formData.neighborhood || ""}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Cidade"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Select 
                    value={formData.state || ""} 
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map(estado => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddClient} variant="premium">
                Cadastrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Visualizar informações do cliente
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome</Label>
                  <p className="text-sm text-muted-foreground">{selectedClient.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient.client_type === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                  </p>
                </div>
              </div>

              {selectedClient.client_type === "fisica" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">CPF</Label>
                    <p className="text-sm text-muted-foreground">{selectedClient.cpf || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">RG</Label>
                    <p className="text-sm text-muted-foreground">{selectedClient.rg || "Não informado"}</p>
                  </div>
                </div>
              )}

              {selectedClient.client_type === "juridica" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Razão Social</Label>
                      <p className="text-sm text-muted-foreground">{selectedClient.company_name || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Nome Fantasia</Label>
                      <p className="text-sm text-muted-foreground">{selectedClient.fantasy_name || "Não informado"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">CNPJ</Label>
                      <p className="text-sm text-muted-foreground">{selectedClient.cnpj || "Não informado"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Inscrição Estadual</Label>
                      <p className="text-sm text-muted-foreground">{selectedClient.state_registration || "Não informado"}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Telefone</Label>
                  <p className="text-sm text-muted-foreground">{selectedClient.phone || "Não informado"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">E-mail</Label>
                  <p className="text-sm text-muted-foreground">{selectedClient.email || "Não informado"}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Endereço</Label>
                <p className="text-sm text-muted-foreground">
                  {[selectedClient.address, selectedClient.number, selectedClient.neighborhood, selectedClient.city, selectedClient.state].filter(Boolean).join(", ") || "Não informado"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Altere os dados do cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Same form structure as Add Dialog but with edit handler */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome *</Label>
                  <Input
                    id="edit-name"
                    placeholder="Nome completo"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone *</Label>
                  <Input
                    id="edit-phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditClient} variant="premium">
                Atualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}