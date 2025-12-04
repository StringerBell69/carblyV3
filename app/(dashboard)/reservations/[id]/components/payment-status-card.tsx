'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { checkPaymentStatus } from '../../actions';
import { toast } from 'sonner';

interface PaymentStatusCardProps {
  reservationId: string;
}

export function PaymentStatusCard({ reservationId }: PaymentStatusCardProps) {
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const result = await checkPaymentStatus(reservationId);
      if ('error' in result) {
        toast.error(result.error);
      } else if (result.status === 'paid') {
        toast.success(result.message || 'Paiement confirmé !');
        // Reload to show updated status
        window.location.reload();
      } else {
        toast.info(result.message || `Statut: ${result.status}`);
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification du statut');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Vérification du paiement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">En attente de paiement</p>
            <p className="text-sm text-gray-600">
              Le client doit compléter le paiement via le lien envoyé
            </p>
          </div>
        </div>
        <Button
          onClick={handleCheckStatus}
          disabled={checking}
          variant="outline"
          className="w-full"
        >
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Vérification en cours...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Vérifier le statut du paiement
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500">
          Si le client a déjà payé mais le statut n'est pas à jour, utilisez ce bouton pour rafraîchir
        </p>
      </CardContent>
    </Card>
  );
}
