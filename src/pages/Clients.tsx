import { useState } from "react"
import { Plus, Search, Edit, Trash2, User, Building, Phone, Mail, MapPin } from "lucide-react"
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
  id: number
  codigo: number
  type: "PF" | "PJ"
  nome: string
  razaoSocial?: string
  nomeFantasia?: string
  dataNascimento: string
  telefone: string
  cep: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  cpf?: string
  rg?: string
  cnpj?: string
  ie?: string
  email: string
}

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      codigo: 1001,
      type: "PF",
      nome: "João Silva",
      dataNascimento: "1985-03-15",
      telefone: "(11) 99999-9999",
      cep: "01310-100",
      endereco: "Av. Paulista",
      numero: "1000",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      cpf: "123.456.789-00",
      rg: "12.345.678-9",
      email: "joao@email.com"
    }
  ])
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientType, setClientType] = useState<"PF" | "PJ">("PF")
  const [formData, setFormData] = useState<Partial<Client>>({
    type: "PF",
    nome: "",
    dataNascimento: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    email: "",
  })
  
  const { toast } = useToast()

  const handleSaveClient = () => {
    if (!formData.nome || !formData.telefone || !formData.email) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      })
      return
    }

    if (editingClient) {
      setClients(clients.map(client => 
        client.id === editingClient.id 
          ? { ...editingClient, ...formData, type: clientType }
          : client
      ))
      toast({
        title: "Cliente atualizado!",
        description: "Os dados do cliente foram atualizados com sucesso.",
      })
    } else {
      const newClient: Client = {
        id: Date.now(),
        codigo: Math.max(...clients.map(c => c.codigo), 1000) + 1,
        type: clientType,
        ...formData as Client
      }
      setClients([...clients, newClient])
      toast({
        title: "Cliente cadastrado!",
        description: "Novo cliente foi adicionado com sucesso.",
      })
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setClientType(client.type)
    setFormData(client)
    setIsDialogOpen(true)
  }

  const handleDeleteClient = (id: number) => {
    setClients(clients.filter(client => client.id !== id))
    toast({
      title: "Cliente removido!",
      description: "O cliente foi removido do sistema.",
    })
  }

  const resetForm = () => {
    setEditingClient(null)
    setClientType("PF")
    setFormData({
      type: "PF",
      nome: "",
      dataNascimento: "",
      telefone: "",
      cep: "",
      endereco: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      email: "",
    })
  }

  const filteredClients = clients.filter(client =>
    client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.codigo.toString().includes(searchTerm)
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e suas informações</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="premium" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingClient ? "Altere os dados do cliente" : "Preencha os dados do novo cliente"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Tabs value={clientType} onValueChange={(value) => setClientType(value as "PF" | "PJ")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="PF">Pessoa Física</TabsTrigger>
                  <TabsTrigger value="PJ">Pessoa Jurídica</TabsTrigger>
                </TabsList>

                <TabsContent value="PF" className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome || ""}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input
                        id="dataNascimento"
                        type="date"
                        value={formData.dataNascimento || ""}
                        onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf || ""}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rg">RG</Label>
                      <Input
                        id="rg"
                        value={formData.rg || ""}
                        onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                        placeholder="00.000.000-0"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="PJ" className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome || ""}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial">Razão Social</Label>
                      <Input
                        id="razaoSocial"
                        value={formData.razaoSocial || ""}
                        onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                        placeholder="Razão social da empresa"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                      <Input
                        id="nomeFantasia"
                        value={formData.nomeFantasia || ""}
                        onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                        placeholder="Nome fantasia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input
                        id="dataNascimento"
                        type="date"
                        value={formData.dataNascimento || ""}
                        onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj || ""}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ie">Inscrição Estadual</Label>
                      <Input
                        id="ie"
                        value={formData.ie || ""}
                        onChange={(e) => setFormData({ ...formData, ie: e.target.value })}
                        placeholder="000.000.000.000"
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
                    <Label htmlFor="telefone">Telefone/Celular *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone || ""}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep || ""}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco || ""}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero || ""}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro || ""}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade || ""}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select 
                      value={formData.estado || ""} 
                      onValueChange={(value) => setFormData({ ...formData, estado: value })}
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveClient} variant="premium">
                  {editingClient ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, e-mail ou código..."
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
                    {client.type === "PF" ? (
                      <User className="h-6 w-6 text-primary-foreground" />
                    ) : (
                      <Building className="h-6 w-6 text-primary-foreground" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{client.nome}</h3>
                      <Badge variant={client.type === "PF" ? "default" : "secondary"}>
                        {client.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">#{client.codigo}</span>
                    </div>
                    {client.type === "PJ" && client.razaoSocial && (
                      <p className="text-sm text-muted-foreground">{client.razaoSocial}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.telefone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.cidade}/{client.estado}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClient(client)}
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
    </div>
  )
}