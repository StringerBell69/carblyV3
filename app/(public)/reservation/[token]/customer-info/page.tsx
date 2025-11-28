'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  User,
  Mail,
  Phone,
  Loader2,
  Car,
  Calendar,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

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

      // If customer already exists, redirect to payment page
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

      // Redirect to payment page
      router.push(`/reservation/${token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600 text-center">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Vos informations
          </h1>
          <p className="text-gray-600 text-lg">
            Complétez vos informations pour continuer vers le paiement
          </p>
        </div>

        {/* Reservation info */}
        {reservation && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Véhicule</p>
                    <p className="font-semibold text-gray-900">
                      {reservation.vehicle.brand} {reservation.vehicle.model}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Période</p>
                    <p className="text-gray-900">
                      Du {formatDate(reservation.startDate)} au {formatDate(reservation.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Vos coordonnées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={submitting}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </div>
                ) : (
                  'Continuer vers le paiement'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          Vos informations sont sécurisées et ne seront utilisées que pour cette réservation
        </p>
      </div>
    </div>
  );
}
