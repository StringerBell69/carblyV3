'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  Car,
  Calendar,
  CreditCard,
  Fuel,
  Settings,
  Users,
  Gauge,
  Hash,
  Plus
} from 'lucide-react';
import { createVehicle } from '../actions';

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    plate: '',
    vin: '',
    dailyRate: '',
    depositAmount: '',
    fuelType: 'gasoline',
    transmission: 'manual',
    seats: '',
    mileage: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createVehicle({
        brand: formData.brand,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : undefined,
        plate: formData.plate,
        vin: formData.vin || undefined,
        dailyRate: formData.dailyRate,
        depositAmount: formData.depositAmount || undefined,
        fuelType: formData.fuelType || undefined,
        transmission: formData.transmission || undefined,
        seats: formData.seats ? parseInt(formData.seats) : undefined,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      router.push('/vehicles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/vehicles" className="text-primary hover:underline mb-4 inline-block">
          ← Retour à la liste
        </Link>
        <h1 className="text-3xl font-bold">Ajouter un véhicule</h1>
        <p className="text-gray-600 mt-1">
          Ajoutez un nouveau véhicule à votre flotte
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Renseignez les informations de base du véhicule
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Marque *
                </Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="Ex: Renault"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Fabricant du véhicule
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Modèle *
                </Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="Ex: Clio"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Nom du modèle
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Année
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  placeholder="Ex: 2022"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
                <p className="text-xs text-muted-foreground">
                  Année de mise en circulation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plate" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Plaque d'immatriculation *
                </Label>
                <Input
                  id="plate"
                  value={formData.plate}
                  onChange={(e) => handleChange('plate', e.target.value.toUpperCase())}
                  placeholder="Ex: AB-123-CD"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Numéro d'immatriculation officiel
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Numéro VIN
              </Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
                placeholder="Ex: 1HGBH41JXMN109186"
                maxLength={17}
              />
              <p className="text-xs text-muted-foreground">
                Numéro d'identification du véhicule (17 caractères)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Caractéristiques techniques
            </CardTitle>
            <CardDescription>
              Spécifications et équipements du véhicule
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuelType" className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Type de carburant
                </Label>
                <Select value={formData.fuelType} onValueChange={(v) => handleChange('fuelType', v)}>
                  <SelectTrigger id="fuelType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasoline">Essence</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Électrique</SelectItem>
                    <SelectItem value="hybrid">Hybride</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Type d'énergie utilisée
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transmission" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Transmission
                </Label>
                <Select value={formData.transmission} onValueChange={(v) => handleChange('transmission', v)}>
                  <SelectTrigger id="transmission">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuelle</SelectItem>
                    <SelectItem value="automatic">Automatique</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Type de boîte de vitesses
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seats" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Nombre de places
                </Label>
                <Input
                  id="seats"
                  type="number"
                  value={formData.seats}
                  onChange={(e) => handleChange('seats', e.target.value)}
                  placeholder="Ex: 5"
                  min="1"
                  max="50"
                />
                <p className="text-xs text-muted-foreground">
                  Capacité totale de passagers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage" className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Kilométrage
                </Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => handleChange('mileage', e.target.value)}
                  placeholder="Ex: 45000"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Distance parcourue en kilomètres
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Tarification
            </CardTitle>
            <CardDescription>
              Définissez les tarifs de location du véhicule
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyRate" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tarif journalier (€) *
                </Label>
                <Input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  value={formData.dailyRate}
                  onChange={(e) => handleChange('dailyRate', e.target.value)}
                  placeholder="Ex: 49.99"
                  required
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Prix par jour de location
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositAmount" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Montant de la caution (€)
                </Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={(e) => handleChange('depositAmount', e.target.value)}
                  placeholder="Ex: 500.00"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Caution demandée lors de la location
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              'Création...'
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Créer le véhicule
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
