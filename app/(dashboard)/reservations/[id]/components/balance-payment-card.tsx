'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Send, Loader2, CheckCircle2, AlertCircle, Banknote } from 'lucide-react';
import { sendBalancePaymentLink, markBalanceAsPaidCash } from '../../actions';
import { toast } from 'sonner';

interface BalancePaymentCardProps {
  reservationId: string;
  totalAmount: number;
  depositAmount: number;
  platformFees: number;
  customerEmail?: string;
  customerName?: string;
  balanceAlreadyPaid: boolean;
  depositPaid: boolean;
}

export function BalancePaymentCard({
  reservationId,
  totalAmount,
  depositAmount,
  platformFees,
  customerEmail,
  customerName,
  balanceAlreadyPaid,
  depositPaid,
}: BalancePaymentCardProps) {
  const [isSending, setIsSending] = useState(false);
  const [isMarkingCash, setIsMarkingCash] = useState(false);

  const balanceBeforeFees = totalAmount - depositAmount;
  const totalBalance = balanceBeforeFees + platformFees;

  const handleSendBalanceLink = async () => {
    setIsSending(true);
    try {
      const result = await sendBalancePaymentLink(reservationId);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success(`Lien de paiement du solde envoyé à ${customerEmail}`);
        // Reload page to show updated state
        window.location.reload();
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du lien de paiement du solde');
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsPaidCash = async () => {
    const confirmMessage = `Confirmer que le client a payé ${balanceBeforeFees.toFixed(2)}€ en espèces ?\n\n(Pas de frais Carbly pour les paiements en espèces)`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsMarkingCash(true);
    try {
      const result = await markBalanceAsPaidCash(reservationId);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success(`Solde de ${balanceBeforeFees.toFixed(2)}€ marqué comme payé en espèces`);
        // Reload page to show updated state
        window.location.reload();
      }
    } catch (error) {
      toast.error('Erreur lors du marquage du paiement');
    } finally {
      setIsMarkingCash(false);
    }
  };

  // If balance is already paid, show success message
  if (balanceAlreadyPaid) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle2 className="h-5 w-5" />
            Solde payé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-green-800">
              Le solde de la réservation a été payé avec succès.
            </p>
            <div className="bg-green-100 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-green-900">Solde payé</span>
                <span className="font-semibold text-green-900">
                  {totalBalance.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If deposit hasn't been paid yet
  if (!depositPaid) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <AlertCircle className="h-5 w-5" />
            Paiement du solde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            L'acompte doit être payé avant de pouvoir demander le paiement du solde.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show balance payment request option
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <DollarSign className="h-5 w-5" />
          Paiement du solde
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-blue-800">
            Demandez au client de payer le solde restant de la réservation.
          </p>

          <div className="bg-blue-100 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-900">Montant total</span>
              <span className="font-medium">{totalAmount.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-900">Acompte déjà payé</span>
              <span className="font-medium text-green-600">- {depositAmount.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm border-t-2 border-blue-400 pt-2 mt-2">
              <span className="font-bold text-blue-900">Solde restant</span>
              <span className="font-bold text-lg text-blue-900">{balanceBeforeFees.toFixed(2)}€</span>
            </div>
            <div className="text-xs text-blue-700 mt-2 bg-blue-50 p-2 rounded">
              <strong>💳 Paiement en ligne :</strong> {balanceBeforeFees.toFixed(2)}€ + {platformFees.toFixed(2)}€ de frais = {totalBalance.toFixed(2)}€
              <br />
              <strong>💵 Paiement en espèces :</strong> {balanceBeforeFees.toFixed(2)}€ (sans frais)
            </div>
          </div>

          <div className="space-y-2">
            {customerEmail && (
              <Button
                onClick={handleSendBalanceLink}
                disabled={isSending || isMarkingCash}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer le lien de paiement en ligne
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleMarkAsPaidCash}
              disabled={isSending || isMarkingCash}
              variant="outline"
              className="w-full"
            >
              {isMarkingCash ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Marquage en cours...
                </>
              ) : (
                <>
                  <Banknote className="mr-2 h-4 w-4" />
                  Marquer comme payé en espèces
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>💳 Paiement en ligne :</strong> Le client paie {totalBalance.toFixed(2)}€ (solde + frais Carbly)</p>
            <p><strong>💵 Paiement en espèces :</strong> Le client paie {balanceBeforeFees.toFixed(2)}€ (solde uniquement, sans frais)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
