import { db } from '@/lib/db';
import { messageTemplates } from '@/drizzle/schema';
import { eq, isNull } from 'drizzle-orm';

export const defaultTemplates = [
  {
    name: 'Confirmation de réservation',
    type: 'email' as const,
    subject: '✅ Réservation confirmée - {{vehiculeMarque}} {{vehiculeModele}}',
    message: `Bonjour {{clientPrenom}},

Nous vous confirmons votre réservation !

📋 Détails de la réservation :
• Véhicule : {{vehiculeMarque}} {{vehiculeModele}}
• Du : {{dateDebut}}
• Au : {{dateFin}}
• Montant total : {{montantTotal}}€

📍 Adresse de retrait : {{adresseAgence}}

⚠️ N'oubliez pas d'apporter :
- Votre pièce d'identité
- Votre permis de conduire
- Une carte bancaire pour la caution

À très bientôt !
L'équipe {{nomAgence}}`,
  },
  {
    name: 'Rappel de retrait',
    type: 'sms' as const,
    subject: null,
    message: '🚗 Rappel : votre location {{vehiculeMarque}} {{vehiculeModele}} commence demain le {{dateDebut}}. RDV à {{adresseAgence}}. À bientôt !',
  },
  {
    name: 'Rappel de restitution',
    type: 'sms' as const,
    subject: null,
    message: '⏰ Rappel : merci de restituer votre {{vehiculeMarque}} {{vehiculeModele}} demain ({{dateFin}}) à {{adresseAgence}}. Bonne route !',
  },
  {
    name: 'Rappel de restitution (Email)',
    type: 'email' as const,
    subject: '⏰ Rappel : Restitution demain - {{vehiculeMarque}} {{vehiculeModele}}',
    message: `Bonjour {{clientPrenom}},

N'oubliez pas de restituer votre véhicule demain !

📋 Rappel de votre location :
• Véhicule : {{vehiculeMarque}} {{vehiculeModele}}
• Date de restitution : {{dateFin}}
• Adresse : {{adresseAgence}}

✅ Merci de restituer le véhicule avec :
- Le même niveau de carburant qu'au retrait
- Tous les documents de bord
- Le véhicule propre

Merci de votre confiance !
L'équipe {{nomAgence}}`,
  },
  {
    name: 'Contrat signé',
    type: 'email' as const,
    subject: '🎉 Contrat signé - Votre location est confirmée !',
    message: `Bonjour {{clientPrenom}},

Votre contrat a été signé avec succès. Tout est prêt pour votre location !

📋 Récapitulatif :
• Véhicule : {{vehiculeMarque}} {{vehiculeModele}}
• Date de retrait : {{dateDebut}}
• Date de restitution : {{dateFin}}
• Adresse : {{adresseAgence}}

⚠️ À ne pas oublier :
- Votre pièce d'identité
- Votre permis de conduire
- Une carte bancaire pour la caution

Nous avons hâte de vous accueillir !
L'équipe {{nomAgence}}`,
  },
  {
    name: 'Remerciement après location',
    type: 'email' as const,
    subject: '🙏 Merci pour votre location !',
    message: `Bonjour {{clientPrenom}},

Merci d'avoir fait confiance à {{nomAgence}} pour votre location de {{vehiculeMarque}} {{vehiculeModele}} !

Nous espérons que tout s'est bien passé et que vous avez apprécié votre expérience.

📝 Votre avis compte
N'hésitez pas à nous laisser un avis pour nous aider à nous améliorer.

À très bientôt pour une prochaine location !
L'équipe {{nomAgence}}`,
  },
  {
    name: 'Rappel de paiement',
    type: 'email' as const,
    subject: '💳 Rappel : Paiement en attente',
    message: `Bonjour {{clientPrenom}},

Nous n'avons pas encore reçu le paiement pour votre réservation.

📋 Détails :
• Véhicule : {{vehiculeMarque}} {{vehiculeModele}}
• Du : {{dateDebut}}
• Au : {{dateFin}}
• Montant : {{montantTotal}}€

Veuillez procéder au paiement pour confirmer votre réservation.

Besoin d'aide ? Contactez-nous !
L'équipe {{nomAgence}}`,
  },
  {
    name: 'Retard de restitution',
    type: 'sms' as const,
    subject: null,
    message: "⚠️ Votre location {{vehiculeMarque}} {{vehiculeModele}} devait être restituée. Merci de nous contacter au plus vite. Des frais de retard peuvent s'appliquer.",
  },
];

/**
 * Seeds default message templates
 * Deletes existing default templates and creates new ones
 */
export async function seedDefaultTemplates() {
  try {
    // Check if default templates already exist
    const existing = await db.query.messageTemplates.findMany({
      where: eq(messageTemplates.isDefault, true),
    });

    // If templates exist and they're the old English ones, delete them
    if (existing.length > 0) {
      const hasOldTemplates = existing.some(t => t.name === 'Booking Confirmation' || t.name === 'Thank You Message');
      
      if (!hasOldTemplates) {
        console.log(`French default templates already exist (${existing.length} found)`);
        return existing;
      }
      
      // Delete old templates
      console.log('Deleting old English templates...');
      await db.delete(messageTemplates).where(eq(messageTemplates.isDefault, true));
    }

    // Insert default templates
    const inserted = await db
      .insert(messageTemplates)
      .values(
        defaultTemplates.map((template) => ({
          ...template,
          teamId: null, // System-wide template
          isDefault: true,
        }))
      )
      .returning();

    console.log(`Created ${inserted.length} French default templates`);
    return inserted;
  } catch (error) {
    console.error('Failed to seed default templates:', error);
    throw error;
  }
}

/**
 * Gets all default templates (system-wide)
 */
export async function getDefaultTemplates() {
  return db.query.messageTemplates.findMany({
    where: eq(messageTemplates.isDefault, true),
  });
}
