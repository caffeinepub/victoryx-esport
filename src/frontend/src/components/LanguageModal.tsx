import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "pt", label: "Portuguese", native: "Português" },
];

interface LanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: string;
  onSelect: (lang: string) => void;
}

export default function LanguageModal({
  open,
  onOpenChange,
  current,
  onSelect,
}: LanguageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-gaming text-xl flex items-center gap-2">
            <Globe size={20} className="text-primary" />
            Select Language
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant="outline"
              className={cn(
                "h-auto py-3 flex-col gap-1 border-border hover:border-primary/50 hover:bg-primary/10",
                current === lang.code &&
                  "border-primary bg-primary/15 text-primary",
              )}
              onClick={() => {
                onSelect(lang.code);
                onOpenChange(false);
              }}
            >
              <span className="text-base font-medium">{lang.native}</span>
              <span className="text-xs text-muted-foreground">
                {lang.label}
              </span>
              {current === lang.code && (
                <Check size={12} className="text-primary" />
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
