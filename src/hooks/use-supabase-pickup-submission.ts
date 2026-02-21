import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PickupFormData } from "@/schemas/pickupFormSchema";
import { requireAuthenticatedClient } from "@/config/supabaseAuth";
import { n8nApi } from "@/services/n8n/apiService";
import { estruturarCarga } from "@/utils/cargoCalculations";

export const useSupabasePickupSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const submitPickup = async (data: PickupFormData, notasFiscais: string[] = []) => {
    setIsSubmitting(true);

    try {
      // Se não há notas fiscais, criar apenas um registro sem NFe
      if (notasFiscais.length === 0) {
        notasFiscais = [''];  // String vazia para indicar sem NFe
      }
      
      const registrosInseridos = [];
      
      for (const notaFiscal of notasFiscais) {
        // Mapear dados do formulário para a estrutura do Supabase
        const coletaData = {
          // Dados do solicitante
          solicitante_nome: data.solicitante.nome,
          solicitante_telefone: data.solicitante.telefone,
          solicitante_email: data.solicitante.email,
          
          // Dados da coleta (endereço de origem)
          coleta_rua: data.coleta.rua,
          coleta_numero: data.coleta.numero,
          coleta_complemento: data.coleta.complemento,
          coleta_cidade: data.coleta.cidade,
          coleta_bairro: data.coleta.bairro,
          coleta_cep: data.coleta.cep,
          coleta_ponto_referencia: data.coleta.pontoReferencia,
          coleta_horario_funcionamento_inicio: data.coleta.horarioFuncionamento?.inicio,
          coleta_horario_funcionamento_fim: data.coleta.horarioFuncionamento?.fim,
          coleta_horario_almoco_inicio: data.coleta.horarioAlmoco?.inicio,
          coleta_horario_almoco_fim: data.coleta.horarioAlmoco?.fim,
          
          // Dados da mercadoria
          mercadoria_descricao: data.mercadoria.descricao,
          mercadoria_peso: parseFloat(data.mercadoria.peso) || 0,
          mercadoria_valor: parseFloat(data.mercadoria.valor) || 0,
          mercadoria_comprimento: parseFloat(data.mercadoria.dimensoes.comprimento) || 0,
          mercadoria_largura: parseFloat(data.mercadoria.dimensoes.largura) || 0,
          mercadoria_altura: parseFloat(data.mercadoria.dimensoes.altura) || 0,
          mercadoria_quantidade: parseFloat(data.mercadoria.quantidade) || 1,
          
          // Nota fiscal
          nota_fiscal: notaFiscal || null,
          
          // Dados do remetente
          remetente: data.remetente.empresa,
          remetente_telefone: data.remetente.telefone,
          remetente_documento: data.remetente.documento,
          remetente_rua: data.remetente.rua,
          remetente_numero: data.remetente.numero,
          remetente_complemento: data.remetente.complemento,
          remetente_cidade: data.remetente.cidade,
          remetente_bairro: data.remetente.bairro,
          remetente_cep: data.remetente.cep,
          
          // Dados do destinatário
          destinatario: data.destinatario.empresa,
          destinatario_telefone: data.destinatario.telefone,
          destinatario_documento: data.destinatario.documento,
          destinatario_rua: data.destinatario.rua,
          destinatario_numero: data.destinatario.numero,
          destinatario_complemento: data.destinatario.complemento,
          destinatario_cidade: data.destinatario.cidade,
          destinatario_bairro: data.destinatario.bairro,
          destinatario_cep: data.destinatario.cep,
          
          // Observações
          observacoes: data.observacoes,
          
          // Status padrão
          status: 'Pendente' as const,
          criado_em: new Date().toISOString()
        };

        const supabase = requireAuthenticatedClient();
        // Buscar o próximo ID da tabela sequenciais
        const { data: sequencialData, error: sequencialError } = await supabase
          .from('sequenciais')
          .select('valor')
          .eq('tipo', 'coleta')
          .single();

        if (sequencialError) {
          throw new Error(`Erro ao buscar sequencial: ${sequencialError.message}`);
        }

        const novoId = (sequencialData?.valor || 0) + 1;

        // Atualizar a tabela sequenciais com o novo valor
        const { error: updateSequencialError } = await supabase
          .from('sequenciais')
          .update({ valor: novoId })
          .eq('tipo', 'coleta');

        if (updateSequencialError) {
          throw new Error(`Erro ao atualizar sequencial: ${updateSequencialError.message}`);
        }

        // Adicionar o ID ao objeto de dados da coleta
        const coletaComId = {
          ...coletaData,
          id: novoId
        };

        // Inserir no Supabase
        const { data: insertedData, error } = await supabase
          .from('coleta')
          .insert([coletaComId])
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        registrosInseridos.push(insertedData);
      }

      // Agora enviar para o n8n também (apenas uma vez)
      try {
        // Estruturar dados da carga
        const cargaEstruturada = estruturarCarga(
          data.mercadoria.descricao || '',
          parseFloat(data.mercadoria.peso) || 0,
          parseFloat(data.mercadoria.quantidade) || 1,
          parseFloat(data.mercadoria.valor) || 0,
          {
            altura: parseFloat(data.mercadoria.dimensoes.altura) || 0,
            comprimento: parseFloat(data.mercadoria.dimensoes.comprimento) || 0,
            largura: parseFloat(data.mercadoria.dimensoes.largura) || 0
          }
        );
        
        // Formatar observações com informações do solicitante
        const observacoesFormatadas = `Contato:

Nome: ${data.solicitante.nome}
Telefone: ${data.solicitante.telefone}
Email: ${data.solicitante.email}
Obs: ${data.observacoes || 'Nenhuma observação adicional'}`;
        
        await n8nApi.makeN8nRequest({
          eventType: "coleta",
          acao: "salvar",
          timestamp: new Date().toISOString(),
          dados: {
            solicitante: data.solicitante,
            coleta: {
              endereco: {
                rua: data.coleta.rua,
                numero: data.coleta.numero,
                complemento: data.coleta.complemento,
                cidade: data.coleta.cidade,
                bairro: data.coleta.bairro,
                cep: data.coleta.cep,
                pontoReferencia: data.coleta.pontoReferencia
              },
              horarioFuncionamento: data.coleta.horarioFuncionamento,
              horarioAlmoco: data.coleta.horarioAlmoco
            },
            carga: cargaEstruturada,
            remetente: data.remetente,
            destinatario: data.destinatario,
            notasFiscais,
            observacoes: observacoesFormatadas
          }
        });
      } catch (n8nError) {
        console.warn('Erro ao enviar para n8n (não crítico):', n8nError);
      }

      const totalRegistros = registrosInseridos.length;
      const primeiroId = registrosInseridos[0]?.id;
      
      toast({
        title: "Solicitação enviada com sucesso!",
        description: totalRegistros > 1 
          ? `${totalRegistros} cotações foram registradas a partir do ID #${primeiroId}. Entraremos em contato em breve.`
          : `Sua coleta foi registrada com ID #${primeiroId}. Entraremos em contato em breve.`,
      });

      setIsComplete(true);
    } catch (error: any) {
      console.error('Erro ao enviar solicitação de coleta:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message || "Tente novamente ou entre em contato conosco.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmission = () => {
    setIsComplete(false);
    setIsSubmitting(false);
  };

  return {
    isSubmitting,
    isComplete,
    submitPickup,
    resetSubmission
  };
};
