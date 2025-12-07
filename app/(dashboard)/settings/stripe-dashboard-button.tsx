'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import { getStripeDashboardLink } from './stripe-actions';
import { toast } from 'sonner';

export function StripeDashboardButton() {
  const [loading, setLoading] = useState(false);

  const handleOpenDashboard = async () => {
    setLoading(true);
    try {
      const result = await getStripeDashboardLink();
      
      if (result.error || !result.url) {
        toast.error(result.error || 'Impossible d\'ouvrir le dashboard Stripe');
        return;
      }

      // Open in new tab
      window.open(result.url, '_blank');
    } catch (error) {
      toast.error('Erreur lors de l\'ouverture du dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpenDashboard}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Chargement...
        </>
      ) : (
        <>
          <ExternalLink className="h-4 w-4 mr-2" />
          Ouvrir Stripe
        </>
      )}
    </Button>
  );
}
