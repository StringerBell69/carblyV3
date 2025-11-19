'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Check } from 'lucide-react';

export default function ReservationSuccessPage() {
  useEffect(() => {
    // You could fetch updated reservation status here if needed
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md border-green-200">
        <CardHeader>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900">Paiement réussi !</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Votre réservation a été confirmée avec succès
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Paiement confirmé</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Email de confirmation envoyé</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Contrat en cours de génération</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Vous allez recevoir un email avec le contrat de location à signer électroniquement dans les prochaines minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
