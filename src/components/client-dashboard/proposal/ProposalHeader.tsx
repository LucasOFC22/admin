
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText } from 'lucide-react';
import { QuoteDetails } from "@/types/quote";

interface ProposalHeaderProps {
  selectedQuote: QuoteDetails;
}

const ProposalHeader = ({ selectedQuote }: ProposalHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-corporate-600 to-corporate-700 text-white p-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
          <FileText className="h-7 w-7" />
          Proposta Comercial
        </DialogTitle>
        <div className="flex items-center gap-4 mt-2">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            ID: {selectedQuote.quoteId}
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {selectedQuote.date ? (typeof selectedQuote.date === 'string' ? selectedQuote.date : selectedQuote.date.toLocaleDateString('pt-BR')) : 'N/A'}
          </Badge>
        </div>
      </DialogHeader>
    </div>
  );
};

export default ProposalHeader;
