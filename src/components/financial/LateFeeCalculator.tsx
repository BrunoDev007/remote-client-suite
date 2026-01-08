import { useState, useEffect } from 'react';
import { Calculator, Eraser, AlertCircle, CheckCircle2, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLateFeeCalculator, LateFeeResult } from '@/hooks/useLateFeeCalculator';
import { useClients } from '@/hooks/useClients';
import { useClientPendingRecords, ClientPendingRecord } from '@/hooks/useClientPendingRecords';

export function LateFeeCalculator() {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [valorDevido, setValorDevido] = useState<string>('');
  const [dataVencimento, setDataVencimento] = useState<string>('');
  const [dataPagamento, setDataPagamento] = useState<string>('');
  const [diasAtraso, setDiasAtraso] = useState<number>(0);
  const [manualMode, setManualMode] = useState(false);

  const { calculate, reset, result, isLoading, error } = useLateFeeCalculator();
  const { clients, loading: loadingClients } = useClients();
  const { records: pendingRecords, fetchPendingRecords, isLoading: loadingRecords, reset: resetRecords } = useClientPendingRecords();

  // Buscar registros pendentes quando cliente é selecionado
  useEffect(() => {
    if (selectedClientId) {
      fetchPendingRecords(selectedClientId);
      setSelectedRecordId('');
      if (!manualMode) {
        setValorDevido('');
        setDataVencimento('');
      }
    } else {
      resetRecords();
    }
  }, [selectedClientId]);

  // Preencher campos quando um registro é selecionado
  useEffect(() => {
    if (selectedRecordId && pendingRecords.length > 0) {
      const record = pendingRecords.find(r => r.id === selectedRecordId);
      if (record) {
        setValorDevido(record.value.toFixed(2).replace('.', ','));
        setDataVencimento(record.due_date);
        setManualMode(false);
      }
    }
  }, [selectedRecordId, pendingRecords]);

  // Calcular dias em atraso automaticamente
  useEffect(() => {
    if (dataVencimento) {
      const vencimento = new Date(dataVencimento);
      const pagamento = dataPagamento ? new Date(dataPagamento) : new Date();
      
      vencimento.setUTCHours(0, 0, 0, 0);
      pagamento.setUTCHours(0, 0, 0, 0);
      
      const diffTime = pagamento.getTime() - vencimento.getTime();
      const dias = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      setDiasAtraso(dias);
    } else {
      setDiasAtraso(0);
    }
  }, [dataVencimento, dataPagamento]);

  const handleCalculate = async () => {
    const valor = parseFloat(valorDevido.replace(',', '.'));
    
    if (isNaN(valor) || valor <= 0) {
      return;
    }

    await calculate({
      valorDevido: valor,
      dataVencimento,
      dataPagamento: dataPagamento || undefined
    });
  };

  const handleClear = () => {
    setSelectedClientId('');
    setSelectedRecordId('');
    setValorDevido('');
    setDataVencimento('');
    setDataPagamento('');
    setDiasAtraso(0);
    setManualMode(false);
    reset();
    resetRecords();
  };

  const handleManualInput = () => {
    setManualMode(true);
    setSelectedClientId('');
    setSelectedRecordId('');
    resetRecords();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isFormValid = valorDevido && parseFloat(valorDevido.replace(',', '.')) > 0 && dataVencimento;

  return (
    <div className="space-y-6">
      {/* Seleção de Cliente */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Selecionar Cliente (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select 
                value={selectedClientId} 
                onValueChange={(value) => {
                  setSelectedClientId(value);
                  setManualMode(false);
                }}
                disabled={loadingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente..." />
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
              <Label>Título Pendente</Label>
              <Select 
                value={selectedRecordId} 
                onValueChange={setSelectedRecordId}
                disabled={!selectedClientId || loadingRecords || pendingRecords.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedClientId 
                      ? "Selecione um cliente primeiro" 
                      : loadingRecords 
                        ? "Carregando..." 
                        : pendingRecords.length === 0 
                          ? "Sem títulos pendentes"
                          : "Selecione um título..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {pendingRecords.map(record => (
                    <SelectItem key={record.id} value={record.id}>
                      {record.plan_name} - R$ {record.value.toFixed(2)} - Vence {new Date(record.due_date).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleManualInput}
              className="text-xs"
            >
              Ou preencher manualmente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Entrada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valorDevido">Valor Devido *</Label>
          <Input
            id="valorDevido"
            type="text"
            placeholder="0,00"
            value={valorDevido}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d,.-]/g, '');
              setValorDevido(value);
              if (!manualMode && selectedRecordId) {
                setManualMode(true);
              }
            }}
            disabled={!manualMode && !selectedRecordId && !selectedClientId}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
          <Input
            id="dataVencimento"
            type="date"
            value={dataVencimento}
            onChange={(e) => {
              setDataVencimento(e.target.value);
              if (!manualMode && selectedRecordId) {
                setManualMode(true);
              }
            }}
            disabled={!manualMode && !selectedRecordId && !selectedClientId}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataPagamento">Data de Pagamento</Label>
          <Input
            id="dataPagamento"
            type="date"
            value={dataPagamento}
            onChange={(e) => setDataPagamento(e.target.value)}
            placeholder="Data atual se não informada"
          />
          <p className="text-xs text-muted-foreground">
            Se não informada, será usada a data atual
          </p>
        </div>

        <div className="space-y-2">
          <Label>Dias em Atraso</Label>
          <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
            <span className={`font-medium ${diasAtraso > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {diasAtraso} {diasAtraso === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </div>
      </div>

      {/* Mensagem quando não há atraso */}
      {dataVencimento && diasAtraso === 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Pagamento dentro do prazo. Não há multa ou mora a ser aplicada.
          </AlertDescription>
        </Alert>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <Button 
          onClick={handleCalculate} 
          disabled={!isFormValid || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="mr-2 h-4 w-4" />
          )}
          Calcular
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClear}
          disabled={isLoading}
        >
          <Eraser className="mr-2 h-4 w-4" />
          Limpar
        </Button>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultados */}
      {result && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Resultado do Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ResultRow 
                label="Valor Original" 
                value={formatCurrency(result.valorOriginal)} 
              />
              <ResultRow 
                label="Dias em Atraso" 
                value={`${result.diasAtraso} ${result.diasAtraso === 1 ? 'dia' : 'dias'}`}
                highlight={result.diasAtraso > 0 ? 'warning' : undefined}
              />
              <ResultRow 
                label={`Multa (${result.percentualMulta}%)`}
                value={formatCurrency(result.valorMulta)}
                highlight={result.valorMulta > 0 ? 'danger' : undefined}
              />
              <ResultRow 
                label={`Mora (${result.percentualMoraDiaria}% x ${result.diasAtraso} dias)`}
                value={formatCurrency(result.valorMora)}
                highlight={result.valorMora > 0 ? 'danger' : undefined}
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <ResultRow 
                label="Total de Encargos" 
                value={formatCurrency(result.totalEncargos)}
                highlight={result.totalEncargos > 0 ? 'danger' : undefined}
                large
              />
              <ResultRow 
                label="Valor Final a Pagar" 
                value={formatCurrency(result.valorFinal)}
                highlight="success"
                large
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre as regras */}
      <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-md">
        <p><strong>Regras de Cálculo:</strong></p>
        <p>• Multa: 2% sobre o valor devido (aplicada uma única vez)</p>
        <p>• Mora: 1% ao dia sobre o valor original</p>
        <p>• Encargos são aplicados apenas quando há atraso</p>
      </div>
    </div>
  );
}

interface ResultRowProps {
  label: string;
  value: string;
  highlight?: 'danger' | 'warning' | 'success';
  large?: boolean;
}

function ResultRow({ label, value, highlight, large }: ResultRowProps) {
  const highlightClasses = {
    danger: 'text-destructive',
    warning: 'text-orange-600',
    success: 'text-green-600 font-bold'
  };

  return (
    <div className={`flex justify-between items-center ${large ? 'text-base' : 'text-sm'}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${highlight ? highlightClasses[highlight] : ''} ${large ? 'text-lg' : ''}`}>
        {value}
      </span>
    </div>
  );
}
