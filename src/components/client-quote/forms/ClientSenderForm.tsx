import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { QuoteFormValues } from "@/schemas/quoteFormSchema";
import { formatCPFCNPJ, formatCEP } from "@/lib/formatters";
import { Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CNPJData {
  alias: string;
  company: { name: string };
  address: {
    street: string;
    number: string;
    details: string | null;
    zip: string;
    district: string;
    city: string;
    state: string;
  };
}

interface ClientSenderFormProps {
  form: UseFormReturn<QuoteFormValues>;
}

const fetchCNPJData = async (cnpj: string): Promise<CNPJData | null> => {
  const cleanCNPJ = cnpj.replace(/\D/g, "");
  if (cleanCNPJ.length !== 14) return null;
  try {
    const response = await fetch(`https://open.cnpja.com/office/${cleanCNPJ}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

interface FloatingInputProps {
  label: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
}

const FloatingInput = ({
  label,
  required,
  className,
  disabled,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength,
}: FloatingInputProps) => (
  <div className={cn("relative group", className)}>
    <Input
      placeholder=" "
      className="peer h-14 pt-6 pb-2 px-4 text-sm bg-muted/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
      disabled={disabled}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      maxLength={maxLength}
    />
    <label className="absolute left-4 top-2 text-xs font-medium text-muted-foreground transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  </div>
);

export function ClientSenderForm({ form }: ClientSenderFormProps) {
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);

  const handleCNPJBlur = async (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, "");
    if (cleanCNPJ.length === 14) {
      setIsLoadingCNPJ(true);
      const data = await fetchCNPJData(cnpj);
      if (data) {
        form.setValue("sender.name", data.alias || data.company.name);
        form.setValue("sender.address.zipcode", formatCEP(data.address.zip));
        form.setValue("sender.address.street", data.address.street);
        form.setValue("sender.address.number", data.address.number);
        form.setValue("sender.address.complement", data.address.details || "");
        form.setValue("sender.address.neighborhood", data.address.district);
        form.setValue("sender.address.city", data.address.city);
        form.setValue("sender.address.state", data.address.state);
      }
      setIsLoadingCNPJ(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Auto-fill indicator */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-sm">
        <Building2 className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground">
          Digite o CNPJ para preencher automaticamente
        </span>
        {isLoadingCNPJ && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
      </div>

      {/* Document & Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="sender.document"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingInput
                  label="CPF/CNPJ"
                  required
                  disabled={isLoadingCNPJ}
                  value={field.value}
                  onChange={(e) => field.onChange(formatCPFCNPJ(e.target.value))}
                  onBlur={() => {
                    field.onBlur();
                    handleCNPJBlur(field.value);
                  }}
                  maxLength={18}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sender.name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingInput
                  label="Nome / Razão Social"
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
      </div>

      {/* Address section */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Endereço
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="sender.address.zipcode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingInput
                    label="CEP"
                    required
                    value={field.value}
                    onChange={(e) => field.onChange(formatCEP(e.target.value))}
                    onBlur={field.onBlur}
                    maxLength={9}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sender.address.state"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingInput
                    label="Estado"
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

          <FormField
            control={form.control}
            name="sender.address.city"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormControl>
                  <FloatingInput
                    label="Cidade"
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
        </div>

        <FormField
          control={form.control}
          name="sender.address.street"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingInput
                  label="Rua / Logradouro"
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

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="sender.address.number"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingInput
                    label="Número"
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

          <FormField
            control={form.control}
            name="sender.address.neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingInput
                    label="Bairro"
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

          <FormField
            control={form.control}
            name="sender.address.complement"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingInput
                    label="Complemento"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
