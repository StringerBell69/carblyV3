'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReservationSuccessPage() {
  useEffect(() => {
    // You could fetch updated reservation status here if needed
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <CardTitle className="text-2xl">Paiement réussi !</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Votre réservation a été confirmée avec succès.
            </p>
            <div className="bg-green-50 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-medium text-green-800">✓ Paiement confirmé</p>
              <p className="font-medium text-green-800">✓ Email de confirmation envoyé</p>
              <p className="font-medium text-green-800">✓ Contrat en cours de génération</p>
            </div>
            <p className="text-sm text-gray-600">
              Vous allez recevoir un email avec le contrat de location à signer
              électroniquement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
