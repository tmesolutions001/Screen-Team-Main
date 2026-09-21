import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Settings as SettingsIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { IconButton } from '@/components/glass';

interface SettingsProps {
  language: string;
  voiceEnabled: boolean;
  onLanguageChange: (value: string) => void;
  onVoiceToggle: (enabled: boolean) => void;
}

export const Settings = ({ language, onLanguageChange }: SettingsProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <IconButton aria-label="Open settings" className="fixed top-4 left-4">
          <SettingsIcon className="w-5 h-5" />
        </IconButton>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px]">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          <div className="space-y-4">
            <Label>Language</Label>
            <RadioGroup value={language} onValueChange={onLanguageChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="en" />
                <Label htmlFor="en">English</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="es" id="es" />
                <Label htmlFor="es">Spanish</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
