import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { QuoteFormValues } from "@/schemas/quoteFormSchema";
import { Package, Plus, Trash2, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientCargoFormProps {
  form: UseFormReturn<QuoteFormValues>;
}

interface CargoItem {
  id: string;
  nfe: string;
  valor: string;
  unidade: string;
  peso: string;
  altura: string;
  comprimento: string;
  profundidade: string;
  m3: string;
  observacoes: string;
}

interface FloatingInputProps {
  label: string;
  required?: boolean;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  maxLength?: number;
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

export function ClientCargoForm({ form }: ClientCargoFormProps) {
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    nfe: "",
    valor: "",
    unidade: "1",
    peso: "",
    altura: "",
    comprimento: "",
    profundidade: "",
    observacoes: "",
  });

  useEffect(() => {
    const savedNotes = form.getValues("cargo.notes");
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCargoItems(parsed);
        }
      } catch {}
    }
  }, []);

  const calculateM3 = (a: string, c: string, p: string, q: string = "1") => {
    const parse = (v: string) => parseFloat(v.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    return (parse(a) * parse(c) * parse(p) * (parse(q) || 1)).toFixed(4);
  };

  const formatNumber = (v: string) => {
    let cleaned = v.replace(/[^\d,]/g, "");
    if (cleaned.includes(",")) {
      const [int, dec] = cleaned.split(",");
      cleaned = int + "," + (dec?.slice(0, 2) || "");
    }
    return cleaned;
  };

  const handleAddItem = () => {
    if (!currentItem.nfe || !currentItem.valor || !currentItem.peso || 
        !currentItem.altura || !currentItem.comprimento || !currentItem.profundidade) {
      return;
    }

    const newItem: CargoItem = {
      id: Date.now().toString(),
      ...currentItem,
      m3: calculateM3(currentItem.altura, currentItem.comprimento, currentItem.profundidade, currentItem.unidade),
    };

    const updated = [...cargoItems, newItem];
    setCargoItems(updated);
    updateFormValues(updated);
    setCurrentItem({ nfe: "", valor: "", unidade: "1", peso: "", altura: "", comprimento: "", profundidade: "", observacoes: "" });
  };

  const handleRemoveItem = (id: string) => {
    const updated = cargoItems.filter((i) => i.id !== id);
    setCargoItems(updated);
    updateFormValues(updated);
  };

  const updateFormValues = (items: CargoItem[]) => {
    const parse = (v: string) => parseFloat(v.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    
    const totalPeso = items.reduce((s, i) => s + parse(i.peso), 0);
    const totalValor = items.reduce((s, i) => s + parse(i.valor), 0);
    const totalM3 = items.reduce((s, i) => s + parseFloat(i.m3), 0);

    form.setValue("cargo.weight", totalPeso.toFixed(2) as any);
    form.setValue("cargo.declaredValue", totalValor.toFixed(2) as any);
    form.setValue("cargo.description", `${items.length} item(ns) - ${totalM3.toFixed(4)} m³`);

    if (items.length > 0) {
      form.setValue("cargo.height", Math.max(...items.map((i) => parse(i.altura))).toFixed(2) as any);
      form.setValue("cargo.length", Math.max(...items.map((i) => parse(i.comprimento))).toFixed(2) as any);
      form.setValue("cargo.depth", Math.max(...items.map((i) => parse(i.profundidade))).toFixed(2) as any);
    }

    form.setValue("cargo.notes", JSON.stringify(items));
  };

  // Freight type toggle
  const freightType = form.watch("cargo.freightType");

  return (
    <div className="space-y-6">
      {/* Freight Type */}
      <FormField
        control={form.control}
        name="cargo.freightType"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => field.onChange("cif")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center",
                    field.value === "cif"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:border-muted-foreground/50"
                  )}
                >
                  <p className={cn("font-semibold text-sm", field.value === "cif" ? "text-primary" : "text-muted-foreground")}>CIF</p>
                  <p className="text-xs text-muted-foreground">Frete pago pelo remetente</p>
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange("fob")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center",
                    field.value === "fob"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:border-muted-foreground/50"
                  )}
                >
                  <p className={cn("font-semibold text-sm", field.value === "fob" ? "text-primary" : "text-muted-foreground")}>FOB</p>
                  <p className="text-xs text-muted-foreground">Frete pago pelo destinatário</p>
                </button>
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      {/* Add Item Form */}
      <div className="p-5 rounded-xl bg-muted/20 border border-border space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Adicionar Item</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FloatingInput
            label="NF-e"
            required
            value={currentItem.nfe}
            onChange={(e) => setCurrentItem({ ...currentItem, nfe: e.target.value })}
          />
          <FloatingInput
            label="Valor (R$)"
            required
            value={currentItem.valor}
            onChange={(e) => setCurrentItem({ ...currentItem, valor: formatNumber(e.target.value) })}
          />
          <FloatingInput
            label="Quantidade"
            value={currentItem.unidade}
            onChange={(e) => setCurrentItem({ ...currentItem, unidade: e.target.value.replace(/\D/g, "") })}
          />
          <FloatingInput
            label="Peso (kg)"
            required
            value={currentItem.peso}
            onChange={(e) => setCurrentItem({ ...currentItem, peso: formatNumber(e.target.value) })}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FloatingInput
            label="Altura (cm)"
            required
            value={currentItem.altura}
            onChange={(e) => setCurrentItem({ ...currentItem, altura: formatNumber(e.target.value) })}
          />
          <FloatingInput
            label="Comprimento (cm)"
            required
            value={currentItem.comprimento}
            onChange={(e) => setCurrentItem({ ...currentItem, comprimento: formatNumber(e.target.value) })}
          />
          <FloatingInput
            label="Profundidade (cm)"
            required
            value={currentItem.profundidade}
            onChange={(e) => setCurrentItem({ ...currentItem, profundidade: formatNumber(e.target.value) })}
          />
        </div>

        {currentItem.altura && currentItem.comprimento && currentItem.profundidade && (
          <p className="text-xs text-muted-foreground">
            m³ calculado: {calculateM3(currentItem.altura, currentItem.comprimento, currentItem.profundidade, currentItem.unidade)}
          </p>
        )}

        <Button
          type="button"
          onClick={handleAddItem}
          className="w-full gap-2"
          variant="secondary"
        >
          <Plus className="h-4 w-4" />
          Adicionar à lista
        </Button>
      </div>

      {/* Items List */}
      {cargoItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">{cargoItems.length} item(ns) adicionado(s)</p>
          </div>

          <div className="space-y-2">
            {cargoItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">NF-e</p>
                    <p className="font-medium">{item.nfe}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="font-medium text-primary">R$ {item.valor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="font-medium">{item.peso} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dimensões</p>
                    <p className="font-medium font-mono text-xs">{item.altura}×{item.comprimento}×{item.profundidade}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">m³</p>
                    <p className="font-medium">{item.m3}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Peso Total</p>
                <p className="font-semibold text-foreground">
                  {cargoItems.reduce((s, i) => s + (parseFloat(i.peso.replace(",", ".")) || 0), 0).toFixed(2)} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="font-semibold text-primary">
                  R$ {cargoItems.reduce((s, i) => s + (parseFloat(i.valor.replace(",", ".")) || 0), 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">m³ Total</p>
                <p className="font-semibold text-foreground">
                  {cargoItems.reduce((s, i) => s + parseFloat(i.m3), 0).toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
