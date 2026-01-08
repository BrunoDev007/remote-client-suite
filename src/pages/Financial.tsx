import { useState, useEffect } from "react"
import { Search, DollarSign, CheckCircle, XCircle, AlertCircle, FileDown, Calendar, Filter, Printer, Download, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { useFinancial } from "@/hooks/useFinancial"
import { LateFeeCalculator } from "@/components/financial/LateFeeCalculator"
import { BulkDueDateDialog } from "@/components/financial/BulkDueDateDialog"
import { FinancialRecordActions } from "@/components/financial/FinancialRecordActions"

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
  const [isBulkDateDialogOpen, setIsBulkDateDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    value: 0,
    reason: ""
  })
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportData, setReportData] = useState<any[]>([])
  const [filteredRecords, setFilteredRecords] = useState<any[]>([])
  const [showLateFeeCalculator, setShowLateFeeCalculator] = useState(false)

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
    setIsBulkDateDialogOpen(true)
  }

  const handleDateDialogSuccess = async () => {
    await refetchRecords()
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
      <div className="p-4 sm:p-6 space-y-6">
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
      Vencimento: record.due_date.split('-').reverse().join('/'),
      Status: record.status === 'quitado' ? 'Quitado' : record.status === 'pendente' ? 'Pendente' : 'Em Atraso',
      Pagamento: record.payment_date ? record.payment_date.split('-').reverse().join('/') : "-",
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Controle de pagamentos e relatórios financeiros</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setShowLateFeeCalculator(true)} variant="outline" className="w-full sm:w-auto">
            <Calculator className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Calcular por Atraso</span>
            <span className="sm:hidden">Calcular Atraso</span>
          </Button>
          <Button onClick={generateReport} variant="outline" className="w-full sm:w-auto">
            <FileDown className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Gerar Relatório</span>
            <span className="sm:hidden">Relatório</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Responsivo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Quitados</p>
                <p className="text-lg sm:text-2xl font-bold text-success">{stats.quitados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Pendentes</p>
                <p className="text-lg sm:text-2xl font-bold text-warning">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Em Atraso</p>
                <p className="text-lg sm:text-2xl font-bold text-destructive">{stats.atrasados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Receita</p>
                <p className="text-base sm:text-2xl font-bold text-primary truncate">R$ {stats.totalReceita.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Responsivo */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Records - Responsivo */}
      <div className="space-y-3 sm:space-y-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-card transition-smooth">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                {/* Info lado esquerdo */}
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    {getStatusIcon(record.status)}
                  </div>
                  
                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Nome e badges - empilhar em mobile */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{record.client_name}</h3>
                      {getStatusBadge(record.status)}
                    </div>
                    <Badge variant="outline" className="text-xs">{record.plan_name}</Badge>
                    
                    {/* Detalhes - empilhar em mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 flex-shrink-0" />
                        {Number(record.value) !== Number(record.original_value) ? (
                          <span className="truncate">
                            <span className="line-through">R$ {Number(record.original_value).toFixed(2)}</span>
                            {" → "}
                            <span className="font-medium">R$ {Number(record.value).toFixed(2)}</span>
                          </span>
                        ) : (
                          <span>R$ {Number(record.value).toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>Vence em {record.due_date.split('-').reverse().join('/')}</span>
                      </div>
                      {record.payment_date && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 flex-shrink-0" />
                          <span>Pago em {record.payment_date.split('-').reverse().join('/')}</span>
                        </div>
                      )}
                      <span className="text-xs hidden sm:inline">{record.payment_method}</span>
                    </div>
                    
                    {/* Forma de pagamento em mobile */}
                    <div className="sm:hidden text-xs text-muted-foreground">
                      {record.payment_method}
                    </div>
                    
                    {record.observations && (
                      <p className="text-xs text-muted-foreground italic truncate">
                        {record.observations}
                      </p>
                    )}
                  </div>
                </div>

                {/* Menu de ações */}
                <FinancialRecordActions
                  record={record}
                  onQuitar={handleQuitar}
                  onDesquitar={handleDesquitar}
                  onEditValue={openEditDialog}
                  onEditDate={openDateDialog}
                  onDelete={handleDeleteRecord}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Nenhum registro encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Ajuste os filtros para visualizar os registros financeiros
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Value Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="mx-4 sm:mx-auto max-w-md">
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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleEditValue} variant="premium" className="w-full sm:w-auto">
                Salvar Alteração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Due Date Dialog */}
      <BulkDueDateDialog
        open={isBulkDateDialogOpen}
        onOpenChange={setIsBulkDateDialogOpen}
        record={editingRecord ? {
          id: editingRecord.id,
          client_plan_id: editingRecord.client_plan_id,
          client_name: editingRecord.client_name,
          due_date: editingRecord.due_date,
          status: editingRecord.status
        } : null}
        onSuccess={handleDateDialogSuccess}
      />

      {/* Report Dialog - Responsivo */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-full sm:max-w-6xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Relatório Financeiro</DialogTitle>
            <DialogDescription>
              Visualize e exporte o relatório dos registros filtrados
            </DialogDescription>
          </DialogHeader>

          <div id="report-content" className="space-y-4 sm:space-y-6">
            <div className="text-center border-b pb-4">
              <h1 className="text-xl sm:text-2xl font-bold">Relatório Financeiro</h1>
              <p className="text-sm text-muted-foreground">Gerado em {new Date().toLocaleDateString()}</p>
            </div>

            {/* Report Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <div className="stat-card text-center p-3 sm:p-4 border rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Total de Registros</p>
                <p className="text-lg sm:text-2xl font-bold">{reportData.length}</p>
              </div>
              <div className="stat-card text-center p-3 sm:p-4 border rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg sm:text-2xl font-bold">
                  R$ {reportData.reduce((sum, record) => {
                    const value = parseFloat(record.Valor.replace('R$ ', '').replace(',', '.'))
                    return sum + (isNaN(value) ? 0 : value)
                  }, 0).toFixed(2)}
                </p>
              </div>
              <div className="stat-card text-center p-3 sm:p-4 border rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Quitados</p>
                <p className="text-lg sm:text-2xl font-bold text-success">
                  {reportData.filter(r => r.Status === 'Quitado').length}
                </p>
              </div>
              <div className="stat-card text-center p-3 sm:p-4 border rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Pendentes</p>
                <p className="text-lg sm:text-2xl font-bold text-warning">
                  {reportData.filter(r => r.Status === 'Pendente' || r.Status === 'Em Atraso').length}
                </p>
              </div>
            </div>

            {/* Report Table - Scroll horizontal em mobile */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table className="min-w-[600px]">
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
                      <TableCell className="whitespace-nowrap">{record.Cliente}</TableCell>
                      <TableCell className="whitespace-nowrap">{record.Plano}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{record.Valor}</TableCell>
                      <TableCell className="whitespace-nowrap">{record.Vencimento}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                          record.Status === 'Quitado' ? 'bg-success/20 text-success' :
                          record.Status === 'Pendente' ? 'bg-warning/20 text-warning' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {record.Status}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{record.Pagamento}</TableCell>
                      <TableCell className="whitespace-nowrap">{record["Forma de Pagamento"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowReportDialog(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
            <Button variant="outline" onClick={printReport} className="w-full sm:w-auto">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={downloadPDF} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Late Fee Calculator Dialog - Responsivo */}
      <Dialog open={showLateFeeCalculator} onOpenChange={setShowLateFeeCalculator}>
        <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calcular por Atraso
            </DialogTitle>
            <DialogDescription>
              Calcule multa e mora para pagamentos em atraso
            </DialogDescription>
          </DialogHeader>
          <LateFeeCalculator />
        </DialogContent>
      </Dialog>
    </div>
  )
}
