import { useState, useEffect } from 'react';
import { Calendar, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBulkDueDateUpdate } from '@/hooks/useBulkDueDateUpdate';
import { useToast } from '@/hooks/use-toast';

interface BulkDueDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: {
    id: string;
    client_plan_id: string;
    client_name: string;
    due_date: string;
    status: string;
  } | null;
  onSuccess: () => void;
}

export function BulkDueDateDialog({ open, onOpenChange, record, onSuccess }: BulkDueDateDialogProps) {
  const [newDueDate, setNewDueDate] = useState('');
  const [applyToFuture, setApplyToFuture] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { 
    previewFutureRecords, 
    updateDueDateBulk, 
    reset, 
    previewData, 
    isLoading, 
    error 
  } = useBulkDueDateUpdate();
  const { toast } = useToast();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open && record) {
      setNewDueDate(record.due_date);
      setApplyToFuture(false);
      setShowConfirmation(false);
      reset();
    }
  }, [open, record]);

  // Fetch preview when checkbox is checked
  useEffect(() => {
    if (applyToFuture && record) {
      previewFutureRecords(record.id, record.client_plan_id, record.due_date);
    } else {
      reset();
    }
  }, [applyToFuture, record]);

  const handleSubmit = async () => {
    if (!record || !newDueDate) return;

    // Se vai aplicar em massa, mostrar confirmação primeiro
    if (applyToFuture && previewData && previewData.count > 0 && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    const result = await updateDueDateBulk(record.id, newDueDate, applyToFuture);

    if (result?.success) {
      toast({
        title: "Data(s) atualizada(s)!",
        description: `${result.updatedCount} registro(s) atualizado(s) com sucesso.`,
      });
      onSuccess();
      onOpenChange(false);
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error || "Erro ao atualizar data de vencimento.",
      });
    }
  };

  const canEdit = record?.status === 'pendente';

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Alterar Data de Vencimento
          </DialogTitle>
          <DialogDescription>
            Altere a data de vencimento do título e, opcionalmente, aplique aos próximos meses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cliente Info */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Input value={record.client_name} disabled />
          </div>

          {/* Data Atual */}
          <div className="space-y-2">
            <Label>Data Atual</Label>
            <Input 
              value={new Date(record.due_date).toLocaleDateString('pt-BR')} 
              disabled 
            />
          </div>

          {/* Nova Data */}
          <div className="space-y-2">
            <Label htmlFor="newDueDate">Nova Data de Vencimento *</Label>
            <Input
              id="newDueDate"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              disabled={!canEdit || isLoading}
            />
          </div>

          {/* Alerta se não pode editar */}
          {!canEdit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Não é possível alterar a data de títulos já quitados.
              </AlertDescription>
            </Alert>
          )}

          {/* Checkbox para aplicar em massa */}
          {canEdit && (
            <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/30">
              <Checkbox
                id="applyToFuture"
                checked={applyToFuture}
                onCheckedChange={(checked) => setApplyToFuture(checked === true)}
                disabled={isLoading}
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="applyToFuture" 
                  className="font-medium cursor-pointer"
                >
                  Aplicar aos próximos meses
                </Label>
                <p className="text-xs text-muted-foreground">
                  Altera automaticamente o dia de vencimento dos títulos futuros pendentes deste contrato.
                </p>
              </div>
            </div>
          )}

          {/* Preview de registros futuros */}
          {applyToFuture && isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando registros futuros...
            </div>
          )}

          {applyToFuture && previewData && !isLoading && (
            <Card className={previewData.count > 0 ? 'border-orange-200 bg-orange-50' : ''}>
              <CardContent className="p-4">
                {previewData.count > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-orange-700">
                      <Info className="h-4 w-4" />
                      <span className="font-medium">
                        {previewData.count} título(s) futuro(s) será(ão) alterado(s)
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 mt-2">
                      {previewData.records.slice(0, 5).map((r, idx) => (
                        <div key={r.id}>
                          {idx + 1}. {new Date(r.due_date).toLocaleDateString('pt-BR')} → Dia {parseInt(newDueDate.split('-')[2], 10)}
                        </div>
                      ))}
                      {previewData.count > 5 && (
                        <div className="italic">... e mais {previewData.count - 5} título(s)</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Nenhum título futuro pendente encontrado.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Confirmação Final */}
          {showConfirmation && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                <strong>Confirmar alteração em massa?</strong>
                <br />
                Esta ação alterará {(previewData?.count || 0) + 1} título(s) e não pode ser desfeita.
              </AlertDescription>
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                if (showConfirmation) {
                  setShowConfirmation(false);
                } else {
                  onOpenChange(false);
                }
              }}
              disabled={isLoading}
            >
              {showConfirmation ? 'Voltar' : 'Cancelar'}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!canEdit || !newDueDate || isLoading}
              variant={showConfirmation ? 'destructive' : 'default'}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {showConfirmation 
                ? `Confirmar (${(previewData?.count || 0) + 1} títulos)` 
                : applyToFuture && previewData && previewData.count > 0
                  ? 'Revisar Alterações'
                  : 'Salvar Data'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
