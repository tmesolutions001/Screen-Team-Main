import { Settings as SettingsIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { GlassSwitch, IconButton } from '@/components/glass';
import { updateSettings, useSettings } from '@/lib/settings';
import { useSimText } from '@/game/i18n';

/** Simulator settings (shown on the simulator menu, so it follows the simulator language). */
export const Settings = () => {
  const { sfx } = useSettings();
  const { t } = useSimText();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <IconButton aria-label={t.settings.open} className="fixed top-4 right-4">
          <SettingsIcon className="w-5 h-5" />
        </IconButton>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px]">
        <SheetHeader>
          <SheetTitle>{t.settings.title}</SheetTitle>
          <SheetDescription>{t.settings.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <p id="setting-sfx" className="font-medium">{t.settings.sfx}</p>
            <p className="text-sm text-muted-foreground">{t.settings.sfxDetail}</p>
          </div>
          <GlassSwitch
            checked={sfx}
            onCheckedChange={(checked) => updateSettings({ sfx: checked })}
            aria-labelledby="setting-sfx"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
