import { useState } from "react"
import { Plus, Search, Edit, Trash2, Monitor, Laptop, Server, Eye, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface RemoteAccess {
  id: number
  clientId: number
  clientName: string
  aplicativo: "AnyDesk" | "TeamViewer" | "RustDesk"
  nomeComputador: string
  idAcesso: string
  senhaAcesso?: string
  createdAt: string
  lastAccess?: string
}

const aplicativosRemoto = ["AnyDesk", "TeamViewer", "RustDesk"]

export default function RemoteAccess() {
  const [accesses, setAccesses] = useState<RemoteAccess[]>([
    {
      id: 1,
      clientId: 1,
      clientName: "João Silva",
      aplicativo: "AnyDesk",
      nomeComputador: "PC-Escritorio-Joao",
      idAcesso: "123456789",
      senhaAcesso: "senha123",
      createdAt: "2024-01-15",
      lastAccess: "2024-01-20"
    },
    {
      id: 2,
      clientId: 1,
      clientName: "João Silva", 
      aplicativo: "TeamViewer",
      nomeComputador: "Notebook-Casa",
      idAcesso: "987654321",
      createdAt: "2024-01-18"
    }
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccess, setEditingAccess] = useState<RemoteAccess | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState("")
  const [formData, setFormData] = useState<Partial<RemoteAccess>>({
    clientId: 0,
    aplicativo: "AnyDesk",
    nomeComputador: "",
    idAcesso: "",
    senhaAcesso: ""
  })

  const { toast } = useToast()

  // Mock clients data
  const mockClients = [
    { id: 1, nome: "João Silva" },
    { id: 2, nome: "Maria Santos" },
    { id: 3, nome: "Pedro Oliveira" }
  ]

  const handleSaveAccess = () => {
    if (!formData.clientId || !formData.aplicativo || !formData.nomeComputador || !formData.idAcesso) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      })
      return
    }

    const client = mockClients.find(c => c.id === formData.clientId)
    if (!client) return

    if (editingAccess) {
      setAccesses(accesses.map(access => 
        access.id === editingAccess.id 
          ? { 
              ...editingAccess, 
              ...formData,
              clientName: client.nome,
              aplicativo: formData.aplicativo as "AnyDesk" | "TeamViewer" | "RustDesk"
            }
          : access
      ))
      toast({
        title: "Acesso atualizado!",
        description: "As informações de acesso foram atualizadas.",
      })
    } else {
      const newAccess: RemoteAccess = {
        id: Date.now(),
        clientName: client.nome,
        createdAt: new Date().toISOString().split('T')[0],
        aplicativo: formData.aplicativo as "AnyDesk" | "TeamViewer" | "RustDesk",
        ...formData as RemoteAccess
      }
      setAccesses([...accesses, newAccess])
      toast({
        title: "Acesso cadastrado!",
        description: "Novo acesso remoto foi adicionado.",
      })
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleEditAccess = (access: RemoteAccess) => {
    setEditingAccess(access)
    setFormData(access)
    setIsDialogOpen(true)
  }

  const handleDeleteAccess = (id: number) => {
    const access = accesses.find(a => a.id === id)
    setAccesses(accesses.filter(access => access.id !== id))
    toast({
      title: "Acesso removido!",
      description: `Acesso de ${access?.clientName} foi removido.`,
    })
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "ID foi copiado para a área de transferência.",
    })
  }

  const resetForm = () => {
    setEditingAccess(null)
    setFormData({
      clientId: 0,
      aplicativo: "AnyDesk",
      nomeComputador: "",
      idAcesso: "",
      senhaAcesso: ""
    })
  }

  const getAppIcon = (app: string) => {
    switch (app) {
      case "AnyDesk":
        return <Monitor className="h-5 w-5" />
      case "TeamViewer":
        return <Laptop className="h-5 w-5" />
      case "RustDesk":
        return <Server className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  const getAppColor = (app: string) => {
    switch (app) {
      case "AnyDesk":
        return "bg-red-500"
      case "TeamViewer":
        return "bg-blue-500"
      case "RustDesk":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const filteredAccesses = accesses.filter(access => {
    const matchesSearch = access.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         access.nomeComputador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         access.idAcesso.includes(searchTerm)
    const matchesClient = !selectedClient || access.clientId.toString() === selectedClient
    
    return matchesSearch && matchesClient
  })

  const accessesByClient = mockClients.map(client => ({
    ...client,
    accesses: accesses.filter(access => access.clientId === client.id)
  })).filter(client => client.accesses.length > 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Acesso Remoto</h1>
          <p className="text-muted-foreground">Gerencie conexões remotas com computadores dos clientes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="premium" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Acesso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAccess ? "Editar Acesso Remoto" : "Cadastrar Acesso Remoto"}
              </DialogTitle>
              <DialogDescription>
                {editingAccess ? "Altere as informações do acesso" : "Preencha os dados do novo acesso remoto"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente *</Label>
                <Select 
                  value={formData.clientId?.toString() || ""} 
                  onValueChange={(value) => setFormData({ ...formData, clientId: parseInt(value) })}
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
                <Label htmlFor="aplicativo">Aplicativo de Acesso Remoto *</Label>
                <Select 
                  value={formData.aplicativo || "AnyDesk"} 
                  onValueChange={(value) => setFormData({ ...formData, aplicativo: value as "AnyDesk" | "TeamViewer" | "RustDesk" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aplicativosRemoto.map(app => (
                      <SelectItem key={app} value={app}>{app}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeComputador">Nome do Computador *</Label>
                <Input
                  id="nomeComputador"
                  value={formData.nomeComputador || ""}
                  onChange={(e) => setFormData({ ...formData, nomeComputador: e.target.value })}
                  placeholder="Ex: PC-Escritorio, Notebook-Casa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idAcesso">ID de Acesso *</Label>
                <Input
                  id="idAcesso"
                  value={formData.idAcesso || ""}
                  onChange={(e) => setFormData({ ...formData, idAcesso: e.target.value })}
                  placeholder="Ex: 123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senhaAcesso">Senha de Acesso (Opcional)</Label>
                <Input
                  id="senhaAcesso"
                  type="password"
                  value={formData.senhaAcesso || ""}
                  onChange={(e) => setFormData({ ...formData, senhaAcesso: e.target.value })}
                  placeholder="Senha fixa (se houver)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveAccess} variant="premium">
                  {editingAccess ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente, computador ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os clientes</SelectItem>
                {mockClients.map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setSelectedClient("")
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Access List */}
      <div className="space-y-4">
        {filteredAccesses.map((access) => (
          <Card key={access.id} className="hover:shadow-card transition-smooth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${getAppColor(access.aplicativo)} rounded-lg flex items-center justify-center`}>
                    {getAppIcon(access.aplicativo)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{access.clientName}</h3>
                      <Badge variant="outline">{access.aplicativo}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{access.nomeComputador}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">
                          {access.idAcesso}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(access.idAcesso)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {access.senhaAcesso && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span className="font-mono">••••••</span>
                        </div>
                      )}
                      <div>
                        Cadastrado em {new Date(access.createdAt).toLocaleDateString()}
                      </div>
                      {access.lastAccess && (
                        <div>
                          Último acesso: {new Date(access.lastAccess).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAccess(access)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAccess(access.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grouped by Client View */}
      {!searchTerm && !selectedClient && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Acessos por Cliente</h2>
          {accessesByClient.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-primary-foreground" />
                  </div>
                  {client.nome}
                  <Badge variant="secondary">{client.accesses.length} computadores</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {client.accesses.map((access) => (
                    <div key={access.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${getAppColor(access.aplicativo)} rounded flex items-center justify-center`}>
                          {getAppIcon(access.aplicativo)}
                        </div>
                        <div>
                          <p className="font-medium">{access.nomeComputador}</p>
                          <p className="text-sm text-muted-foreground">{access.aplicativo}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                            {access.idAcesso}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(access.idAcesso)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAccess(access)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAccess(access.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredAccesses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Nenhum acesso encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedClient ? "Ajuste os filtros para visualizar os acessos" : "Comece cadastrando um novo acesso remoto"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}