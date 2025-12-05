import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    borderBottomStyle: 'solid' as const,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#4B5563',
  },
  value: {
    width: '60%',
    color: '#1F2937',
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid' as const,
  },
  tableCol: {
    flex: 1,
  },
  terms: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    fontSize: 9,
    lineHeight: 1.5,
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  termItem: {
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#6B7280',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 10,
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    padding: 10,
    border: '1px solid #D1D5DB',
  },
  signatureTitle: {
    fontWeight: 'bold',
    marginBottom: 30,
  },
  signatureLine: {
    borderTop: '1px solid #9CA3AF',
    marginTop: 50,
    paddingTop: 5,
    fontSize: 9,
    color: '#6B7280',
  },
});

interface ContractPDFProps {
  reservation: {
    id: string;
    startDate: Date;
    endDate: Date;
    totalAmount: string;
    depositAmount?: string;
    cautionAmount?: string;
    insuranceAmount?: string;
    includeInsurance: boolean;
    createdAt: Date;
  };
  vehicle: {
    brand: string;
    model: string;
    year?: number;
    plate: string;
    vin?: string;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  team: {
    name: string;
    address?: string;
  };
  organization: {
    name: string;
  };
}

export const ContractPDF: React.FC<ContractPDFProps> = ({
  reservation,
  vehicle,
  customer,
  team,
  organization,
}) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const calculateDays = () => {
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CONTRAT DE LOCATION DE VÉHICULE</Text>
          <Text style={styles.subtitle}>
            Contrat N° {reservation.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.subtitle}>
            Édité le {formatDate(reservation.createdAt)}
          </Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entre les soussignés :</Text>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>LE LOUEUR :</Text>
            <Text>{organization.name}</Text>
            <Text>{team.name}</Text>
            {team.address && <Text>{team.address}</Text>}
          </View>

          <View>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>LE LOCATAIRE :</Text>
            <Text>{customer.firstName} {customer.lastName}</Text>
            <Text>Email : {customer.email}</Text>
            {customer.phone && <Text>Téléphone : {customer.phone}</Text>}
          </View>
        </View>

        {/* Véhicule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 1 - Véhicule loué</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Marque et modèle :</Text>
            <Text style={styles.value}>{vehicle.brand} {vehicle.model}</Text>
          </View>
          {vehicle.year && (
            <View style={styles.row}>
              <Text style={styles.label}>Année :</Text>
              <Text style={styles.value}>{vehicle.year}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Plaque :</Text>
            <Text style={styles.value}>{vehicle.plate}</Text>
          </View>
          {vehicle.vin && (
            <View style={styles.row}>
              <Text style={styles.label}>N° VIN :</Text>
              <Text style={styles.value}>{vehicle.vin}</Text>
            </View>
          )}
          {vehicle.mileage && (
            <View style={styles.row}>
              <Text style={styles.label}>Kilométrage :</Text>
              <Text style={styles.value}>{vehicle.mileage.toLocaleString()} km</Text>
            </View>
          )}
          {vehicle.fuelType && (
            <View style={styles.row}>
              <Text style={styles.label}>Carburant :</Text>
              <Text style={styles.value}>{vehicle.fuelType}</Text>
            </View>
          )}
          {vehicle.transmission && (
            <View style={styles.row}>
              <Text style={styles.label}>Transmission :</Text>
              <Text style={styles.value}>{vehicle.transmission}</Text>
            </View>
          )}
        </View>

        {/* Période */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 2 - Durée de la location</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date de début :</Text>
            <Text style={styles.value}>{formatDate(reservation.startDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de fin :</Text>
            <Text style={styles.value}>{formatDate(reservation.endDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Durée :</Text>
            <Text style={styles.value}>{calculateDays()} jour(s)</Text>
          </View>
        </View>

        {/* Prix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article 3 - Prix et conditions de paiement</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol}>Description</Text>
              <Text style={[styles.tableCol, { textAlign: 'right' }]}>Montant</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Location ({calculateDays()} jours)</Text>
              <Text style={[styles.tableCol, { textAlign: 'right' }]}>
                {formatCurrency(reservation.totalAmount)}
              </Text>
            </View>
            {reservation.depositAmount && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCol}>Acompte versé</Text>
                <Text style={[styles.tableCol, { textAlign: 'right' }]}>
                  {formatCurrency(reservation.depositAmount)}
                </Text>
              </View>
            )}
            {reservation.includeInsurance && reservation.insuranceAmount && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCol}>Assurance complémentaire</Text>
                <Text style={[styles.tableCol, { textAlign: 'right' }]}>
                  {formatCurrency(reservation.insuranceAmount)}
                </Text>
              </View>
            )}
            {reservation.cautionAmount && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCol}>Caution (préautorisée)</Text>
                <Text style={[styles.tableCol, { textAlign: 'right' }]}>
                  {formatCurrency(reservation.cautionAmount)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Conditions */}
        <View style={styles.terms}>
          <Text style={styles.termsTitle}>CONDITIONS GÉNÉRALES DE LOCATION</Text>
          
          <Text style={styles.termItem}>
            <Text style={{ fontWeight: 'bold' }}>Article 4 - État du véhicule : </Text>
            Le véhicule est remis au Locataire en bon état de marche, de propreté et de carrosserie. Un état des lieux contradictoire est effectué au départ et au retour. Le Locataire reconnaît avoir reçu le véhicule exempt de dommages, sauf ceux mentionnés sur l'état des lieux de départ. Tout dommage, rayure ou choc constaté au retour et non signalé au départ sera intégralement à la charge du Locataire.
          </Text>

          <Text style={styles.termItem}>
            <Text style={{ fontWeight: 'bold' }}>Article 5 - Usage du véhicule : </Text>
            Le Locataire s'engage à utiliser le véhicule en "bon père de famille". Il est formellement interdit : de sous-louer le véhicule, de transporter des passagers à titre onéreux, d'utiliser le véhicule pour l'apprentissage de la conduite, de participer à des compétitions sportives ou rallyes, de transporter des marchandises dangereuses ou illicites, de conduire sous l'emprise de l'alcool ou de stupéfiants. Le véhicule ne doit pas quitter le territoire autorisé sans l'accord écrit du Loueur.
          </Text>

          <Text style={styles.termItem}>
            <Text style={{ fontWeight: 'bold' }}>Article 6 - Assurances et Responsabilités : </Text>
            Le contrat inclut une assurance responsabilité civile aux tiers. En cas de vol, d'incendie ou de dommages au véhicule (responsable ou sans tiers identifié), la responsabilité du Locataire est limitée au montant de la franchise (caution), sauf en cas de négligence grave, d'ivresse ou de violation des conditions d'utilisation (Article 5) où la déchéance de garantie s'applique. Ne sont pas couverts par l'assurance (et restent à la charge totale du Locataire) : les dommages aux pneumatiques, jantes, bris de glace, erreurs de carburant, perte de clés, et les dommages intérieurs (tâches, déchirures, brûlures).
          </Text>

          <Text style={styles.termItem}>
            <Text style={{ fontWeight: 'bold' }}>Article 7 - Carburant et Kilométrage : </Text>
            Le carburant est à la charge du Locataire. Le véhicule doit être restitué avec le même niveau de carburant qu'au départ. À défaut, le complément sera facturé au tarif en vigueur majoré de frais de service de 20€. Le kilométrage inclus est défini dans les conditions particulières. Tout dépassement kilométrique sera facturé au tarif de 0,50€ par kilomètre supplémentaire.
          </Text>

          <Text style={styles.termItem}>
            <Text style={{ fontWeight: 'bold' }}>Article 8 - Entretien et Pannes : </Text>
            Le Locataire doit vérifier régulièrement les niveaux (huile, eau) et la pression des pneus. En cas de panne mécanique non due à une négligence du Locataire, le Loueur prend en charge les réparations. Aucune réparation ne peut être effectuée sans l'accord préalable du Loueur. En cas d'accident, le Locataire doit prévenir le Loueur immédiatement et transmettre le constat amiable dûment rempli sous 24 heures.
          </Text>

          <Text style={styles.termItem}>
            <Text style={{ fontWeight: 'bold' }}>Article 9 - Restitution et Pénalités : </Text>
            La location se termine par la restitution du véhicule, de ses clés et des papiers au Loueur, à l'heure et au lieu convenus. Tout retard de plus de 59 minutes entraînera la facturation automatique d'une journée de location supplémentaire. Le véhicule doit être rendu dans un état de propreté correct (intérieur et extérieur). Si un nettoyage approfondi est nécessaire, un forfait de nettoyage de 50€ à 150€ sera facturé.
          </Text>

          <Text style={styles.termItem}>
            <Text style={{ fontWeight: 'bold' }}>Article 10 - Amendes et Contraventions : </Text>
            Le Locataire est seul responsable des amendes, contraventions et procès-verbaux établis à son encontre pendant la période de location. En cas de réception d'une contravention par le Loueur, celle-ci sera désignée aux autorités compétentes et des frais de traitement administratif de 30€ seront facturés au Locataire.
          </Text>

          <Text style={styles.termItem}>
            <Text style={{ fontWeight: 'bold' }}>Article 11 - Juridiction : </Text>
            Le présent contrat est régi par la loi française. En cas de litige relatif à l'exécution du présent contrat, et à défaut d'accord amiable, les tribunaux du siège social du Loueur seront seuls compétents.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Le Loueur</Text>
            <Text style={styles.signatureLine}>Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Le Locataire</Text>
            <Text style={styles.signatureLine}>Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Document généré électroniquement le {formatDate(new Date())} - {organization.name}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
