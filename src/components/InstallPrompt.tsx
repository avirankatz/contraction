import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white/90 backdrop-blur-md border shadow-xl rounded-2xl p-4 flex items-center justify-between gap-4 max-w-md mx-auto ring-1 ring-black/5">
        <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-full">
                <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
                <span className="font-medium text-sm">התקנת אפליקציה</span>
                <span className="text-xs text-muted-foreground">גישה נוחה ומהירה יותר</span>
            </div>
        </div>
        <div className="flex gap-2">
            <Button size="sm" onClick={handleInstallClick} className="rounded-full px-4 h-9 font-medium">
                התקנה
            </Button>
             <Button size="icon" variant="ghost" onClick={() => setIsVisible(false)} className="h-9 w-9 rounded-full">
                <X className="w-4 h-4 opacity-50" />
            </Button>
        </div>
      </div>
    </div>
  );
}
