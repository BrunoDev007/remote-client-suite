import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useClients } from "@/hooks/useClients"
import { Calendar, Plus, Edit, Trash2, Eye, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TechnicalReview {
  id: string
  clientId: string
  clientName: string
  equipmentName: string
  maintenanceType: 'Preventiva' | 'Corretiva' | 'de Rotina'
  subType: 'Limpeza' | 'Melhoria' | 'Substituição'
  startDate: string
  endDate: string
  nextMaintenanceDate?: string
  observations?: string
  createdAt: string
}

export default function TechnicalReview() {
  const [reviews, setReviews] = useState<TechnicalReview[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<TechnicalReview | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingReview, setViewingReview] = useState<TechnicalReview | null>(null)
  
  const [formData, setFormData] = useState({
    clientId: '',
    equipmentName: '',
    maintenanceType: '' as TechnicalReview['maintenanceType'] | '',
    subType: '' as TechnicalReview['subType'] | '',
    startDate: '',
    endDate: '',
    nextMaintenanceDate: '',
    monthsUntilNext: '',
    observations: ''
  })

  const { clients, loading: clientsLoading } = useClients()
  const { toast } = useToast()

  useEffect(() => {
    const savedReviews = localStorage.getItem('technicalReviews')
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews))
    }
  }, [])

  const saveToStorage = (data: TechnicalReview[]) => {
    localStorage.setItem('technicalReviews', JSON.stringify(data))
  }

  const resetForm = () => {
    setFormData({
      clientId: '',
      equipmentName: '',
      maintenanceType: '',
      subType: '',
      startDate: '',
      endDate: '',
      nextMaintenanceDate: '',
      monthsUntilNext: '',
      observations: ''
    })
  }

  const handleSaveReview = () => {
    if (!formData.clientId || !formData.equipmentName || !formData.maintenanceType || 
        !formData.subType || !formData.startDate || !formData.endDate) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
      })
      return
    }

    const client = clients.find(c => c.id === formData.clientId)
    if (!client) return

    const newReview: TechnicalReview = {
      id: editingReview?.id || Date.now().toString(),
      clientId: formData.clientId,
      clientName: client.company_name || client.name,
      equipmentName: formData.equipmentName,
      maintenanceType: formData.maintenanceType as TechnicalReview['maintenanceType'],
      subType: formData.subType as TechnicalReview['subType'],
      startDate: formData.startDate,
      endDate: formData.endDate,
      nextMaintenanceDate: formData.nextMaintenanceDate || undefined,
      observations: formData.observations || undefined,
      createdAt: editingReview?.createdAt || new Date().toISOString()
    }

    let updatedReviews: TechnicalReview[]
    if (editingReview) {
      updatedReviews = reviews.map(review => 
        review.id === editingReview.id ? newReview : review
      )
      toast({
        title: "Revisão atualizada!",
        description: "A revisão técnica foi atualizada com sucesso.",
      })
    } else {
      updatedReviews = [...reviews, newReview]
      toast({
        title: "Revisão criada!",
        description: "Nova revisão técnica foi criada com sucesso.",
      })
    }

    setReviews(updatedReviews)
    saveToStorage(updatedReviews)
    setIsFormOpen(false)
    setEditingReview(null)
    resetForm()
  }

  const handleEditReview = (review: TechnicalReview) => {
    setEditingReview(review)
    setFormData({
      clientId: review.clientId,
      equipmentName: review.equipmentName,
      maintenanceType: review.maintenanceType,
      subType: review.subType,
      startDate: review.startDate,
      endDate: review.endDate,
      nextMaintenanceDate: review.nextMaintenanceDate || '',
      monthsUntilNext: '',
      observations: review.observations || ''
    })
    setIsFormOpen(true)
  }

  const handleDeleteReview = (reviewId: string) => {
    const updatedReviews = reviews.filter(review => review.id !== reviewId)
    setReviews(updatedReviews)
    saveToStorage(updatedReviews)
    toast({
      title: "Revisão excluída!",
      description: "A revisão técnica foi removida com sucesso.",
    })
  }

  const handleViewReview = (review: TechnicalReview) => {
    setViewingReview(review)
    setIsViewDialogOpen(true)
  }

  const shouldShowNextMaintenanceDate = formData.maintenanceType === 'Preventiva' && formData.subType === 'Limpeza'

  const getMaintenanceTypeBadge = (type: string) => {
    switch (type) {
      case 'Preventiva':
        return <Badge variant="default" className="bg-primary">Preventiva</Badge>
      case 'Corretiva':
        return <Badge variant="destructive">Corretiva</Badge>
      case 'de Rotina':
        return <Badge variant="secondary">de Rotina</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getSubTypeBadge = (subType: string) => {
    switch (subType) {
      case 'Limpeza':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Limpeza</Badge>
      case 'Melhoria':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Melhoria</Badge>
      case 'Substituição':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Substituição</Badge>
      default:
        return <Badge variant="outline">{subType}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Revisão Técnica</h1>
          <p className="text-muted-foreground">Controle de manutenções e revisões técnicas</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Revisão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingReview ? 'Editar Revisão' : 'Nova Revisão Técnica'}</DialogTitle>
              <DialogDescription>
                Preencha os dados da revisão técnica do equipamento.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData({...formData, clientId: value})}
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
                <Label htmlFor="equipmentName">Nome do Equipamento *</Label>
                <Input
                  id="equipmentName"
                  value={formData.equipmentName}
                  onChange={(e) => setFormData({...formData, equipmentName: e.target.value})}
                  placeholder="Ex: Servidor Dell PowerEdge"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceType">Tipo de Manutenção *</Label>
                <Select 
                  value={formData.maintenanceType} 
                  onValueChange={(value) => setFormData({...formData, maintenanceType: value as TechnicalReview['maintenanceType']})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preventiva">Preventiva</SelectItem>
                    <SelectItem value="Corretiva">Corretiva</SelectItem>
                    <SelectItem value="de Rotina">de Rotina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subType">Sub Tipo *</Label>
                <Select 
                  value={formData.subType} 
                  onValueChange={(value) => setFormData({...formData, subType: value as TechnicalReview['subType']})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o sub tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Limpeza">Limpeza</SelectItem>
                    <SelectItem value="Melhoria">Melhoria</SelectItem>
                    <SelectItem value="Substituição">Substituição</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Término *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>

              {shouldShowNextMaintenanceDate && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="monthsUntilNext">Próxima Limpeza em (meses) *</Label>
                    <Select 
                      value={formData.monthsUntilNext} 
                      onValueChange={(value) => {
                        const months = parseInt(value)
                        let nextDate = ''
                        if (formData.endDate && months) {
                          const endDate = new Date(formData.endDate)
                          endDate.setMonth(endDate.getMonth() + months)
                          nextDate = endDate.toISOString().split('T')[0]
                        }
                        setFormData({...formData, monthsUntilNext: value, nextMaintenanceDate: nextDate})
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione os meses" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                          <SelectItem key={month} value={month.toString()}>
                            {month} {month === 1 ? 'mês' : 'meses'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nextMaintenanceDate">Data da Próxima Manutenção</Label>
                    <Input
                      id="nextMaintenanceDate"
                      type="date"
                      value={formData.nextMaintenanceDate}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 col-span-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  placeholder="Observações sobre a revisão técnica..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                setIsFormOpen(false)
                setEditingReview(null)
                resetForm()
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveReview}>
                {editingReview ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Revisões</p>
                <p className="text-2xl font-bold text-primary">{reviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold text-success">
                  {reviews.filter(r => {
                    const reviewDate = new Date(r.createdAt)
                    const now = new Date()
                    return reviewDate.getMonth() === now.getMonth() && reviewDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próximas Manutenções</p>
                <p className="text-2xl font-bold text-warning">
                  {reviews.filter(r => r.nextMaintenanceDate && new Date(r.nextMaintenanceDate) >= new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Revisões Técnicas</CardTitle>
          <CardDescription>Lista de todas as revisões técnicas realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma revisão técnica cadastrada.</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira revisão
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Sub Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Próxima</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.clientName}</TableCell>
                    <TableCell>{review.equipmentName}</TableCell>
                    <TableCell>{getMaintenanceTypeBadge(review.maintenanceType)}</TableCell>
                    <TableCell>{getSubTypeBadge(review.subType)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(review.startDate).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">até {new Date(review.endDate).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {review.nextMaintenanceDate ? (
                        <div className="text-sm">
                          {new Date(review.nextMaintenanceDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReview(review)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditReview(review)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Revisão Técnica</DialogTitle>
          </DialogHeader>
          
          {viewingReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{viewingReview.clientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Equipamento</Label>
                  <p className="font-medium">{viewingReview.equipmentName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de Manutenção</Label>
                  <div className="mt-1">{getMaintenanceTypeBadge(viewingReview.maintenanceType)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Sub Tipo</Label>
                  <div className="mt-1">{getSubTypeBadge(viewingReview.subType)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data Início</Label>
                  <p className="font-medium">{new Date(viewingReview.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data Término</Label>
                  <p className="font-medium">{new Date(viewingReview.endDate).toLocaleDateString()}</p>
                </div>
                {viewingReview.nextMaintenanceDate && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Próxima Manutenção</Label>
                    <p className="font-medium">{new Date(viewingReview.nextMaintenanceDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              {viewingReview.observations && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{viewingReview.observations}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}