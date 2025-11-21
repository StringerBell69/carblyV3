'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  AlertCircle,
  Edit,
  Trash2,
  Car,
  Fuel,
  Settings,
  Users,
  Gauge,
  CreditCard,
  Calendar,
  FileText,
  History,
  Image as ImageIcon,
  X,
  Upload,
} from 'lucide-react';
import { getVehicle, updateVehicle, deleteVehicle } from '../actions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [vehicle, setVehicle] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState<string[]>([]);

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
      setImages(v.images || []);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError('');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('vehicleId', vehicleId);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await res.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} photo(s) téléchargée(s) avec succès`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload images';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploadingImage(false);
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
        images: images,
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

  const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
    available: { label: 'Disponible', variant: 'success' },
    rented: { label: 'Loué', variant: 'default' },
    maintenance: { label: 'Maintenance', variant: 'warning' },
    out_of_service: { label: 'Hors service', variant: 'destructive' },
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
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={saving}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement ce véhicule. Cette opération ne peut pas être annulée.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isEditing ? (
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <FileText className="mr-2 h-4 w-4" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Marque
                    </p>
                    <p className="font-medium">{vehicle.brand}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Modèle
                    </p>
                    <p className="font-medium">{vehicle.model}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Année
                    </p>
                    <p className="font-medium">{vehicle.year || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge variant={statusConfig[vehicle.status].variant}>
                      {statusConfig[vehicle.status].label}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Plaque</p>
                    <p className="font-medium">{vehicle.plate}</p>
                  </div>
                  {vehicle.vin && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">VIN</p>
                      <p className="font-medium text-xs">{vehicle.vin}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Caractéristiques techniques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {vehicle.fuelType && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Fuel className="h-4 w-4" />
                        Carburant
                      </p>
                      <p className="font-medium">
                        {vehicle.fuelType === 'diesel' ? 'Diesel' : vehicle.fuelType === 'gasoline' ? 'Essence' : vehicle.fuelType === 'electric' ? 'Électrique' : 'Hybride'}
                      </p>
                    </div>
                  )}
                  {vehicle.transmission && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Transmission
                      </p>
                      <p className="font-medium">
                        {vehicle.transmission === 'manual' ? 'Manuelle' : 'Automatique'}
                      </p>
                    </div>
                  )}
                  {vehicle.seats && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Places
                      </p>
                      <p className="font-medium">{vehicle.seats}</p>
                    </div>
                  )}
                  {vehicle.mileage && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Kilométrage
                      </p>
                      <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photos du véhicule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vehicle.images && vehicle.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vehicle.images.map((url: string, index: number) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-lg border overflow-hidden"
                      >
                        <img
                          src={url}
                          alt={`${vehicle.brand} ${vehicle.model} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                            Photo principale
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune photo disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Tarification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Tarif journalier</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(parseFloat(vehicle.dailyRate))}/jour
                    </p>
                  </div>
                  {vehicle.depositAmount && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Caution</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(parseFloat(vehicle.depositAmount))}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique des locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Aucun historique disponible pour le moment
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Aucun document disponible pour le moment
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marque *</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => handleChange('brand', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modèle *</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Année</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Statut *</Label>
                  <Select value={formData.status} onValueChange={(v) => handleChange('status', v)} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="rented">Loué</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="out_of_service">Hors service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plaque *</Label>
                  <Input
                    value={formData.plate}
                    onChange={(e) => handleChange('plate', e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>VIN</Label>
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
                  <Label>Carburant</Label>
                  <Select value={formData.fuelType} onValueChange={(v) => handleChange('fuelType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Essence</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Électrique</SelectItem>
                      <SelectItem value="hybrid">Hybride</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transmission</Label>
                  <Select value={formData.transmission} onValueChange={(v) => handleChange('transmission', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manuelle</SelectItem>
                      <SelectItem value="automatic">Automatique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Places</Label>
                  <Input
                    type="number"
                    value={formData.seats}
                    onChange={(e) => handleChange('seats', e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kilométrage</Label>
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
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Photos du véhicule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="images-edit" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Ajouter des photos
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="images-edit"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImage || saving}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('images-edit')?.click()}
                    disabled={uploadingImage || saving}
                    className="w-full"
                  >
                    {uploadingImage ? (
                      <>Téléchargement...</>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Choisir des images
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats acceptés: JPG, PNG, WebP. Taille maximale: 10MB par image.
                </p>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-video rounded-lg border overflow-hidden group"
                    >
                      <img
                        src={url}
                        alt={`Vehicle ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={saving}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                          Photo principale
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {images.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune photo ajoutée</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tarif journalier (€) *</Label>
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
                  <Label>Caution (€)</Label>
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
