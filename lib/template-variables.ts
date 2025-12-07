/**
 * Template variable replacement utility
 * Replaces {{variable}} placeholders with actual values from reservation/customer data
 */

export interface TemplateVariables {
  clientPrenom?: string;
  clientNom?: string;
  clientEmail?: string;
  vehiculeMarque?: string;
  vehiculeModele?: string;
  dateDebut?: string;
  dateFin?: string;
  montantTotal?: string;
  montantAcompte?: string;
  adresseAgence?: string;
  nomAgence?: string;
}

/**
 * Replace all template variables in a message
 * Variables use the format {{variableName}}
 */
export function replaceTemplateVariables(
  message: string,
  variables: TemplateVariables
): string {
  let result = message;

  // Replace each variable
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  });

  return result;
}

/**
 * Build template variables from reservation and related data
 */
export function buildTemplateVariables(data: {
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string;
  };
  vehicle?: {
    brand?: string;
    model?: string;
  };
  reservation?: {
    startDate?: Date;
    endDate?: Date;
    totalAmount?: string;
    depositAmount?: string | null;
  };
  team?: {
    name?: string;
    address?: string | null;
  };
}): TemplateVariables {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return {
    clientPrenom: data.customer?.firstName || '',
    clientNom: data.customer?.lastName || '',
    clientEmail: data.customer?.email || '',
    vehiculeMarque: data.vehicle?.brand || '',
    vehiculeModele: data.vehicle?.model || '',
    dateDebut: formatDate(data.reservation?.startDate),
    dateFin: formatDate(data.reservation?.endDate),
    montantTotal: data.reservation?.totalAmount || '',
    montantAcompte: data.reservation?.depositAmount || '',
    adresseAgence: data.team?.address || data.team?.name || '',
    nomAgence: data.team?.name || 'Carbly',
  };
}
