import { Settings as SettingsIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { GlassSwitch, IconButton } from '@/components/glass';
import { updateSettings, useSettings } from '@/lib/settings';

export const Settings = () => {
  const { sfx } = useSettings();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <IconButton aria-label="Open settings" className="fixed top-4 right-4">
          <SettingsIcon className="w-5 h-5" />
        </IconButton>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px]">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Saved on this computer.</SheetDescription>
        </SheetHeader>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <p id="setting-sfx" className="font-medium">Sound effects</p>
            <p className="text-sm text-muted-foreground">Chime for a correct answer, buzz for a miss.</p>
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
