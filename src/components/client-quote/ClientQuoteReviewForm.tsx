import { UseFormReturn } from "react-hook-form";
import { QuoteFormValues } from "@/schemas/quoteFormSchema";
import { User, MapPin, Truck, Package, Phone, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientQuoteReviewFormProps {
  form: UseFormReturn<QuoteFormValues>;
}

interface ReviewSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ReviewSection = ({ icon, title, children, className }: ReviewSectionProps) => (
  <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
    <div className="flex items-center gap-2 mb-3 text-primary">
      {icon}
      <span className="font-semibold text-sm">{title}</span>
    </div>
    <div className="text-sm text-muted-foreground space-y-1">
      {children}
    </div>
  </div>
);

const ReviewItem = ({ label, value }: { label: string; value?: string }) => (
  value ? (
    <div className="flex justify-between items-start gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground font-medium text-right">{value}</span>
    </div>
  ) : null
);

export const ClientQuoteReviewForm = ({ form }: ClientQuoteReviewFormProps) => {
  const values = form.getValues();

  return (
    <div className="space-y-4">
      {/* Header de confirmação */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Check className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Revise suas informações</p>
          <p className="text-sm text-muted-foreground">Confirme os dados antes de enviar</p>
        </div>
      </div>

      {/* Grid de seções */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReviewSection icon={<User className="h-4 w-4" />} title="Remetente">
          <ReviewItem label="Nome" value={values.sender?.name} />
          <ReviewItem label="Documento" value={values.sender?.document} />
          <ReviewItem 
            label="Endereço" 
            value={values.sender?.address ? 
              `${values.sender.address.street}, ${values.sender.address.number} - ${values.sender.address.city}/${values.sender.address.state}` 
              : undefined
            } 
          />
        </ReviewSection>

        <ReviewSection icon={<MapPin className="h-4 w-4" />} title="Destinatário">
          <ReviewItem label="Nome" value={values.recipient?.name} />
          <ReviewItem label="Documento" value={values.recipient?.document} />
          <ReviewItem 
            label="Endereço" 
            value={values.recipient?.address ? 
              `${values.recipient.address.street}, ${values.recipient.address.number} - ${values.recipient.address.city}/${values.recipient.address.state}` 
              : undefined
            } 
          />
        </ReviewSection>

        <ReviewSection icon={<Truck className="h-4 w-4" />} title="Coleta">
          <ReviewItem 
            label="Necessita coleta" 
            value={values.pickup?.needsPickup ? "Sim" : "Não"} 
          />
          {values.pickup?.needsPickup && (
            <>
              <ReviewItem label="Contato" value={values.pickup?.contactName} />
              <ReviewItem 
                label="Endereço" 
                value={values.pickup?.address ? 
                  `${values.pickup.address.street}, ${values.pickup.address.number} - ${values.pickup.address.city}/${values.pickup.address.state}` 
                  : undefined
                } 
              />
            </>
          )}
        </ReviewSection>

        <ReviewSection icon={<Package className="h-4 w-4" />} title="Carga">
          <ReviewItem label="Descrição" value={values.cargo?.description} />
          <ReviewItem label="Peso" value={values.cargo?.weight ? `${values.cargo.weight} kg` : undefined} />
          <ReviewItem 
            label="Dimensões" 
            value={values.cargo?.height && values.cargo?.length && values.cargo?.depth ? 
              `${values.cargo.height} x ${values.cargo.length} x ${values.cargo.depth} cm` 
              : undefined
            } 
          />
          <ReviewItem 
            label="Valor declarado" 
            value={values.cargo?.declaredValue ? 
              `R$ ${parseFloat(String(values.cargo.declaredValue)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
              : undefined
            } 
          />
          <ReviewItem 
            label="Tipo de frete" 
            value={values.cargo?.freightType === 'cif' ? 'CIF' : 'FOB'} 
          />
        </ReviewSection>
      </div>

      {/* Contato em destaque */}
      <ReviewSection 
        icon={<Phone className="h-4 w-4" />} 
        title="Contato"
        className="bg-accent/30"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ReviewItem label="Nome" value={values.contact?.name} />
          <ReviewItem label="E-mail" value={values.contact?.email} />
          <ReviewItem label="Telefone" value={values.contact?.phone} />
        </div>
        {values.contact?.message && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-muted-foreground">Mensagem:</span>
            <p className="text-foreground mt-1">{values.contact.message}</p>
          </div>
        )}
      </ReviewSection>
    </div>
  );
};
