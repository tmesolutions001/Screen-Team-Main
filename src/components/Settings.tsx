
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings as SettingsIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SettingsProps {
  language: string;
  voiceEnabled: boolean;
  onLanguageChange: (value: string) => void;
  onVoiceToggle: (enabled: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  language,
  voiceEnabled,
  onLanguageChange,
  onVoiceToggle,
}) => {
  return (
    <Sheet>
      <SheetTrigger className="fixed top-4 left-4 p-2 rounded-full hover:bg-gray-800 transition-colors">
        <SettingsIcon className="w-6 h-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] bg-card">
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
