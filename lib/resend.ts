import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not defined');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReservationPaymentEmail({
  to,
  customerName,
  vehicle,
  dates,
  amount,
  magicLink,
}: {
  to: string;
  customerName: string;
  vehicle: {
    brand: string;
    model: string;
    image?: string;
  };
  dates: {
    start: string;
    end: string;
  };
  amount: number;
  magicLink: string;
}) {
  try {
    await resend.emails.send({
      from: 'Carbly <carbly@sumbo.fr>',
      to,
      subject: `Votre réservation ${vehicle.brand} ${vehicle.model}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">Confirmez votre réservation</h1>
          <p>Bonjour ${customerName},</p>
          <p>Votre réservation est presque confirmée !</p>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Détails de la réservation</h2>
            <p><strong>Véhicule :</strong> ${vehicle.brand} ${vehicle.model}</p>
            <p><strong>Du :</strong> ${dates.start}</p>
            <p><strong>Au :</strong> ${dates.end}</p>
            <p><strong>Montant total :</strong> ${amount.toFixed(2)}€</p>
          </div>

          <a href="${magicLink}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Payer maintenant
          </a>

          <p style="color: #6B7280; font-size: 14px;">Ce lien est valable pendant 7 jours.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send reservation payment email:', error);
    throw error;
  }
}

export async function sendPaymentConfirmedEmail({
  to,
  customerName,
  vehicle,
  yousignLink,
}: {
  to: string;
  customerName: string;
  vehicle: {
    brand: string;
    model: string;
  };
  yousignLink?: string;
}) {
  try {
    await resend.emails.send({
      from: 'Carbly <carbly@sumbo.fr>',
      to,
      subject: '✅ Paiement confirmé - Signez votre contrat de location',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10B981;">✅ Paiement confirmé !</h1>
          <p>Bonjour ${customerName},</p>
          <p>Votre paiement a été reçu avec succès pour la location du véhicule <strong>${vehicle.brand} ${vehicle.model}</strong>.</p>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #166534;"><strong>✍️ Prochaine étape : Signature du contrat</strong></p>
          </div>

          ${
            yousignLink
              ? `
          <p>Pour finaliser votre réservation, veuillez signer électroniquement votre contrat de location en cliquant sur le bouton ci-dessous :</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${yousignLink}" style="display: inline-block; background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              📝 Signer mon contrat maintenant
            </a>
          </div>

          <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;">
              <strong>💡 Signature électronique sécurisée</strong><br/>
              La signature est 100% légale et sécurisée grâce à notre partenaire Yousign. Vous recevrez un code de vérification par ${yousignLink.includes('sms') ? 'SMS' : 'email'} pour valider votre signature.
            </p>
          </div>

          <p style="color: #6B7280; font-size: 14px;">
            Une fois le contrat signé, vous recevrez immédiatement une copie par email et tous les détails pour récupérer votre véhicule.
          </p>
          `
              : '<p>Le contrat de location vous sera envoyé prochainement.</p>'
          }

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />

          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            Des questions ? Répondez simplement à cet email, nous sommes là pour vous aider !
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send payment confirmed email:', error);
    throw error;
  }
}

export async function sendContractSignedEmail({
  to,
  customerName,
  vehicle,
  dates,
  pickupAddress,
  contractPdfUrl,
}: {
  to: string;
  customerName: string;
  vehicle: {
    brand: string;
    model: string;
  };
  dates: {
    start: string;
    end: string;
  };
  pickupAddress: string;
  contractPdfUrl?: string;
}) {
  try {
    await resend.emails.send({
      from: 'Carbly <carbly@sumbo.fr>',
      to,
      subject: '🎉 Contrat signé - Votre location est confirmée !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10B981;">🎉 Félicitations, votre location est confirmée !</h1>
          <p>Bonjour ${customerName},</p>
          <p>Votre contrat a été signé avec succès. Tout est prêt pour votre location !</p>

          <div style="background: #10B981; color: white; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <h2 style="margin: 0 0 16px 0; font-size: 20px;">📋 Récapitulatif de votre réservation</h2>
            <div style="background: rgba(255,255,255,0.2); padding: 16px; border-radius: 6px; text-align: left;">
              <p style="margin: 8px 0;"><strong>🚗 Véhicule :</strong> ${vehicle.brand} ${vehicle.model}</p>
              <p style="margin: 8px 0;"><strong>📅 Date de retrait :</strong> ${dates.start}</p>
              <p style="margin: 8px 0;"><strong>📅 Date de restitution :</strong> ${dates.end}</p>
              <p style="margin: 8px 0;"><strong>📍 Adresse :</strong> ${pickupAddress}</p>
            </div>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400E;"><strong>⚠️ À ne pas oublier pour le retrait :</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px; color: #92400E;">
              <li>Votre pièce d'identité</li>
              <li>Votre permis de conduire</li>
              <li>Une carte bancaire pour la caution (si applicable)</li>
            </ul>
          </div>

          ${
            contractPdfUrl
              ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${contractPdfUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              📄 Télécharger mon contrat signé
            </a>
          </div>
          `
              : ''
          }

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />

          <p style="color: #6B7280; font-size: 14px;">
            Nous avons hâte de vous accueillir ! Si vous avez des questions, n'hésitez pas à nous contacter en répondant à cet email.
          </p>

          <p style="color: #9CA3AF; font-size: 12px; margin: 24px 0 0 0;">
            À très bientôt,<br/>
            L'équipe Carbly
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send contract signed email:', error);
    throw error;
  }
}

export async function sendReturnReminderEmail({
  to,
  customerName,
  vehicle,
  returnDate,
  returnAddress,
}: {
  to: string;
  customerName: string;
  vehicle: {
    brand: string;
    model: string;
  };
  returnDate: string;
  returnAddress: string;
}) {
  try {
    await resend.emails.send({
      from: 'Carbly <carbly@sumbo.fr>',
      to,
      subject: 'Rappel : Restitution demain',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">Rappel de restitution</h1>
          <p>Bonjour ${customerName},</p>
          <p>N'oubliez pas de restituer votre véhicule demain.</p>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Véhicule :</strong> ${vehicle.brand} ${vehicle.model}</p>
            <p><strong>Date de restitution :</strong> ${returnDate}</p>
            <p><strong>Adresse :</strong> ${returnAddress}</p>
          </div>

          <p><strong>Merci de restituer le véhicule avec :</strong></p>
          <ul>
            <li>Le même niveau de carburant qu'au retrait</li>
            <li>Le véhicule propre</li>
            <li>Tous les documents de bord</li>
          </ul>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send return reminder email:', error);
    throw error;
  }
}

export async function sendBalancePaymentEmail({
  to,
  customerName,
  vehicle,
  dates,
  amounts,
  paymentUrl,
}: {
  to: string;
  customerName: string;
  vehicle: {
    brand: string;
    model: string;
  };
  dates: {
    start: string;
    end: string;
  };
  amounts: {
    totalReservation: number;
    depositPaid: number;
    balance: number;
    platformFees: number;
    totalToPay: number;
  };
  paymentUrl: string;
}) {
  try {
    await resend.emails.send({
      from: 'Carbly <carbly@sumbo.fr>',
      to,
      subject: `💳 Paiement du solde - ${vehicle.brand} ${vehicle.model}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">💳 Paiement du solde de votre réservation</h1>
          <p>Bonjour ${customerName},</p>
          <p>Votre agence de location vous demande de régler le solde de votre réservation.</p>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">📋 Détails de la réservation</h2>
            <p><strong>Véhicule :</strong> ${vehicle.brand} ${vehicle.model}</p>
            <p><strong>Du :</strong> ${dates.start}</p>
            <p><strong>Au :</strong> ${dates.end}</p>
          </div>

          <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1E40AF;">💰 Détail du paiement</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Montant total de la réservation</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${amounts.totalReservation.toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Acompte déjà payé</td>
                <td style="padding: 8px 0; text-align: right; color: #10B981;">- ${amounts.depositPaid.toFixed(2)}€</td>
              </tr>
              <tr style="border-top: 1px solid #D1D5DB;">
                <td style="padding: 8px 0; color: #6B7280;">Solde restant</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${amounts.balance.toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Frais de plateforme</td>
                <td style="padding: 8px 0; text-align: right; font-size: 14px;">${amounts.platformFees.toFixed(2)}€</td>
              </tr>
              <tr style="border-top: 2px solid #3B82F6;">
                <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #1E40AF;">Total à payer</td>
                <td style="padding: 12px 0; text-align: right; font-size: 20px; font-weight: bold; color: #1E40AF;">${amounts.totalToPay.toFixed(2)}€</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              💳 Payer le solde maintenant
            </a>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400E;"><strong>🔒 Paiement 100% sécurisé</strong></p>
            <p style="margin: 8px 0 0 0; color: #92400E; font-size: 14px;">Votre paiement est traité de manière sécurisée par Stripe. Vos données bancaires sont protégées.</p>
          </div>

          <p style="color: #6B7280; font-size: 14px;">
            Ce lien de paiement est sécurisé et unique à votre réservation. Si vous avez des questions, n'hésitez pas à nous contacter en répondant à cet email.
          </p>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />

          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            Merci de votre confiance,<br/>
            L'équipe Carbly
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send balance payment email:', error);
    throw error;
  }
}

export async function sendCancellationEmail({
  to,
  customerName,
  vehicle,
  dates,
  refundAmount,
  reason,
}: {
  to: string;
  customerName: string;
  vehicle: {
    brand: string;
    model: string;
  };
  dates: {
    start: string;
    end: string;
  };
  refundAmount: number; // Amount in euros
  reason?: string;
}) {
  try {
    const refundText =
      refundAmount === 0
        ? 'Aucun remboursement ne sera effectué selon notre politique d\'annulation.'
        : `Vous serez remboursé de ${refundAmount.toFixed(2)}€ dans les prochains jours.`;

    await resend.emails.send({
      from: 'Carbly <carbly@sumbo.fr>',
      to,
      subject: `❌ Annulation de votre réservation - ${vehicle.brand} ${vehicle.model}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #EF4444;">❌ Réservation annulée</h1>
          <p>Bonjour ${customerName},</p>
          <p>Nous vous confirmons l'annulation de votre réservation.</p>

          <div style="background: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #991B1B;">📋 Détails de la réservation annulée</h2>
            <p style="margin: 8px 0;"><strong>Véhicule :</strong> ${vehicle.brand} ${vehicle.model}</p>
            <p style="margin: 8px 0;"><strong>Date de début :</strong> ${dates.start}</p>
            <p style="margin: 8px 0;"><strong>Date de fin :</strong> ${dates.end}</p>
            ${reason ? `<p style="margin: 8px 0;"><strong>Raison :</strong> ${reason}</p>` : ''}
          </div>

          ${
            refundAmount > 0
              ? `
          <div style="background: #DBEAFE; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #1E40AF;"><strong>💰 Remboursement</strong></p>
            <p style="margin: 8px 0 0 0; color: #1E40AF;">${refundText}</p>
            <p style="margin: 8px 0 0 0; color: #1E40AF; font-size: 14px;">Le remboursement sera effectué sur le même moyen de paiement utilisé lors de la réservation. Délai : 5 à 10 jours ouvrés selon votre banque.</p>
          </div>
          `
              : `
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #92400E;"><strong>💰 Remboursement</strong></p>
            <p style="margin: 8px 0 0 0; color: #92400E;">${refundText}</p>
          </div>
          `
          }

          <p style="color: #6B7280;">
            Si vous avez des questions concernant cette annulation, n'hésitez pas à nous contacter en répondant à cet email.
          </p>

          <p style="color: #6B7280;">
            Nous espérons avoir le plaisir de vous servir à nouveau prochainement.
          </p>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />

          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            Cordialement,<br/>
            L'équipe Carbly
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
    throw error;
  }
}

// Alias for compatibility
export async function sendReservationPaymentLink({
  to,
  customerName,
  vehicleName,
  startDate,
  endDate,
  amount,
  magicLink,
}: {
  to: string;
  customerName: string;
  vehicleName: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  magicLink: string;
}) {
  return sendReservationPaymentEmail({
    to,
    customerName,
    vehicle: {
      brand: vehicleName.split(' ')[0],
      model: vehicleName.split(' ').slice(1).join(' '),
    },
    dates: {
      start: startDate.toLocaleDateString('fr-FR'),
      end: endDate.toLocaleDateString('fr-FR'),
    },
    amount,
    magicLink,
  });
}

export async function sendResetPasswordEmail({
  to,
  url,
  token,
}: {
  to: string;
  url: string;
  token: string;
}) {
  try {
    await resend.emails.send({
      from: 'Carbly <carbly@sumbo.fr>',
      to,
      subject: '🔑 Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">🔑 Réinitialisation de mot de passe</h1>
          <p>Bonjour,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe Carbly.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🔐 Réinitialiser mon mot de passe
            </a>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400E;"><strong>⚠️ Sécurité</strong></p>
            <p style="margin: 8px 0 0 0; color: #92400E; font-size: 14px;">
              Ce lien est valable pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
          </div>

          <p style="color: #6B7280; font-size: 14px;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br/>
            <a href="${url}" style="color: #3B82F6; word-break: break-all;">${url}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />

          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            L'équipe Carbly
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send reset password email:', error);
    throw error;
  }
}
