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
  Euro,
  Shield,
  Mail,
  Phone,
  FileText,
  Clock,
} from 'lucide-react';
import { createReservation, createCustomer, checkVehicleAvailability, searchCustomers, getVehicleBookedDates } from '../actions';
import { getVehicles } from '../../vehicles/actions';
import { formatCurrency, calculateRentalPrice, calculateDays, formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import PhoneInput from "react-phone-input-2";

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateRangeWarning, setDateRangeWarning] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerMode, setCustomerMode] = useState<'new' | 'existing' | 'self-fill'>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

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

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (customerMode === 'existing' && debouncedSearchQuery.length >= 3) {
      handleSearchCustomers();
    } else {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, customerMode]);

  const loadVehicles = async () => {
    const result = await getVehicles({ status: 'available' });
    if (!result.error && result.vehicles) {
      setVehicles(result.vehicles);
    }
  };

  const handleSearchCustomers = async () => {
    setSearchLoading(true);
    try {
      const result = await searchCustomers(debouncedSearchQuery);
      if (!result.error && result.customers) {
        setSearchResults(result.customers);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectExistingCustomer = (customer: any) => {
    setCustomerId(customer.id);
    setCustomerData({
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || '',
    });
    setSearchQuery('');
    setSearchResults([]);
    setStep(4);
  };

  const loadBookedDates = async (vehicleId: string) => {
    const result = await getVehicleBookedDates(vehicleId);
    if (!result.error && result.bookedReservations) {
      // Generate all dates between start and end for each reservation
      const allBookedDates: Date[] = [];
      result.bookedReservations.forEach((reservation) => {
        const start = new Date(reservation.startDate);
        const end = new Date(reservation.endDate);

        // Set to midnight to avoid timezone issues
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const currentDate = new Date(start);

        while (currentDate <= end) {
          allBookedDates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(0, 0, 0, 0);
        }
      });
      setBookedDates(allBookedDates);
    }
  };

  const checkBookedDatesInRange = (from: Date, to: Date): boolean => {
    if (!from || !to) return false;

    const start = new Date(from);
    const end = new Date(to);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const currentDate = new Date(start);
    const bookedInRange: Date[] = [];

    while (currentDate <= end) {
      const isBooked = bookedDates.some(
        (bookedDate) =>
          bookedDate.getFullYear() === currentDate.getFullYear() &&
          bookedDate.getMonth() === currentDate.getMonth() &&
          bookedDate.getDate() === currentDate.getDate()
      );

      if (isBooked) {
        bookedInRange.push(new Date(currentDate));
      }

      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    if (bookedInRange.length > 0) {
      const dates = bookedInRange.map(d => format(d, 'd MMM', { locale: fr })).join(', ');
      setDateRangeWarning(`Attention : Les dates suivantes sont déjà réservées : ${dates}`);
      return true;
    }

    setDateRangeWarning('');
    return false;
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
    // Load booked dates for this vehicle
    await loadBookedDates(vehicle.id);
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
      if (customerMode === 'self-fill') {
        // Skip customer creation, will be done by customer before payment
        setCustomerId(''); // Will be filled later
        setStep(4);
      } else if (customerMode === 'existing') {
        // Customer already selected
        if (!customerId) {
          throw new Error('Veuillez sélectionner un client');
        }
        setStep(4);
      } else {
        // Create new customer
        const result = await createCustomer(customerData);

        if (result.error) {
          throw new Error(result.error);
        }

        setCustomerId(result.customer!.id);
        setStep(4);
      }
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
        <Link
          href="/reservations"
          className="text-primary hover:underline mb-4 inline-flex items-center gap-2"
        >
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
                        ? "border-primary bg-primary text-white"
                        : isCompleted
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted bg-background text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isActive || isCompleted
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <Separator
                    className={`flex-1 mx-2 ${
                      isCompleted ? "bg-primary" : "bg-muted"
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
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-md p-2 ${
                            selectedVehicleId === vehicle.id
                              ? "bg-primary/10"
                              : "bg-muted"
                          }`}
                        >
                          <Car
                            className={`h-5 w-5 ${
                              selectedVehicleId === vehicle.id
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {vehicle.brand} {vehicle.model}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.plate}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <Euro className="h-4 w-4 text-primary" />
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(parseFloat(vehicle.dailyRate))}
                              /jour
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="submit"
                disabled={!selectedVehicleId}
                className="w-full"
              >
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
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Sélectionnez la période de location *
                  </Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange?.from && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "d MMMM yyyy", {
                                locale: fr,
                              })}{" "}
                              -{" "}
                              {format(dateRange.to, "d MMMM yyyy", {
                                locale: fr,
                              })}
                            </>
                          ) : (
                            format(dateRange.from, "d MMMM yyyy", {
                              locale: fr,
                            })
                          )
                        ) : (
                          <span>Choisir une période</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="range"
                        defaultMonth={dateRange?.from || new Date()}
                        selected={dateRange}
                        onSelect={(range) => {
                          if (!range) return;

                          setDateRange(range);
                          setDateRangeWarning("");

                          if (range.from) {
                            const fromDate = new Date(range.from);
                            fromDate.setHours(12, 0, 0, 0);
                            setStartDate(fromDate.toISOString().split("T")[0]);

                            // Reset endDate if selecting new start date
                            if (!range.to) {
                              setEndDate("");
                            }
                          }

                          // Only close when BOTH dates are selected AND they are different
                          if (
                            range.from &&
                            range.to &&
                            range.from.getTime() !== range.to.getTime()
                          ) {
                            const toDate = new Date(range.to);
                            toDate.setHours(12, 0, 0, 0);
                            setEndDate(toDate.toISOString().split("T")[0]);

                            // Check if there are booked dates in the selected range
                            checkBookedDatesInRange(range.from, range.to);

                            // Auto-close when both dates are selected
                            setTimeout(() => setCalendarOpen(false), 100);
                          }
                        }}
                        numberOfMonths={1}
                        disabled={(date) => {
                          // Disable past dates
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const checkDate = new Date(date);
                          checkDate.setHours(0, 0, 0, 0);

                          if (checkDate < today) return true;

                          // Disable booked dates
                          return bookedDates.some((bookedDate) => {
                            const bd = new Date(bookedDate);
                            bd.setHours(0, 0, 0, 0);
                            return bd.getTime() === checkDate.getTime();
                          });
                        }}
                        modifiers={{
                          booked: bookedDates,
                        }}
                        modifiersClassNames={{
                          booked: "line-through opacity-50",
                        }}
                        className="rounded-lg border shadow-sm"
                      />
                    </PopoverContent>
                  </Popover>
                  {dateRangeWarning && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{dateRangeWarning}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !dateRange?.from || !dateRange?.to}
                    className="flex-1"
                  >
                    {loading ? "Vérification..." : "Continuer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {preview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
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
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Tarif journalier
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(parseFloat(selectedVehicle.dailyRate))}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="font-semibold">Total estimé</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(preview.subtotal)}
                  </span>
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
            <form onSubmit={handleStep3} className="space-y-6">
              {/* Mode selection */}
              <div className="grid md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("new");
                    setCustomerId("");
                    setSearchQuery("");
                  }}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    customerMode === "new"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User
                      className={`h-4 w-4 ${customerMode === "new" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium text-sm">Nouveau client</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Créer un nouveau client
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("existing");
                    setCustomerId("");
                  }}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    customerMode === "existing"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User
                      className={`h-4 w-4 ${customerMode === "existing" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium text-sm">Client existant</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rechercher dans la base
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("self-fill");
                    setCustomerId("");
                  }}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    customerMode === "self-fill"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Mail
                      className={`h-4 w-4 ${customerMode === "self-fill" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium text-sm">Client remplira</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Infos avant paiement
                  </p>
                </button>
              </div>

              <Separator />

              {/* Existing customer search */}
              {customerMode === "existing" && (
                <div className="space-y-3">
                  <Label htmlFor="search">Rechercher un client</Label>
                  <Input
                    id="search"
                    placeholder="Nom, email, téléphone... (min 3 caractères)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />

                  {searchQuery.length > 0 && searchQuery.length < 3 && (
                    <div className="text-xs text-muted-foreground">
                      Tapez au moins 3 caractères pour lancer la recherche
                    </div>
                  )}

                  {searchLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      Recherche en cours...
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                      {searchResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectExistingCustomer(customer)}
                          className="w-full p-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="text-xs text-muted-foreground">
                              {customer.phone}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchLoading &&
                    searchQuery.length >= 3 &&
                    searchResults.length === 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Aucun client trouvé pour "{searchQuery}". Essayez un
                          autre terme de recherche ou créez un nouveau client.
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}

              {/* New customer form */}
              {customerMode === "new" && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={customerData.firstName}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            firstName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        value={customerData.lastName}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            lastName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <PhoneInput
                      country={"fr"} // France par défaut
                      value={customerData.phone} // ex: "+33767338363"
                      onChange={(phone) =>
                        setCustomerData({ ...customerData, phone })
                      }
                      inputProps={{
                        name: "phone",
                        required: true,
                        autoFocus: false,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Self-fill mode info */}
              {customerMode === "self-fill" && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Vous envoyez un lien au client pour qu'il remplisse ses
                    informations personnelles avant de procéder au paiement.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  Retour
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Création..." : "Continuer"}
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
                <div className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Véhicule</p>
                      <p className="font-medium">
                        {selectedVehicle.brand} {selectedVehicle.model}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Modifier
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Dates</p>
                      <p className="font-medium text-sm">
                        {formatDate(new Date(startDate))} -{" "}
                        {formatDate(new Date(endDate))}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(2)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Modifier
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="rounded-md bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Client</p>
                      <p className="font-medium">
                        {customerMode === "self-fill"
                          ? "Le client remplira ses infos"
                          : `${customerData.firstName} ${customerData.lastName}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(3)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Modifier
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">
                    {formatCurrency(preview.subtotal)}
                  </span>
                </div>
                {includeInsurance && (
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Assurance</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(preview.insurance)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-primary" />
                    <span className="font-bold">Total</span>
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(preview.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="insurance"
                  checked={includeInsurance}
                  onCheckedChange={(checked) =>
                    setIncludeInsurance(checked === true)
                  }
                />
                <Label
                  htmlFor="insurance"
                  className="flex items-center gap-2 text-sm font-normal cursor-pointer flex-1"
                >
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Inclure assurance (5€/jour)
                </Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
              >
                Retour
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Création..." : "Créer la réservation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
