import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuoteFormValues } from "@/schemas/quoteFormSchema";
import { User, Users, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { MaskedInput } from "@/components/ui/modern-masked-input";

interface ClientContactFormProps {
  form: UseFormReturn<QuoteFormValues>;
}

interface FloatingInputProps {
  label: string;
  required?: boolean;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  type?: string;
}

const FloatingInput = ({
  label,
  required,
  className,
  value,
  onChange,
  onBlur,
  type = "text",
}: FloatingInputProps) => (
  <div className={cn("relative group", className)}>
    <Input
      type={type}
      placeholder=" "
      className="peer h-14 pt-6 pb-2 px-4 text-sm bg-muted/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
    />
    <label className="absolute left-4 top-2 text-xs font-medium text-muted-foreground transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  </div>
);

const requestorOptions = [
  { value: "Remetente", label: "Remetente", icon: User },
  { value: "Destinatario", label: "Destinatário", icon: Users },
  { value: "Outros", label: "Outro", icon: UserCheck },
];

export function ClientContactForm({ form }: ClientContactFormProps) {
  return (
    <div className="space-y-6">
      {/* Requestor Type */}
      <FormField
        control={form.control}
        name="contact.requestorType"
        render={({ field }) => (
          <FormItem>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Quem solicita?
            </p>
            <FormControl>
              <div className="grid grid-cols-3 gap-3">
                {requestorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      field.value === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/50"
                    )}
                  >
                    <opt.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Contact Fields */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="contact.name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingInput
                  label="Nome completo"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact.email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingInput
                    label="E-mail"
                    required
                    type="email"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact.phone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative group">
                    <MaskedInput
                      placeholder=" "
                      mask="(99) 99999-9999"
                      maskChar={null}
                      className="peer h-14 pt-6 pb-2 px-4 text-sm bg-muted/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all w-full"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                    />
                    <label className="absolute left-4 top-2 text-xs font-medium text-muted-foreground transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary pointer-events-none">
                      Telefone<span className="text-destructive ml-0.5">*</span>
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="contact.message"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder=" "
                    className="peer min-h-[100px] pt-8 px-4 text-sm bg-muted/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  <label className="absolute left-4 top-3 text-xs font-medium text-muted-foreground pointer-events-none">
                    Observações (opcional)
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-accent/50 text-sm text-muted-foreground">
        Seus dados são usados apenas para contato sobre esta cotação. Resposta em até 24h úteis.
      </div>
    </div>
  );
}
