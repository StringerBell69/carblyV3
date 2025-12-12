'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  User,
  Mail,
  Loader2,
  Car,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { PhoneInput } from '@/components/phone-input';

export default function CustomerInfoPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    loadReservation();
  }, [token]);

  const loadReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/public/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Réservation non trouvée');
      }

      setReservation(data.reservation);

      if (data.reservation.customer) {
        router.push(`/reservation/${token}`);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/reservations/public/${token}/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }

      router.push(`/reservation/${token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vos informations</h1>
          <p className="text-sm text-gray-600">Pour continuer vers le paiement</p>
        </div>

        {/* Reservation Summary */}
        {reservation && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Car className="h-3.5 w-3.5" />
                    Véhicule
                  </div>
                  <p className="font-semibold text-sm">
                    {reservation.vehicle.brand} {reservation.vehicle.model}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Dates
                  </div>
                  <p className="text-xs">
                    {formatDate(reservation.startDate)} → {formatDate(reservation.endDate)}
                  </p>
                </div>
              </div>
              {reservation.depositAmount && (
                <>
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Acompte à payer</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(parseFloat(reservation.depositAmount))}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    disabled={submitting}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    disabled={submitting}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10 h-11"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">Téléphone</Label>
                <PhoneInput
                  international
                  addInternationalOption
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 text-base"
                size="lg"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </div>
                ) : (
                  <>
                    Continuer vers le paiement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-gray-400">
          Vos données sont sécurisées et utilisées uniquement pour cette réservation
        </p>
      </div>
    </div>
  );
}
