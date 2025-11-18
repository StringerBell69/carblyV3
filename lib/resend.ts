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
      from: 'Carbly <noreply@carbly.com>',
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
      from: 'Carbly <noreply@carbly.com>',
      to,
      subject: 'Paiement confirmé - Contrat à signer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10B981;">Paiement confirmé !</h1>
          <p>Bonjour ${customerName},</p>
          <p>Votre paiement a été reçu avec succès.</p>

          <p><strong>Véhicule :</strong> ${vehicle.brand} ${vehicle.model}</p>

          ${
            yousignLink
              ? `
          <p>Veuillez signer le contrat de location pour finaliser votre réservation :</p>
          <a href="${yousignLink}" style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Signer le contrat
          </a>
          `
              : '<p>Le contrat de location vous sera envoyé prochainement.</p>'
          }
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
      from: 'Carbly <noreply@carbly.com>',
      to,
      subject: 'Contrat signé - Location confirmée',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10B981;">Location confirmée !</h1>
          <p>Bonjour ${customerName},</p>
          <p>Votre contrat a été signé. Votre location est confirmée !</p>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Informations de retrait</h2>
            <p><strong>Véhicule :</strong> ${vehicle.brand} ${vehicle.model}</p>
            <p><strong>Date de retrait :</strong> ${dates.start}</p>
            <p><strong>Date de restitution :</strong> ${dates.end}</p>
            <p><strong>Adresse :</strong> ${pickupAddress}</p>
          </div>

          ${
            contractPdfUrl
              ? `
          <a href="${contractPdfUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Télécharger le contrat
          </a>
          `
              : ''
          }

          <p>À bientôt !</p>
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
      from: 'Carbly <noreply@carbly.com>',
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
