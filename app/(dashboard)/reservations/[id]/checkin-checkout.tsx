'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getPresignedUrl } from '../../vehicles/actions';

interface CheckInOutFormProps {
  reservationId: string;
  type: 'checkin' | 'checkout';
  onComplete: () => void;
}

export function CheckInOutForm({ reservationId, type, onComplete }: CheckInOutFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [formData, setFormData] = useState({
    mileage: '',
    fuelLevel: '100',
    notes: '',
    photos: [] as File[],
  });

  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData({ ...formData, photos: [...formData.photos, ...files] });
    }
  };

  const uploadPhotos = async () => {
    setUploadingPhotos(true);
    const urls: string[] = [];

    try {
      for (const photo of formData.photos) {
        // Get presigned URL
        const result = await getPresignedUrl({
          fileName: photo.name,
          fileType: photo.type,
          vehicleId: reservationId,
        });

        if (result.error || !result.uploadUrl || !result.finalUrl) {
          throw new Error(result.error || 'Failed to get upload URL');
        }

        // Upload to R2
        const uploadResponse = await fetch(result.uploadUrl, {
          method: 'PUT',
          body: photo,
          headers: {
            'Content-Type': photo.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo');
        }

        urls.push(result.finalUrl);
      }

      setUploadedPhotoUrls(urls);
      return urls;
    } catch (err) {
      throw err;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Upload photos first
      const photoUrls = formData.photos.length > 0 ? await uploadPhotos() : [];

      // Submit check-in/out data
      const response = await fetch(`/api/reservations/${reservationId}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mileage: parseInt(formData.mileage),
          fuelLevel: parseInt(formData.fuelLevel),
          notes: formData.notes,
          photos: photoUrls,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${type}`);
      }

      setOpen(false);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {type === 'checkin' ? '📥 Check-in' : '📤 Check-out'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {type === 'checkin' ? 'Check-in du véhicule' : 'Check-out du véhicule'}
            </DialogTitle>
            <DialogDescription>
              {type === 'checkin'
                ? 'Enregistrez l\'état du véhicule au départ'
                : 'Enregistrez l\'état du véhicule au retour'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kilométrage *</label>
                <Input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  placeholder="Ex: 45000"
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Niveau de carburant (%) *
                </label>
                <Input
                  type="number"
                  value={formData.fuelLevel}
                  onChange={(e) => setFormData({ ...formData, fuelLevel: e.target.value })}
                  placeholder="Ex: 75"
                  required
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Photos du véhicule</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                disabled={uploadingPhotos}
              />
              {formData.photos.length > 0 && (
                <p className="text-xs text-gray-500">
                  {formData.photos.length} photo(s) sélectionnée(s)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Commentaires, dommages constatés, etc."
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading || uploadingPhotos}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading || uploadingPhotos}>
                {loading || uploadingPhotos
                  ? uploadingPhotos
                    ? 'Upload des photos...'
                    : 'Enregistrement...'
                  : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
