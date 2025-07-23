import { useState } from "react"
import { Search, DollarSign, CheckCircle, XCircle, AlertCircle, Edit2, FileDown, Calendar, Filter } from "lucide-react"
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

interface FinancialRecord {
  id: number
  clientId: number
  clientName: string
  planName: string
  valor: number
  valorOriginal: number
  dataVencimento: string
  dataPagamento?: string
  status: "quitado" | "pendente" | "atrasado"
  formaPagamento: string
  motivoAlteracao?: string
  observacoes?: string
}

const statusOptions = [
  { value: "todos", label: "Todos" },
  { value: "quitado", label: "Quitadas" },
  { value: "pendente", label: "Pendentes" },
  { value: "atrasado", label: "Em Atraso" }
]

export default function Financial() {
  const [records, setRecords] = useState<FinancialRecord[]>([
    {
      id: 1,
      clientId: 1,
      clientName: "João Silva",
      planName: "Básico",
      valor: 59.90,
      valorOriginal: 59.90,
      dataVencimento: "2024-01-25",
      dataPagamento: "2024-01-24",
      status: "quitado",
      formaPagamento: "PIX"
    },
    {
      id: 2,
      clientId: 2,
      clientName: "Maria Santos",
      planName: "Premium",
      valor: 129.90,
      valorOriginal: 129.90,
      dataVencimento: "2024-01-20",
      status: "pendente",
      formaPagamento: "Boleto"
    },
    {
      id: 3,
      clientId: 3,
      clientName: "Pedro Oliveira",
      planName: "Básico",
      valor: 59.90,
      valorOriginal: 59.90,
      dataVencimento: "2024-01-15",
      status: "atrasado",
      formaPagamento: "Cartão de Crédito"
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [dateFilter, setDateFilter] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null)
  const [editFormData, setEditFormData] = useState({
    valor: 0,
    motivo: ""
  })

  const { toast } = useToast()

  const handleQuitar = (recordId: number) => {
    setRecords(records.map(record => 
      record.id === recordId 
        ? { 
            ...record, 
            status: "quitado" as const, 
            dataPagamento: new Date().toISOString().split('T')[0] 
          }
        : record
    ))
    
    const record = records.find(r => r.id === recordId)
    toast({
      title: "Pagamento quitado!",
      description: `Conta de ${record?.clientName} foi marcada como quitada.`,
    })
  }

  const handleDesquitar = (recordId: number) => {
    setRecords(records.map(record => 
      record.id === recordId 
        ? { 
            ...record, 
            status: "pendente" as const, 
            dataPagamento: undefined 
          }
        : record
    ))
    
    const record = records.find(r => r.id === recordId)
    toast({
      title: "Pagamento desquitado!",
      description: `Conta de ${record?.clientName} foi marcada como pendente.`,
    })
  }

  const handleEditValue = () => {
    if (!editingRecord || !editFormData.motivo.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha o motivo da alteração.",
      })
      return
    }

    setRecords(records.map(record => 
      record.id === editingRecord.id 
        ? { 
            ...record, 
            valor: editFormData.valor,
            motivoAlteracao: editFormData.motivo,
            observacoes: `Valor alterado de R$ ${editingRecord.valorOriginal.toFixed(2)} para R$ ${editFormData.valor.toFixed(2)}. Motivo: ${editFormData.motivo}`
          }
        : record
    ))
    
    toast({
      title: "Valor atualizado!",
      description: `Valor da conta de ${editingRecord.clientName} foi alterado.`,
    })
    
    setIsEditDialogOpen(false)
    setEditingRecord(null)
    setEditFormData({ valor: 0, motivo: "" })
  }

  const openEditDialog = (record: FinancialRecord) => {
    setEditingRecord(record)
    setEditFormData({ valor: record.valor, motivo: "" })
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "quitado":
        return <Badge variant="default" className="bg-success text-success-foreground">Quitado</Badge>
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>
      case "atrasado":
        return <Badge variant="destructive">Em Atraso</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "quitado":
        return <CheckCircle className="h-5 w-5 text-success" />
      case "pendente":
        return <AlertCircle className="h-5 w-5 text-warning" />
      case "atrasado":
        return <XCircle className="h-5 w-5 text-destructive" />
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.planName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "todos" || record.status === statusFilter
    const matchesDate = !dateFilter || record.dataVencimento.includes(dateFilter)
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const stats = {
    total: records.length,
    quitados: records.filter(r => r.status === "quitado").length,
    pendentes: records.filter(r => r.status === "pendente").length,
    atrasados: records.filter(r => r.status === "atrasado").length,
    totalReceita: records.filter(r => r.status === "quitado").reduce((sum, r) => sum + r.valor, 0),
    totalPendente: records.filter(r => r.status !== "quitado").reduce((sum, r) => sum + r.valor, 0)
  }

  const generateReport = () => {
    const reportData = filteredRecords.map(record => ({
      Cliente: record.clientName,
      Plano: record.planName,
      Valor: `R$ ${record.valor.toFixed(2)}`,
      Vencimento: new Date(record.dataVencimento).toLocaleDateString(),
      Status: record.status,
      Pagamento: record.dataPagamento ? new Date(record.dataPagamento).toLocaleDateString() : "-",
      "Forma de Pagamento": record.formaPagamento
    }))
    
    console.log("Relatório gerado:", reportData)
    toast({
      title: "Relatório gerado!",
      description: "O relatório foi gerado com sucesso. Verifique o console.",
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle de pagamentos e relatórios financeiros</p>
        </div>
        
        <Button onClick={generateReport} variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quitados</p>
                <p className="text-2xl font-bold text-success">{stats.quitados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Atraso</p>
                <p className="text-2xl font-bold text-destructive">{stats.atrasados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold text-primary">R$ {stats.totalReceita.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar cliente ou plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("todos")
                setDateFilter("")
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Records */}
      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-card transition-smooth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    {getStatusIcon(record.status)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{record.clientName}</h3>
                      {getStatusBadge(record.status)}
                      <Badge variant="outline">{record.planName}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {record.valor !== record.valorOriginal ? (
                          <span>
                            <span className="line-through">R$ {record.valorOriginal.toFixed(2)}</span>
                            {" → "}
                            <span className="font-medium">R$ {record.valor.toFixed(2)}</span>
                          </span>
                        ) : (
                          `R$ ${record.valor.toFixed(2)}`
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vence em {new Date(record.dataVencimento).toLocaleDateString()}
                      </div>
                      {record.dataPagamento && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Pago em {new Date(record.dataPagamento).toLocaleDateString()}
                        </div>
                      )}
                      <div className="text-xs">
                        {record.formaPagamento}
                      </div>
                    </div>
                    {record.observacoes && (
                      <p className="text-xs text-muted-foreground italic">
                        {record.observacoes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(record)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  {record.status === "quitado" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDesquitar(record.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Desquitar
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleQuitar(record.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Quitar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground">
              Ajuste os filtros para visualizar os registros financeiros
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Value Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Valor a Receber</DialogTitle>
            <DialogDescription>
              Altere o valor e informe o motivo da alteração
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={editingRecord?.clientName || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label>Valor Original</Label>
              <Input value={`R$ ${editingRecord?.valorOriginal.toFixed(2)}`} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Novo Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={editFormData.valor}
                onChange={(e) => setEditFormData({ ...editFormData, valor: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Alteração *</Label>
              <Textarea
                id="motivo"
                value={editFormData.motivo}
                onChange={(e) => setEditFormData({ ...editFormData, motivo: e.target.value })}
                placeholder="Explique o motivo da alteração do valor"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditValue} variant="premium">
                Salvar Alteração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}