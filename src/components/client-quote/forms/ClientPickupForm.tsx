import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { QuoteFormValues } from "@/schemas/quoteFormSchema";
import { formatCEP } from "@/lib/formatters";
import { Truck, MapPinOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeInput } from "@/components/ui/time-input";

interface ClientPickupFormProps {
  form: UseFormReturn<QuoteFormValues>;
}

interface FloatingInputProps {
  label: string;
  required?: boolean;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  maxLength?: number;
}

const FloatingInput = ({
  label,
  required,
  className,
  value,
  onChange,
  onBlur,
  maxLength,
}: FloatingInputProps) => (
  <div className={cn("relative group", className)}>
    <Input
      placeholder=" "
      className="peer h-14 pt-6 pb-2 px-4 text-sm bg-muted/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
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

export function ClientPickupForm({ form }: ClientPickupFormProps) {
  const needsPickup = form.watch("pickup.needsPickup");

  return (
    <div className="space-y-6">
      {/* Toggle Buttons */}
      <FormField
        control={form.control}
        name="pickup.needsPickup"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all",
                    field.value === true
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/50"
                  )}
                >
                  <Truck className="h-6 w-6" />
                  <div className="text-center">
                    <p className="font-semibold text-sm">Sim, preciso</p>
                    <p className="text-xs opacity-70">Buscar no local</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all",
                    field.value === false
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/50"
                  )}
                >
                  <MapPinOff className="h-6 w-6" />
                  <div className="text-center">
                    <p className="font-semibold text-sm">Não preciso</p>
                    <p className="text-xs opacity-70">Eu levo ao terminal</p>
                  </div>
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Pickup Details */}
      {needsPickup && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Contact */}
          <FormField
            control={form.control}
            name="pickup.contactName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingInput
                    label="Responsável pela coleta"
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

          {/* Address */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Local de Coleta
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="pickup.address.zipcode"
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
                name="pickup.address.state"
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
                name="pickup.address.city"
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
              name="pickup.address.street"
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
                name="pickup.address.number"
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
                name="pickup.address.neighborhood"
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
                name="pickup.address.complement"
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

          {/* Working Hours */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Horário de Funcionamento
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="pickup.workingHours.from"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <TimeInput
                          placeholder=" "
                          className="h-14 pt-6 pb-2 px-4 text-sm bg-muted/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20"
                          {...field}
                        />
                        <label className="absolute left-4 top-2 text-xs font-medium text-muted-foreground">
                          Abertura<span className="text-destructive ml-0.5">*</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pickup.workingHours.to"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <TimeInput
                          placeholder=" "
                          className="h-14 pt-6 pb-2 px-4 text-sm bg-muted/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20"
                          {...field}
                        />
                        <label className="absolute left-4 top-2 text-xs font-medium text-muted-foreground">
                          Fechamento<span className="text-destructive ml-0.5">*</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pickup.lunchBreak.from"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <TimeInput
                          placeholder=" "
                          className="h-14 pt-6 pb-2 px-4 text-sm bg-muted/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20"
                          {...field}
                        />
                        <label className="absolute left-4 top-2 text-xs font-medium text-muted-foreground">
                          Início almoço
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pickup.lunchBreak.to"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <TimeInput
                          placeholder=" "
                          className="h-14 pt-6 pb-2 px-4 text-sm bg-muted/30 border-0 rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20"
                          {...field}
                        />
                        <label className="absolute left-4 top-2 text-xs font-medium text-muted-foreground">
                          Fim almoço
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
