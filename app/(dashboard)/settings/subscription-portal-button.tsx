'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { getSubscriptionPortalLink } from './actions';
import { toast } from 'sonner';

export function SubscriptionPortalButton() {
  const [loading, setLoading] = useState(false);

  const handleOpenPortal = async () => {
    setLoading(true);
    try {
      const result = await getSubscriptionPortalLink();
      
      if (result.error || !result.url) {
        toast.error(result.error || 'Impossible d\'ouvrir le portail');
        return;
      }

      window.location.href = result.url;
    } catch (error) {
      toast.error('Erreur lors de l\'ouverture du portail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      onClick={handleOpenPortal}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Chargement...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Gérer mon abonnement
        </>
      )}
    </Button>
  );
}
