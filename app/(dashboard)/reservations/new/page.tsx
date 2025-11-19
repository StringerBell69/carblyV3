'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  ArrowLeft,
  Car,
  Calendar,
  User,
  CheckCircle,
  CircleDot,
  DollarSign,
  Shield,
  Mail,
  Phone,
  FileText,
  Clock,
} from 'lucide-react';
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

      const rental = calculateRentalPrice(
        parseFloat(selectedVehicle.dailyRate),
        start,
        end
      );

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

  const steps = [
    { number: 1, label: 'Véhicule', icon: Car },
    { number: 2, label: 'Dates', icon: Calendar },
    { number: 3, label: 'Client', icon: User },
    { number: 4, label: 'Confirmation', icon: CheckCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/reservations" className="text-primary hover:underline mb-4 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux réservations
        </Link>
        <h1 className="text-3xl font-bold">Nouvelle réservation</h1>
        <p className="text-gray-600 mt-1">Créez une location pour un client</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, index) => {
            const StepIcon = s.icon;
            const isActive = step === s.number;
            const isCompleted = step > s.number;

            return (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                      isActive
                        ? 'border-primary bg-primary text-white'
                        : isCompleted
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted bg-background text-muted-foreground'
                    }`}
                  >
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isActive || isCompleted ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <Separator
                    className={`flex-1 mx-2 ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2">
                <Car className="h-5 w-5 text-primary" />
              </div>
              Choisir un véhicule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep1} className="space-y-4">
              {vehicles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-muted p-6">
                      <Car className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Aucun véhicule disponible.
                  </p>
                  <Link href="/vehicles/new">
                    <Button variant="outline">
                      <Car className="mr-2 h-4 w-4" />
                      Ajouter un véhicule
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedVehicleId === vehicle.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-md p-2 ${
                          selectedVehicleId === vehicle.id ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Car className={`h-5 w-5 ${
                            selectedVehicleId === vehicle.id ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {vehicle.brand} {vehicle.model}
                          </h4>
                          <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(parseFloat(vehicle.dailyRate))}/jour
                            </p>
                          </div>
                        </div>
                      </div>
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
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                Dates de location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Date de début *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    Date de fin *
                  </Label>
                  <Input
                    id="endDate"
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
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Aperçu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Durée</p>
                    <p className="font-semibold">{preview.days} jour(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Tarif journalier</p>
                    <p className="font-semibold">{formatCurrency(parseFloat(selectedVehicle.dailyRate))}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="font-semibold">Total estimé</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(preview.subtotal)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2">
                <User className="h-5 w-5 text-primary" />
              </div>
              Informations client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep3} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Prénom *
                  </Label>
                  <Input
                    id="firstName"
                    value={customerData.firstName}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nom *
                  </Label>
                  <Input
                    id="lastName"
                    value={customerData.lastName}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Téléphone
                </Label>
                <Input
                  id="phone"
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
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Récapitulatif
              </h4>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Véhicule</span>
                  </div>
                  <span className="font-medium">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Client</span>
                  </div>
                  <span className="font-medium">
                    {customerData.firstName} {customerData.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Durée</span>
                  </div>
                  <span className="font-medium">{preview.days} jour(s)</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{formatCurrency(preview.subtotal)}</span>
                </div>
                {includeInsurance && (
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Assurance</span>
                    </div>
                    <span className="font-medium">{formatCurrency(preview.insurance)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="font-bold">Total</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{formatCurrency(preview.total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="insurance"
                  checked={includeInsurance}
                  onCheckedChange={(checked) => setIncludeInsurance(checked === true)}
                />
                <Label htmlFor="insurance" className="flex items-center gap-2 text-sm font-normal cursor-pointer flex-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Inclure assurance (5€/jour)
                </Label>
              </div>
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
