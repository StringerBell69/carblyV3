'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, CheckCircle2, AlertCircle, Send, RefreshCw } from 'lucide-react';
import { generateReservationContract, sendContractForSignature, checkContractSignatureStatus } from '../../actions';
import { toast } from 'sonner';

interface ContractSectionProps {
  reservationId: string;
  contract?: {
    id: string;
    pdfUrl?: string | null;
    signedAt?: Date | null;
    signedPdfUrl?: string | null;
    yousignSignatureRequestId?: string | null;
  } | null;
  status: string;
}

export function ContractSection({ reservationId, contract, status }: ContractSectionProps) {
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleGenerateContract = async () => {
    setGenerating(true);
    try {
      const result = await generateReservationContract(reservationId);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Contrat généré avec succès');
        // Reload page to show updated contract
        window.location.reload();
      }
    } catch (error) {
      toast.error('Erreur lors de la génération du contrat');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendForSignature = async () => {
    setSending(true);
    try {
      const result = await sendContractForSignature(reservationId);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Contrat envoyé au client pour signature par email');
        // Reload page to show updated contract
        window.location.reload();
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du contrat');
    } finally {
      setSending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const result = await checkContractSignatureStatus(reservationId);
      if ('error' in result) {
        toast.error(result.error);
      } else if (result.status === 'signed') {
        toast.success(result.message || 'Contrat signé !');
        // Reload to show signed contract
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

  // Can't generate if not paid
  const canGenerate = status !== 'pending_payment' && status !== 'draft';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Contrat de location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contract?.signedAt && contract?.signedPdfUrl ? (
          // Contract is signed
          <>
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="font-medium">Contrat signé</p>
                <p className="text-sm text-gray-600">Le contrat a été signé électroniquement par le client</p>
              </div>
            </div>
            <a
              href={contract.signedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              Télécharger le contrat signé
            </a>
          </>
        ) : contract?.yousignSignatureRequestId ? (
          // Contract sent for signature
          <>
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
              <Send className="h-5 w-5" />
              <div>
                <p className="font-medium">✉️ En attente de signature du client</p>
                <p className="text-sm text-gray-600">Le contrat a été envoyé par email avec un lien de signature Yousign</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 space-y-2">
              <p className="font-medium">Le client doit :</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Cliquer sur le lien dans l'email</li>
                <li>Lire le contrat</li>
                <li>Entrer le code OTP reçu par {contract.pdfUrl?.includes('sms') ? 'SMS' : 'email'}</li>
                <li>Signer électroniquement</li>
              </ol>
              <p className="text-xs text-gray-500 mt-2">
                Vous serez automatiquement notifié une fois le contrat signé.
              </p>
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
                  Vérifier le statut de signature
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500">
              Si le client a déjà signé mais le statut n'est pas à jour, utilisez ce bouton pour rafraîchir
            </p>
            {contract.pdfUrl && (
              <a
                href={contract.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                Voir le contrat (non signé)
              </a>
            )}
          </>
        ) : contract?.pdfUrl ? (
          // Contract generated but not sent
          <>
            <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Contrat généré</p>
                <p className="text-sm text-gray-600">Vérifiez le contrat puis envoyez-le au client pour signature</p>
              </div>
            </div>
            <a
              href={contract.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              Télécharger et vérifier le contrat PDF
            </a>
            <div className="flex gap-2">
              <Button
                onClick={handleSendForSignature}
                disabled={sending}
                className="flex-1"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer pour signature
                  </>
                )}
              </Button>
              <Button
                onClick={handleCheckStatus}
                disabled={checking}
                variant="outline"
                className="flex-1"
              >
                {checking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Vérifier statut
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Si le contrat a déjà été envoyé/signé avant, cliquez sur "Vérifier statut" pour synchroniser
            </p>
          </>
        ) : (
          // No contract yet
          <>
            {!canGenerate && (
              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Paiement requis</p>
                  <p className="text-sm text-gray-600">Le contrat peut être généré une fois le paiement effectué</p>
                </div>
              </div>
            )}
            <Button
              onClick={handleGenerateContract}
              disabled={generating || !canGenerate}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Générer le contrat
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500">
              Le contrat sera généré en PDF et envoyé par email au client
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
