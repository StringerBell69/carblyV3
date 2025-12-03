'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { XCircle, AlertTriangle, Loader2, Euro } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CancelReservationButtonProps {
  reservationId: string;
  status: string;
  hasPayments: boolean;
  totalPaidOnline: number; // Montant total payé en ligne (via Stripe uniquement)
}

export function CancelReservationButton({
  reservationId,
  status,
  hasPayments,
  totalPaidOnline,
}: CancelReservationButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [refundAmount, setRefundAmount] = useState(totalPaidOnline);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Update refund amount when percentage changes
  useEffect(() => {
    const calculatedAmount = (totalPaidOnline * refundPercentage) / 100;
    setRefundAmount(Number(calculatedAmount.toFixed(2)));
  }, [refundPercentage, totalPaidOnline]);

  // Update percentage when amount changes
  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    if (amount >= 0 && amount <= totalPaidOnline) {
      setRefundAmount(amount);
      setRefundPercentage(Math.round((amount / totalPaidOnline) * 100));
    }
  };

  // Don't show button if already cancelled
  if (status === 'cancelled') {
    return null;
  }

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError('Veuillez indiquer une raison d\'annulation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
          refundAmount: refundAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation');
      }

      // Success - refresh page
      router.refresh();
      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <XCircle className="w-4 h-4 mr-2" />
          Annuler la réservation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Annuler la réservation</DialogTitle>
          <DialogDescription>
            Cette action ne peut pas être annulée. La réservation sera marquée comme annulée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Attention : Cette action est irréversible. Assurez-vous de vouloir annuler cette réservation.
            </AlertDescription>
          </Alert>

          {/* Refund Amount */}
          {hasPayments && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refund-percentage">
                  Pourcentage de remboursement ({refundPercentage}%)
                </Label>
                <Slider
                  id="refund-percentage"
                  min={0}
                  max={100}
                  step={5}
                  value={[refundPercentage]}
                  onValueChange={(value) => setRefundPercentage(value[0])}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-amount">
                  Montant du remboursement
                </Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="refund-amount"
                    type="number"
                    min={0}
                    max={totalPaidOnline}
                    step={0.01}
                    value={refundAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Maximum: {totalPaidOnline.toFixed(2)}€ (paiements en ligne uniquement)
                </p>
              </div>

              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                {refundAmount === 0 && 'Aucun remboursement ne sera effectué.'}
                {refundAmount > 0 && refundAmount < totalPaidOnline &&
                  `Remboursement partiel de ${refundAmount.toFixed(2)}€ (${refundPercentage}%).`}
                {refundAmount === totalPaidOnline &&
                  `Remboursement total de ${refundAmount.toFixed(2)}€.`}
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Raison de l'annulation <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Véhicule non disponible, demande du client, etc."
              className="min-h-[100px]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmer l'annulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
