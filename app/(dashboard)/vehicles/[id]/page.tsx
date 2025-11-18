'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getVehicle, updateVehicle, deleteVehicle } from '../actions';
import { formatCurrency } from '@/lib/utils';

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [vehicle, setVehicle] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    plate: '',
    vin: '',
    status: 'available',
    dailyRate: '',
    depositAmount: '',
    fuelType: 'gasoline',
    transmission: 'manual',
    seats: '',
    mileage: '',
  });

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      const result = await getVehicle(vehicleId);

      if (result.error) {
        throw new Error(result.error);
      }

      const v = result.vehicle!;
      setVehicle(v);
      setFormData({
        brand: v.brand,
        model: v.model,
        year: v.year?.toString() || '',
        plate: v.plate,
        vin: v.vin || '',
        status: v.status,
        dailyRate: v.dailyRate,
        depositAmount: v.depositAmount || '',
        fuelType: v.fuelType || 'gasoline',
        transmission: v.transmission || 'manual',
        seats: v.seats?.toString() || '',
        mileage: v.mileage?.toString() || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const result = await updateVehicle(vehicleId, {
        brand: formData.brand,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : undefined,
        plate: formData.plate,
        vin: formData.vin || undefined,
        status: formData.status as any,
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

      setIsEditing(false);
      await loadVehicle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await deleteVehicle(vehicleId);

      if (result.error) {
        throw new Error(result.error);
      }

      router.push('/vehicles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle');
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/vehicles">
          <Button>Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    out_of_service: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    available: 'Disponible',
    rented: 'Loué',
    maintenance: 'Maintenance',
    out_of_service: 'Hors service',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/vehicles" className="text-primary hover:underline mb-4 inline-block">
          ← Retour à la liste
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-gray-600 mt-1">{vehicle.plate}</p>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)}>
                ✏️ Modifier
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={saving}
                className="text-red-600 hover:bg-red-50"
              >
                🗑️ Supprimer
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!isEditing ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Marque</p>
                  <p className="font-medium">{vehicle.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Modèle</p>
                  <p className="font-medium">{vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Année</p>
                  <p className="font-medium">{vehicle.year || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <span
                    className={`inline-block text-xs px-2 py-1 rounded-full ${
                      statusColors[vehicle.status]
                    }`}
                  >
                    {statusLabels[vehicle.status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plaque</p>
                  <p className="font-medium">{vehicle.plate}</p>
                </div>
                {vehicle.vin && (
                  <div>
                    <p className="text-sm text-gray-600">VIN</p>
                    <p className="font-medium text-xs">{vehicle.vin}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Caractéristiques techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {vehicle.fuelType && (
                  <div>
                    <p className="text-sm text-gray-600">Carburant</p>
                    <p className="font-medium">
                      {vehicle.fuelType === 'diesel' ? 'Diesel' : vehicle.fuelType === 'gasoline' ? 'Essence' : vehicle.fuelType === 'electric' ? 'Électrique' : 'Hybride'}
                    </p>
                  </div>
                )}
                {vehicle.transmission && (
                  <div>
                    <p className="text-sm text-gray-600">Transmission</p>
                    <p className="font-medium">
                      {vehicle.transmission === 'manual' ? 'Manuelle' : 'Automatique'}
                    </p>
                  </div>
                )}
                {vehicle.seats && (
                  <div>
                    <p className="text-sm text-gray-600">Places</p>
                    <p className="font-medium">{vehicle.seats}</p>
                  </div>
                )}
                {vehicle.mileage && (
                  <div>
                    <p className="text-sm text-gray-600">Kilométrage</p>
                    <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tarif journalier</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(parseFloat(vehicle.dailyRate))}/jour
                  </p>
                </div>
                {vehicle.depositAmount && (
                  <div>
                    <p className="text-sm text-gray-600">Caution</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(parseFloat(vehicle.depositAmount))}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Marque *</label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => handleChange('brand', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modèle *</label>
                  <Input
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Année</label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="available">Disponible</option>
                    <option value="rented">Loué</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_service">Hors service</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plaque *</label>
                  <Input
                    value={formData.plate}
                    onChange={(e) => handleChange('plate', e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">VIN</label>
                  <Input
                    value={formData.vin}
                    onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
                    maxLength={17}
                  />
                </div>
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
                  <label className="text-sm font-medium">Carburant</label>
                  <select
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
                  <label className="text-sm font-medium">Transmission</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => handleChange('transmission', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="manual">Manuelle</option>
                    <option value="automatic">Automatique</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Places</label>
                  <Input
                    type="number"
                    value={formData.seats}
                    onChange={(e) => handleChange('seats', e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kilométrage</label>
                  <Input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleChange('mileage', e.target.value)}
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
                  <label className="text-sm font-medium">Tarif journalier (€) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.dailyRate}
                    onChange={(e) => handleChange('dailyRate', e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Caution (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.depositAmount}
                    onChange={(e) => handleChange('depositAmount', e.target.value)}
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
              onClick={() => {
                setIsEditing(false);
                setError('');
              }}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
