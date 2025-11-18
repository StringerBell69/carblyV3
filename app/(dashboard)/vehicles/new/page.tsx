'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="brand" className="text-sm font-medium">
                  Marque *
                </label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="Ex: Renault"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="model" className="text-sm font-medium">
                  Modèle *
                </label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="Ex: Clio"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium">
                  Année
                </label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  placeholder="Ex: 2022"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="plate" className="text-sm font-medium">
                  Plaque d'immatriculation *
                </label>
                <Input
                  id="plate"
                  value={formData.plate}
                  onChange={(e) => handleChange('plate', e.target.value.toUpperCase())}
                  placeholder="Ex: AB-123-CD"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="vin" className="text-sm font-medium">
                Numéro VIN
              </label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
                placeholder="Ex: 1HGBH41JXMN109186"
                maxLength={17}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques techniques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fuelType" className="text-sm font-medium">
                  Type de carburant
                </label>
                <select
                  id="fuelType"
                  value={formData.fuelType}
                  onChange={(e) => handleChange('fuelType', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="gasoline">Essence</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Électrique</option>
                  <option value="hybrid">Hybride</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="transmission" className="text-sm font-medium">
                  Transmission
                </label>
                <select
                  id="transmission"
                  value={formData.transmission}
                  onChange={(e) => handleChange('transmission', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="manual">Manuelle</option>
                  <option value="automatic">Automatique</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="seats" className="text-sm font-medium">
                  Nombre de places
                </label>
                <Input
                  id="seats"
                  type="number"
                  value={formData.seats}
                  onChange={(e) => handleChange('seats', e.target.value)}
                  placeholder="Ex: 5"
                  min="1"
                  max="50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="mileage" className="text-sm font-medium">
                  Kilométrage
                </label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => handleChange('mileage', e.target.value)}
                  placeholder="Ex: 45000"
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dailyRate" className="text-sm font-medium">
                  Tarif journalier (€) *
                </label>
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
              </div>

              <div className="space-y-2">
                <label htmlFor="depositAmount" className="text-sm font-medium">
                  Montant de la caution (€)
                </label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={(e) => handleChange('depositAmount', e.target.value)}
                  placeholder="Ex: 500.00"
                  min="0"
                />
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
            {loading ? 'Création...' : 'Créer le véhicule'}
          </Button>
        </div>
      </form>
    </div>
  );
}
