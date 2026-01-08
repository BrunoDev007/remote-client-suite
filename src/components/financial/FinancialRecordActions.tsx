import { useState } from "react"
import { MoreVertical, CheckCircle, XCircle, Calendar, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FinancialRecord {
  id: string
  client_name: string
  status: string
  value: number
}

interface FinancialRecordActionsProps {
  record: FinancialRecord
  onQuitar: (id: string) => Promise<void>
  onDesquitar: (id: string) => Promise<void>
  onEditValue: (record: FinancialRecord) => void
  onEditDate: (record: FinancialRecord) => void
  onDelete: (id: string) => Promise<void>
}

export function FinancialRecordActions({
  record,
  onQuitar,
  onDesquitar,
  onEditValue,
  onEditDate,
  onDelete,
}: FinancialRecordActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isQuitado = record.status === "quitado"

  const handleQuitar = async () => {
    setIsLoading(true)
    await onQuitar(record.id)
    setIsLoading(false)
  }

  const handleDesquitar = async () => {
    setIsLoading(true)
    await onDesquitar(record.id)
    setIsLoading(false)
  }

  const handleDelete = async () => {
    setIsLoading(true)
    await onDelete(record.id)
    setIsLoading(false)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" disabled={isLoading}>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Quitar/Desquitar */}
          {isQuitado ? (
            <DropdownMenuItem onClick={handleDesquitar} disabled={isLoading}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              Desquitar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleQuitar} disabled={isLoading}>
              <CheckCircle className="mr-2 h-4 w-4 text-success" />
              Quitar
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Edições */}
          <DropdownMenuItem
            onClick={() => onEditDate(record)}
            disabled={isQuitado}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Editar Vencimento
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onEditValue(record)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Editar Valor
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Excluir */}
          <DropdownMenuItem
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isQuitado}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de confirmação para exclusão */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir o lançamento de <strong>{record.client_name}</strong> no valor de{" "}
              <strong>R$ {Number(record.value).toFixed(2)}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
