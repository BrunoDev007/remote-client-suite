import { useState, useEffect } from "react"
import { Search, DollarSign, CheckCircle, XCircle, AlertCircle, Edit2, FileDown, Calendar, Filter, Trash2, Printer, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { useFinancial } from "@/hooks/useFinancial"

const statusOptions = [
  { value: "todos", label: "Todos" },
  { value: "quitado", label: "Quitadas" },
  { value: "pendente", label: "Pendentes" },
  { value: "atrasado", label: "Em Atraso" }
]

export default function Financial() {
  const { 
    records, 
    loading, 
    updateRecordStatus, 
    updateRecordValue, 
    updateRecordDueDate,
    deleteRecord,
    getStats,
    generateMonthlyRecords,
    refetchRecords
  } = useFinancial()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [dateFilter, setDateFilter] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    value: 0,
    reason: ""
  })
  const [newDueDate, setNewDueDate] = useState("")
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportData, setReportData] = useState<any[]>([])
  const [filteredRecords, setFilteredRecords] = useState<any[]>([])

  const { toast } = useToast()

  // Garantir geração de registros do mês ao mudar o filtro de data
  useEffect(() => {
    const run = async () => {
      if (!dateFilter) return
      const [year, month] = dateFilter.split('-').map(Number)
      await generateMonthlyRecords(year, month)
      await refetchRecords()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter])

  // Filtragem pura em memória (sem efeitos colaterais)
  useEffect(() => {
    const term = searchTerm.toLowerCase()
    const filtered = records.filter((record: any) => {
      const matchesSearch =
        !term ||
        record.client_name.toLowerCase().includes(term) ||
        record.plan_name.toLowerCase().includes(term)

      const matchesStatus =
        !statusFilter || statusFilter === "todos" || record.status === statusFilter

      const matchesDate =
        !dateFilter ||
        (() => {
          const rd = new Date(record.due_date)
          const [y, m] = dateFilter.split("-").map(Number)
          return rd.getFullYear() === y && rd.getMonth() === m - 1
        })()

      return matchesSearch && matchesStatus && matchesDate
    })

    setFilteredRecords(filtered)
  }, [searchTerm, statusFilter, dateFilter, records])

  const handleQuitar = async (recordId: string) => {
    await updateRecordStatus(recordId, 'quitado')
  }

  const handleDesquitar = async (recordId: string) => {
    await updateRecordStatus(recordId, 'pendente')
  }

  const handleDeleteRecord = async (recordId: string) => {
    await deleteRecord(recordId)
  }

  const handleEditValue = async () => {
    if (!editingRecord || !editFormData.reason.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha o motivo da alteração.",
      })
      return
    }

    await updateRecordValue(editingRecord.id, editFormData.value, editFormData.reason)
    setIsEditDialogOpen(false)
    setEditingRecord(null)
    setEditFormData({ value: 0, reason: "" })
  }

  const openEditDialog = (record: any) => {
    setEditingRecord(record)
    setEditFormData({ value: Number(record.value), reason: "" })
    setIsEditDialogOpen(true)
  }

  const openDateDialog = (record: any) => {
    setEditingRecord(record)
    setNewDueDate(record.due_date)
    setIsDateDialogOpen(true)
  }

  const handleEditDueDate = async () => {
    if (!editingRecord || !newDueDate) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma nova data de vencimento.",
      })
      return
    }

    await updateRecordDueDate(editingRecord.id, newDueDate)
    setIsDateDialogOpen(false)
    setEditingRecord(null)
    setNewDueDate("")
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

  const stats = getStats(filteredRecords)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando registros financeiros...</p>
        </div>
      </div>
    )
  }

  const generateReport = () => {
    const data = filteredRecords.map(record => ({
      Cliente: record.client_name,
      Plano: record.plan_name,
      Valor: `R$ ${Number(record.value).toFixed(2)}`,
      Vencimento: new Date(record.due_date).toLocaleDateString(),
      Status: record.status === 'quitado' ? 'Quitado' : record.status === 'pendente' ? 'Pendente' : 'Em Atraso',
      Pagamento: record.payment_date ? new Date(record.payment_date).toLocaleDateString() : "-",
      "Forma de Pagamento": record.payment_method
    }))
    
    setReportData(data)
    setShowReportDialog(true)
  }

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const html2canvas = (await import('html2canvas')).default
    
    const element = document.getElementById('report-content')
    if (!element) return
    
    const canvas = await html2canvas(element)
    const imgData = canvas.toDataURL('image/png')
    
    const pdf = new jsPDF()
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    pdf.save('relatorio-financeiro.pdf')
  }

  const printReport = () => {
    const element = document.getElementById('report-content')
    if (!element) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório Financeiro</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-card { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
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
                       <h3 className="font-semibold text-foreground">{record.client_name}</h3>
                       {getStatusBadge(record.status)}
                       <Badge variant="outline">{record.plan_name}</Badge>
                     </div>
                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                       <div className="flex items-center gap-1">
                         <DollarSign className="h-3 w-3" />
                         {Number(record.value) !== Number(record.original_value) ? (
                           <span>
                             <span className="line-through">R$ {Number(record.original_value).toFixed(2)}</span>
                             {" → "}
                             <span className="font-medium">R$ {Number(record.value).toFixed(2)}</span>
                           </span>
                         ) : (
                           `R$ ${Number(record.value).toFixed(2)}`
                         )}
                       </div>
                       <div className="flex items-center gap-1">
                         <Calendar className="h-3 w-3" />
                         Vence em {new Date(record.due_date).toLocaleDateString()}
                       </div>
                       {record.payment_date && (
                         <div className="flex items-center gap-1">
                           <CheckCircle className="h-3 w-3" />
                           Pago em {new Date(record.payment_date).toLocaleDateString()}
                         </div>
                       )}
                       <div className="text-xs">
                         {record.payment_method}
                       </div>
                     </div>
                     {record.observations && (
                       <p className="text-xs text-muted-foreground italic">
                         {record.observations}
                       </p>
                     )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(record)}
                    title="Editar valor"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDateDialog(record)}
                    title="Editar data de vencimento"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  
                  {record.status === "pendente" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRecord(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
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
               <Input value={editingRecord?.client_name || ""} disabled />
             </div>

             <div className="space-y-2">
               <Label>Valor Original</Label>
               <Input value={`R$ ${Number(editingRecord?.original_value || 0).toFixed(2)}`} disabled />
             </div>

             <div className="space-y-2">
               <Label htmlFor="value">Novo Valor *</Label>
               <Input
                 id="value"
                 type="number"
                 step="0.01"
                 min="0"
                 value={editFormData.value}
                 onChange={(e) => setEditFormData({ ...editFormData, value: parseFloat(e.target.value) || 0 })}
                 placeholder="0.00"
               />
             </div>

             <div className="space-y-2">
               <Label htmlFor="reason">Motivo da Alteração *</Label>
               <Textarea
                 id="reason"
                 value={editFormData.reason}
                 onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
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

      {/* Edit Due Date Dialog */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Data de Vencimento</DialogTitle>
            <DialogDescription>
              Altere a data de vencimento do título
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
             <div className="space-y-2">
               <Label>Cliente</Label>
               <Input value={editingRecord?.client_name || ""} disabled />
             </div>

             <div className="space-y-2">
               <Label>Data Atual</Label>
               <Input value={editingRecord ? new Date(editingRecord.due_date).toLocaleDateString() : ""} disabled />
             </div>

             <div className="space-y-2">
               <Label htmlFor="newDueDate">Nova Data de Vencimento *</Label>
               <Input
                 id="newDueDate"
                 type="date"
                 value={newDueDate}
                 onChange={(e) => setNewDueDate(e.target.value)}
               />
             </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditDueDate} variant="premium">
                Salvar Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relatório Financeiro</DialogTitle>
            <DialogDescription>
              Visualize e exporte o relatório dos registros filtrados
            </DialogDescription>
          </DialogHeader>

          <div id="report-content" className="space-y-6">
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold">Relatório Financeiro</h1>
              <p className="text-muted-foreground">Gerado em {new Date().toLocaleDateString()}</p>
            </div>

            {/* Report Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total de Registros</p>
                <p className="text-2xl font-bold">{reportData.length}</p>
              </div>
              <div className="stat-card text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  R$ {reportData.reduce((sum, record) => {
                    const value = parseFloat(record.Valor.replace('R$ ', '').replace(',', '.'))
                    return sum + (isNaN(value) ? 0 : value)
                  }, 0).toFixed(2)}
                </p>
              </div>
              <div className="stat-card text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Quitados</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.filter(r => r.Status === 'Quitado').length}
                </p>
              </div>
              <div className="stat-card text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reportData.filter(r => r.Status === 'Pendente' || r.Status === 'Em Atraso').length}
                </p>
              </div>
            </div>

            {/* Report Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Forma Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{record.Cliente}</TableCell>
                    <TableCell>{record.Plano}</TableCell>
                    <TableCell className="font-medium">{record.Valor}</TableCell>
                    <TableCell>{record.Vencimento}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        record.Status === 'Quitado' ? 'bg-green-100 text-green-800' :
                        record.Status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.Status}
                      </span>
                    </TableCell>
                    <TableCell>{record.Pagamento}</TableCell>
                    <TableCell>{record["Forma de Pagamento"]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Fechar
            </Button>
            <Button variant="outline" onClick={printReport}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
