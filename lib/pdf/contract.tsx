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
    borderBottom: '2px solid #3B82F6',
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
    borderBottom: '1px solid #E5E7EB',
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
          <Text style={styles.termsTitle}>Article 4 - Conditions générales</Text>
          <Text style={styles.termItem}>
            4.1. Le locataire s'engage à restituer le véhicule dans l'état où il lui a été remis.
          </Text>
          <Text style={styles.termItem}>
            4.2. Le locataire est responsable du véhicule pendant toute la durée de la location.
          </Text>
          <Text style={styles.termItem}>
            4.3. Le véhicule doit être restitué avec le même niveau de carburant.
          </Text>
          <Text style={styles.termItem}>
            4.4. Toute prolongation doit être autorisée par le loueur.
          </Text>
          <Text style={styles.termItem}>
            4.5. Le locataire s'engage à respecter le code de la route.
          </Text>
          <Text style={styles.termItem}>
            4.6. La caution sera débloquée dans les 7 jours suivant la restitution sans dommage.
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
