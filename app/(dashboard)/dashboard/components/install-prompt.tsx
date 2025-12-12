'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if dismissed recently (24h)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice && !standalone) {
      setShowPrompt(true);
      return;
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or no prompt available
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 relative overflow-hidden">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-primary/20 shrink-0">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base mb-1">
              Installer Carbly sur votre écran d'accueil
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              Accès rapide, notifications et mode hors-ligne
            </p>
            
            {isIOS ? (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p className="font-medium mb-1">Sur Safari :</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Appuyez sur le bouton <span className="inline-flex items-center mx-0.5 px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">Partager</span></li>
                  <li>Sélectionnez "Sur l'écran d'accueil"</li>
                  <li>Appuyez sur "Ajouter"</li>
                </ol>
              </div>
            ) : (
              <Button 
                onClick={handleInstall} 
                size="sm" 
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Installer l'app
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
