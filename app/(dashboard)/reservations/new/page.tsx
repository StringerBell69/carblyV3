'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createReservation, createCustomer, checkVehicleAvailability } from '../actions';
import { getVehicles } from '../../vehicles/actions';
import { formatCurrency, calculateRentalPrice, calculateDays } from '@/lib/utils';

export default function NewReservationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerId, setCustomerId] = useState('');

  const [customerData, setCustomerData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [collectCautionOnline, setCollectCautionOnline] = useState(false);
  const [depositPercent, setDepositPercent] = useState('30');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    const result = await getVehicles({ status: 'available' });
    if (!result.error && result.vehicles) {
      setVehicles(result.vehicles);
    }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) {
      setError('Véhicule non trouvé');
      return;
    }

    setSelectedVehicle(vehicle);
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        throw new Error('La date de fin doit être après la date de début');
      }

      const result = await checkVehicleAvailability({
        vehicleId: selectedVehicleId,
        startDate: start,
        endDate: end,
      });

      if (result.error || !result.isAvailable) {
        throw new Error('Véhicule non disponible pour ces dates');
      }

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createCustomer(customerData);

      if (result.error) {
        throw new Error(result.error);
      }

      setCustomerId(result.customer!.id);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur création client');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const rental = calculateRentalPrice({
        dailyRate: parseFloat(selectedVehicle.dailyRate),
        startDate: start,
        endDate: end,
        depositAmount: (parseFloat(selectedVehicle.dailyRate) * calculateDays(start, end) * parseFloat(depositPercent)) / 100,
        insuranceAmount: includeInsurance ? 5 * calculateDays(start, end) : 0,
      });

      const result = await createReservation({
        vehicleId: selectedVehicleId,
        customerId,
        startDate: start,
        endDate: end,
        depositAmount: ((parseFloat(selectedVehicle.dailyRate) * calculateDays(start, end) * parseFloat(depositPercent)) / 100).toFixed(2),
        includeInsurance,
        insuranceAmount: includeInsurance ? (5 * calculateDays(start, end)).toFixed(2) : undefined,
        collectCautionOnline,
        cautionAmount: collectCautionOnline && selectedVehicle.depositAmount
          ? selectedVehicle.depositAmount
          : undefined,
        internalNotes,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      router.push(`/reservations/${result.reservation!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur création réservation');
    } finally {
      setLoading(false);
    }
  };

  const calculatePreview = () => {
    if (!selectedVehicle || !startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = calculateDays(start, end);

    if (days <= 0) return null;

    const dailyRate = parseFloat(selectedVehicle.dailyRate);
    const subtotal = dailyRate * days;
    const deposit = (subtotal * parseFloat(depositPercent)) / 100;
    const insurance = includeInsurance ? 5 * days : 0;
    const total = subtotal + insurance;

    return { days, subtotal, deposit, insurance, total, remaining: total - deposit };
  };

  const preview = calculatePreview();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/reservations" className="text-primary hover:underline mb-4 inline-block">
          ← Retour aux réservations
        </Link>
        <h1 className="text-3xl font-bold">Nouvelle réservation</h1>
        <p className="text-gray-600 mt-1">Créez une location pour un client</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Étape {step} sur 4</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choisir un véhicule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep1} className="space-y-4">
              {vehicles.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  Aucun véhicule disponible.{' '}
                  <Link href="/vehicles/new" className="text-primary hover:underline">
                    Ajouter un véhicule
                  </Link>
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedVehicleId === vehicle.id
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-semibold">
                        {vehicle.brand} {vehicle.model}
                      </h4>
                      <p className="text-sm text-gray-600">{vehicle.plate}</p>
                      <p className="text-lg font-bold text-primary mt-2">
                        {formatCurrency(parseFloat(vehicle.dailyRate))}/jour
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" disabled={!selectedVehicleId} className="w-full">
                Continuer
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dates de location</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de début *</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de fin *</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Vérification...' : 'Continuer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {preview && (
            <Card>
              <CardHeader>
                <CardTitle>Aperçu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Durée</span>
                  <span className="font-medium">{preview.days} jour(s)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tarif journalier</span>
                  <span>{formatCurrency(parseFloat(selectedVehicle.dailyRate))}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(preview.subtotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Informations client</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep3} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom *</label>
                  <Input
                    value={customerData.firstName}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    value={customerData.lastName}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={customerData.email}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, phone: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Retour
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Création...' : 'Continuer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 4 && preview && (
        <Card>
          <CardHeader>
            <CardTitle>Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold">Récapitulatif</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Véhicule</span>
                  <span className="font-medium">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Client</span>
                  <span className="font-medium">
                    {customerData.firstName} {customerData.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Durée</span>
                  <span className="font-medium">{preview.days} jour(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formatCurrency(preview.subtotal)}</span>
                </div>
                {includeInsurance && (
                  <div className="flex justify-between">
                    <span>Assurance</span>
                    <span>{formatCurrency(preview.insurance)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(preview.total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeInsurance}
                  onChange={(e) => setIncludeInsurance(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Inclure assurance (5€/jour)</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                Retour
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Création...' : 'Créer la réservation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
