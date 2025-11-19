'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Copy, Send, Check } from 'lucide-react';
import { resendPaymentLink } from '../actions';
import { toast } from 'sonner';

interface PaymentLinkCardProps {
  magicLink: string;
  reservationId: string;
  customerEmail: string;
  customerName: string;
}

export function PaymentLinkCard({
  magicLink,
  reservationId,
  customerEmail,
  customerName,
}: PaymentLinkCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(magicLink);
      setIsCopied(true);
      toast.success('Lien copié dans le presse-papier !');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const result = await resendPaymentLink(reservationId);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success(`Lien de paiement envoyé à ${customerEmail}`);
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900">
          <AlertCircle className="h-5 w-5" />
          Lien de paiement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-yellow-800">
            Partagez ce lien avec <strong>{customerName}</strong> pour qu'il puisse payer sa réservation
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={magicLink}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md text-sm bg-white"
            />
            <Button
              onClick={handleCopy}
              variant={isCopied ? 'default' : 'outline'}
              className="min-w-[100px]"
            >
              {isCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copier
                </>
              )}
            </Button>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSendEmail}
              disabled={isSending}
              className="flex-1"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSending ? 'Envoi en cours...' : `Envoyer à ${customerEmail}`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
