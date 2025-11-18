import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  console.warn('Twilio environment variables are not fully configured');
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS({
  to,
  body,
}: {
  to: string;
  body: string;
}) {
  if (!process.env.TWILIO_ACCOUNT_SID || !to) {
    console.log('SMS sending skipped (Twilio not configured or no phone number)');
    return null;
  }

  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to, // Format international: +33612345678
    });

    return message;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw error;
  }
}

export async function sendPaymentConfirmedSMS({
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
  const body = yousignLink
    ? `Carbly : Paiement confirmé pour votre ${vehicle.brand} ${vehicle.model}. Contrat à signer : ${yousignLink}`
    : `Carbly : Paiement confirmé pour votre ${vehicle.brand} ${vehicle.model}. Le contrat vous sera envoyé par email.`;

  return sendSMS({ to, body });
}

export async function sendContractSignedSMS({
  to,
  customerName,
  vehicle,
  pickupDate,
}: {
  to: string;
  customerName: string;
  vehicle: {
    brand: string;
    model: string;
  };
  pickupDate: string;
}) {
  const body = `Carbly : Location confirmée ! Retrait de votre ${vehicle.brand} ${vehicle.model} le ${pickupDate}. Consultez votre email pour les détails.`;

  return sendSMS({ to, body });
}

export async function sendReturnReminderSMS({
  to,
  customerName,
  vehicle,
  returnDate,
}: {
  to: string;
  customerName: string;
  vehicle: {
    brand: string;
    model: string;
  };
  returnDate: string;
}) {
  const body = `Carbly : Rappel restitution ${vehicle.brand} ${vehicle.model} demain ${returnDate}. Même niveau de carburant requis.`;

  return sendSMS({ to, body });
}
