import { useState } from "react"
import { Plus, Search, Edit, Trash2, Monitor, Laptop, Server, Eye, Copy, ChevronDown, ChevronRight, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useRemoteAccess } from "@/hooks/useRemoteAccess"
import { useClients } from "@/hooks/useClients"

const aplicativosRemoto = ["AnyDesk", "TeamViewer", "RustDesk"]

export default function RemoteAccess() {
  const { 
    accesses, 
    loading, 
    createAccess, 
    updateAccess, 
    deleteAccess, 
    getFilteredAccesses 
  } = useRemoteAccess()
  
  const { clients } = useClients()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccess, setEditingAccess] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState("all")
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [viewingAccess, setViewingAccess] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<string>("all")
  const [formData, setFormData] = useState({
    client_id: "",
    application_type: "AnyDesk",
    computer_name: "",
    access_id: "",
    access_password: ""
  })

  const { toast } = useToast()

  const handleSaveAccess = async () => {
    if (!formData.client_id || !formData.application_type || !formData.computer_name || !formData.access_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      })
      return
    }

    if (editingAccess) {
      await updateAccess(editingAccess.id, formData)
    } else {
      await createAccess(formData)
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleEditAccess = (access: any) => {
    setEditingAccess(access)
    setFormData({
      client_id: access.client_id,
      application_type: access.application_type,
      computer_name: access.computer_name,
      access_id: access.access_id,
      access_password: access.access_password || ""
    })
    setIsDialogOpen(true)
  }

  const handleDeleteAccess = async (id: string) => {
    await deleteAccess(id)
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
      client_id: "",
      application_type: "AnyDesk",
      computer_name: "",
      access_id: "",
      access_password: ""
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

  const filteredAccesses = getFilteredAccesses({
    searchTerm,
    selectedClient
  }).filter(access => 
    selectedApp === "all" || access.application_type === selectedApp
  )

  const accessesByClient = clients.map(client => ({
    ...client,
    accesses: accesses.filter(access => 
      access.client_id === client.id && 
      (selectedApp === "all" || access.application_type === selectedApp)
    )
  })).filter(client => client.accesses.length > 0)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando acessos remotos...</p>
        </div>
      </div>
    )
  }

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
                   value={formData.client_id} 
                   onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o cliente" />
                   </SelectTrigger>
                   <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name || client.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aplicativo">Aplicativo de Acesso Remoto *</Label>
                 <Select 
                   value={formData.application_type} 
                   onValueChange={(value) => setFormData({ ...formData, application_type: value })}
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
                   value={formData.computer_name}
                   onChange={(e) => setFormData({ ...formData, computer_name: e.target.value })}
                   placeholder="Ex: PC-Escritorio, Notebook-Casa"
                 />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idAcesso">ID de Acesso *</Label>
                 <Input
                   id="idAcesso"
                   value={formData.access_id}
                   onChange={(e) => setFormData({ ...formData, access_id: e.target.value })}
                   placeholder="Ex: 123456789"
                 />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senhaAcesso">Senha de Acesso (Opcional)</Label>
                 <Input
                   id="senhaAcesso"
                   type="password"
                   value={formData.access_password}
                   onChange={(e) => setFormData({ ...formData, access_password: e.target.value })}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                 <SelectItem value="all">Todos os clientes</SelectItem>
                 {clients.map(client => (
                   <SelectItem key={client.id} value={client.id}>
                     {client.company_name || client.name}
                   </SelectItem>
                 ))}
              </SelectContent>
            </Select>

            <Select value={selectedApp} onValueChange={setSelectedApp}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por aplicativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os aplicativos</SelectItem>
                {aplicativosRemoto.map(app => (
                  <SelectItem key={app} value={app}>
                    {app}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setSelectedClient("all")
                setSelectedApp("all")
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Access List - Only show when there's an active search */}
      {(searchTerm || selectedClient !== "all") && (
        <div className="space-y-4">
          {filteredAccesses.map((access) => (
            <Card key={access.id} className="hover:shadow-card transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 ${getAppColor(access.application_type)} rounded-lg flex items-center justify-center`}>
                     {getAppIcon(access.application_type)}
                   </div>
                   
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {clients.find(c => c.id === access.client_id)?.company_name || clients.find(c => c.id === access.client_id)?.name || 'Cliente não encontrado'}
                        </h3>
                        <Badge variant="outline">{access.application_type}</Badge>
                      </div>
                     <p className="text-sm text-muted-foreground font-medium">{access.computer_name}</p>
                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                       <div className="flex items-center gap-2">
                         <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">
                           {access.access_id}
                         </span>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleCopyToClipboard(access.access_id)}
                           className="h-6 w-6 p-0"
                         >
                           <Copy className="h-3 w-3" />
                         </Button>
                       </div>
                        {access.access_password && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span className="font-mono">Com senha</span>
                          </div>
                        )}
                       <div>
                         Cadastrado em {new Date(access.created_at).toLocaleDateString()}
                       </div>
                     </div>
                   </div>
                  </div>

                   <div className="flex items-center gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setViewingAccess(viewingAccess === access.id ? null : access.id)}
                     >
                       <Eye className="h-4 w-4" />
                     </Button>
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
                 
                 {/* Details view */}
                 {viewingAccess === access.id && (
                   <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                     <h4 className="font-medium mb-3">Detalhes do Acesso</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                       <div>
                         <label className="font-medium text-muted-foreground">Aplicativo:</label>
                         <p className="mt-1">{access.application_type}</p>
                       </div>
                       <div>
                         <label className="font-medium text-muted-foreground">ID de Acesso:</label>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="font-mono bg-background px-2 py-1 rounded">{access.access_id}</span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleCopyToClipboard(access.access_id)}
                             className="h-6 w-6 p-0"
                           >
                             <Copy className="h-3 w-3" />
                           </Button>
                         </div>
                       </div>
                       {access.access_password && (
                         <div>
                           <label className="font-medium text-muted-foreground">Senha:</label>
                           <div className="flex items-center gap-2 mt-1">
                             <span className="font-mono bg-background px-2 py-1 rounded">{access.access_password}</span>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleCopyToClipboard(access.access_password)}
                               className="h-6 w-6 p-0"
                             >
                               <Copy className="h-3 w-3" />
                             </Button>
                           </div>
                         </div>
                       )}
                       <div>
                         <label className="font-medium text-muted-foreground">Computador:</label>
                         <p className="mt-1">{access.computer_name}</p>
                       </div>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
           ))}
         </div>
      )}

      {/* Grouped by Client View - Only show when no search is active */}
      {!searchTerm && selectedClient === "all" && selectedApp === "all" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Acessos por Cliente</h2>
          {accessesByClient.map((client) => (
            <Card key={client.id}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  const newExpanded = new Set(expandedClients)
                  if (newExpanded.has(client.id)) {
                    newExpanded.delete(client.id)
                  } else {
                    newExpanded.add(client.id)
                  }
                  setExpandedClients(newExpanded)
                }}
              >
                <CardTitle className="flex items-center gap-2">
                  {expandedClients.has(client.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-primary-foreground" />
                  </div>
                   {client.company_name || client.name}
                   <Badge variant="secondary">{client.accesses.length} computadores</Badge>
                </CardTitle>
              </CardHeader>
              {expandedClients.has(client.id) && (
                <CardContent>
                  <div className="grid gap-3">
                     {client.accesses.map((access) => (
                       <div key={access.id} className="space-y-2">
                         <div className="flex items-center justify-between p-3 border rounded-lg">
                           <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${getAppColor(access.application_type)} rounded flex items-center justify-center`}>
                              {getAppIcon(access.application_type)}
                            </div>
                            <div>
                              <p className="font-medium">{access.computer_name}</p>
                              <p className="text-sm text-muted-foreground">{access.application_type}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                                {access.access_id}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyToClipboard(access.access_id)}
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
                                onClick={() => setViewingAccess(viewingAccess === access.id ? null : access.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
                         
                         {/* Details view for grouped access */}
                         {viewingAccess === access.id && (
                           <div className="ml-3 p-3 bg-muted/30 rounded border">
                             <h5 className="font-medium mb-2 text-sm">Detalhes do Acesso</h5>
                             <div className="grid grid-cols-2 gap-3 text-xs">
                               <div>
                                 <label className="font-medium text-muted-foreground">ID:</label>
                                 <div className="flex items-center gap-1 mt-1">
                                   <span className="font-mono bg-background px-1 py-0.5 rounded text-xs">{access.access_id}</span>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => handleCopyToClipboard(access.access_id)}
                                     className="h-4 w-4 p-0"
                                   >
                                     <Copy className="h-2 w-2" />
                                   </Button>
                                 </div>
                               </div>
                               {access.access_password && (
                                 <div>
                                   <label className="font-medium text-muted-foreground">Senha:</label>
                                   <div className="flex items-center gap-1 mt-1">
                                     <span className="font-mono bg-background px-1 py-0.5 rounded text-xs">{access.access_password}</span>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => handleCopyToClipboard(access.access_password)}
                                       className="h-4 w-4 p-0"
                                     >
                                       <Copy className="h-2 w-2" />
                                     </Button>
                                   </div>
                                 </div>
                               )}
                             </div>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 </CardContent>
               )}
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