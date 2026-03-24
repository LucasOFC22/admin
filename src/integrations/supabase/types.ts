export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      avaliacoes_whatsapp: {
        Row: {
          agilidade: number | null
          chat_id: number
          cordialidade: number | null
          criado_em: string | null
          id: string
          mensagem: string | null
          nps: number | null
          qualidade: number | null
          recomendaria: string | null
          resolvido: string | null
          respondido: boolean | null
          respondido_em: string | null
          token: string
        }
        Insert: {
          agilidade?: number | null
          chat_id: number
          cordialidade?: number | null
          criado_em?: string | null
          id?: string
          mensagem?: string | null
          nps?: number | null
          qualidade?: number | null
          recomendaria?: string | null
          resolvido?: string | null
          respondido?: boolean | null
          respondido_em?: string | null
          token?: string
        }
        Update: {
          agilidade?: number | null
          chat_id?: number
          cordialidade?: number | null
          criado_em?: string | null
          id?: string
          mensagem?: string | null
          nps?: number | null
          qualidade?: number | null
          recomendaria?: string | null
          resolvido?: string | null
          respondido?: boolean | null
          respondido_em?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_whatsapp_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      avaria_itens: {
        Row: {
          avaria_id: string
          criado_em: string | null
          descricao: string | null
          id: string
          nfe: string
          valor: number
        }
        Insert: {
          avaria_id: string
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nfe: string
          valor?: number
        }
        Update: {
          avaria_id?: string
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nfe?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaria_itens_avaria_id_fkey"
            columns: ["avaria_id"]
            isOneToOne: false
            referencedRelation: "avarias"
            referencedColumns: ["id"]
          },
        ]
      }
      avarias: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          criado_por: string | null
          id: string
          mdfe: string
          motorista_nome: string
          observacoes: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          mdfe: string
          motorista_nome: string
          observacoes?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          mdfe?: string
          motorista_nome?: string
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avarias_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_contatos: {
        Row: {
          campanha_id: string | null
          contato_id: string | null
          created_at: string | null
          entregue_em: string | null
          enviado_em: string | null
          erro_detalhes: string | null
          id: string
          lido_em: string | null
          message_id: string | null
          nome: string | null
          status: string | null
          telefone: string
        }
        Insert: {
          campanha_id?: string | null
          contato_id?: string | null
          created_at?: string | null
          entregue_em?: string | null
          enviado_em?: string | null
          erro_detalhes?: string | null
          id?: string
          lido_em?: string | null
          message_id?: string | null
          nome?: string | null
          status?: string | null
          telefone: string
        }
        Update: {
          campanha_id?: string | null
          contato_id?: string | null
          created_at?: string | null
          entregue_em?: string | null
          enviado_em?: string | null
          erro_detalhes?: string | null
          id?: string
          lido_em?: string | null
          message_id?: string | null
          nome?: string | null
          status?: string | null
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_contatos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_contatos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_envios_pendentes: {
        Row: {
          campanha_id: string
          enviado_em: string | null
          flow_id: string | null
          id: string
          respondido_em: string | null
          status: string
          telefone: string
        }
        Insert: {
          campanha_id: string
          enviado_em?: string | null
          flow_id?: string | null
          id?: string
          respondido_em?: string | null
          status?: string
          telefone: string
        }
        Update: {
          campanha_id?: string
          enviado_em?: string | null
          flow_id?: string | null
          id?: string
          respondido_em?: string | null
          status?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_envios_pendentes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_envios_pendentes_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flow_builders"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_whatsapp: {
        Row: {
          agendado_para: string | null
          body_variables: Json | null
          conexao_id: string | null
          created_at: string | null
          criado_por: string | null
          descricao: string | null
          entregues: number | null
          enviados: number | null
          erros: number | null
          finalizado_em: string | null
          flow_id: string | null
          header_variables: Json | null
          id: string
          iniciado_em: string | null
          lidos: number | null
          nome: string
          status: string | null
          template_language: string | null
          template_name: string
          total_contatos: number | null
          updated_at: string | null
        }
        Insert: {
          agendado_para?: string | null
          body_variables?: Json | null
          conexao_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          entregues?: number | null
          enviados?: number | null
          erros?: number | null
          finalizado_em?: string | null
          flow_id?: string | null
          header_variables?: Json | null
          id?: string
          iniciado_em?: string | null
          lidos?: number | null
          nome: string
          status?: string | null
          template_language?: string | null
          template_name: string
          total_contatos?: number | null
          updated_at?: string | null
        }
        Update: {
          agendado_para?: string | null
          body_variables?: Json | null
          conexao_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          entregues?: number | null
          enviados?: number | null
          erros?: number | null
          finalizado_em?: string | null
          flow_id?: string | null
          header_variables?: Json | null
          id?: string
          iniciado_em?: string | null
          lidos?: number | null
          nome?: string
          status?: string | null
          template_language?: string | null
          template_name?: string
          total_contatos?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_whatsapp_conexao_id_fkey"
            columns: ["conexao_id"]
            isOneToOne: false
            referencedRelation: "conexoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_whatsapp_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_whatsapp_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flow_builders"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          departamento: number | null
          descricao: string | null
          id: number
          level: number | null
          nome: string
          permissoes: string[] | null
          pode_excluir: boolean | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          departamento?: number | null
          descricao?: string | null
          id?: number
          level?: number | null
          nome: string
          permissoes?: string[] | null
          pode_excluir?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          departamento?: number | null
          descricao?: string | null
          id?: number
          level?: number | null
          nome?: string
          permissoes?: string[] | null
          pode_excluir?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cargos_departamento_fkey"
            columns: ["departamento"]
            isOneToOne: false
            referencedRelation: "cargos_departamento"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos_departamento: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          descricao: string | null
          id: number
          nome: string
          status: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: number
          nome: string
          status?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: number
          nome?: string
          status?: boolean | null
        }
        Relationships: []
      }
      chat_online_config: {
        Row: {
          created_at: string | null
          escalacao_habilitada: boolean
          id: number
          maintenance_message: string
          status_bot: boolean
          status_chat: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          escalacao_habilitada: boolean
          id?: number
          maintenance_message: string
          status_bot: boolean
          status_chat: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          escalacao_habilitada?: boolean
          id?: number
          maintenance_message?: string
          status_bot?: boolean
          status_chat?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      chats_internos: {
        Row: {
          created_at: string | null
          id: string
          owner_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chats_whatsapp: {
        Row: {
          aceitoporadmin: boolean | null
          adminid: string | null
          adminid_antigo: string | null
          adminid_pendente: string | null
          ativo: boolean | null
          atualizadoem: string
          campanha_flow_id: string | null
          closed_by_inactivity: boolean | null
          criadoem: string | null
          encerradoem: string | null
          filas: string | null
          id: number
          last_customer_message_at: string | null
          mododeatendimento: string | null
          origem_campanha_id: string | null
          resolvido: boolean | null
          tags: string | null
          usuarioid: string
        }
        Insert: {
          aceitoporadmin?: boolean | null
          adminid?: string | null
          adminid_antigo?: string | null
          adminid_pendente?: string | null
          ativo?: boolean | null
          atualizadoem?: string
          campanha_flow_id?: string | null
          closed_by_inactivity?: boolean | null
          criadoem?: string | null
          encerradoem?: string | null
          filas?: string | null
          id?: number
          last_customer_message_at?: string | null
          mododeatendimento?: string | null
          origem_campanha_id?: string | null
          resolvido?: boolean | null
          tags?: string | null
          usuarioid: string
        }
        Update: {
          aceitoporadmin?: boolean | null
          adminid?: string | null
          adminid_antigo?: string | null
          adminid_pendente?: string | null
          ativo?: boolean | null
          atualizadoem?: string
          campanha_flow_id?: string | null
          closed_by_inactivity?: boolean | null
          criadoem?: string | null
          encerradoem?: string | null
          filas?: string | null
          id?: number
          last_customer_message_at?: string | null
          mododeatendimento?: string | null
          origem_campanha_id?: string | null
          resolvido?: boolean | null
          tags?: string | null
          usuarioid?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_whatsapp_campanha_flow_id_fkey"
            columns: ["campanha_flow_id"]
            isOneToOne: false
            referencedRelation: "flow_builders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_whatsapp_origem_campanha_id_fkey"
            columns: ["origem_campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_whatsapp_usuarioid_fkey"
            columns: ["usuarioid"]
            isOneToOne: false
            referencedRelation: "contatos_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      codigos_recuperacao: {
        Row: {
          codigo_hash: string
          criado_em: string
          expira_em: string
          id: string
          max_tentativas: number
          telefone: string
          tentativas: number
          usado: boolean
          user_id: string
        }
        Insert: {
          codigo_hash: string
          criado_em?: string
          expira_em?: string
          id?: string
          max_tentativas?: number
          telefone: string
          tentativas?: number
          usado?: boolean
          user_id: string
        }
        Update: {
          codigo_hash?: string
          criado_em?: string
          expira_em?: string
          id?: string
          max_tentativas?: number
          telefone?: string
          tentativas?: number
          usado?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "codigos_recuperacao_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conexoes: {
        Row: {
          canal: string
          created_at: string | null
          farewellmessage: string | null
          fluxo_boas_vindas_id: string | null
          fluxo_resposta_padrao_id: string | null
          greetingmessage: string | null
          id: string
          is_default: boolean | null
          nome: string
          retries: number | null
          status: string | null
          telefone: string | null
          updated_at: string | null
          whatsapp_business_account_id: string | null
          whatsapp_phone_id: string | null
          whatsapp_token: string | null
          whatsapp_verify_token: string | null
          whatsapp_webhook_url: string | null
        }
        Insert: {
          canal: string
          created_at?: string | null
          farewellmessage?: string | null
          fluxo_boas_vindas_id?: string | null
          fluxo_resposta_padrao_id?: string | null
          greetingmessage?: string | null
          id?: string
          is_default?: boolean | null
          nome: string
          retries?: number | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp_business_account_id?: string | null
          whatsapp_phone_id?: string | null
          whatsapp_token?: string | null
          whatsapp_verify_token?: string | null
          whatsapp_webhook_url?: string | null
        }
        Update: {
          canal?: string
          created_at?: string | null
          farewellmessage?: string | null
          fluxo_boas_vindas_id?: string | null
          fluxo_resposta_padrao_id?: string | null
          greetingmessage?: string | null
          id?: string
          is_default?: boolean | null
          nome?: string
          retries?: number | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          whatsapp_business_account_id?: string | null
          whatsapp_phone_id?: string | null
          whatsapp_token?: string | null
          whatsapp_verify_token?: string | null
          whatsapp_webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conexoes_fluxo_boas_vindas_id_fkey"
            columns: ["fluxo_boas_vindas_id"]
            isOneToOne: false
            referencedRelation: "flow_builders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conexoes_fluxo_resposta_padrao_id_fkey"
            columns: ["fluxo_resposta_padrao_id"]
            isOneToOne: false
            referencedRelation: "flow_builders"
            referencedColumns: ["id"]
          },
        ]
      }
      config: {
        Row: {
          criado_em: string
          id: number
          manuntecao: boolean
          painel_adm: boolean
          painel_cliente: boolean
          primeiro_login: boolean
        }
        Insert: {
          criado_em?: string
          id?: number
          manuntecao?: boolean
          painel_adm?: boolean
          painel_cliente?: boolean
          primeiro_login?: boolean
        }
        Update: {
          criado_em?: string
          id?: number
          manuntecao?: boolean
          painel_adm?: boolean
          painel_cliente?: boolean
          primeiro_login?: boolean
        }
        Relationships: []
      }
      config_smtp: {
        Row: {
          atualizado_em: string
          criado_em: string
          from_email: string
          from_name: string
          host: string
          id: number
          notificacoes_email: boolean
          notificar_nova_cotacao: boolean
          notificar_proposta_enviada: boolean
          port: number
          secure: boolean
          senha: string
          tamanho_max_arquivo: number
          usuario: string
          validade_dias: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          from_email?: string
          from_name?: string
          host?: string
          id?: never
          notificacoes_email?: boolean
          notificar_nova_cotacao?: boolean
          notificar_proposta_enviada?: boolean
          port?: number
          secure?: boolean
          senha?: string
          tamanho_max_arquivo?: number
          usuario?: string
          validade_dias?: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          from_email?: string
          from_name?: string
          host?: string
          id?: never
          notificacoes_email?: boolean
          notificar_nova_cotacao?: boolean
          notificar_proposta_enviada?: boolean
          port?: number
          secure?: boolean
          senha?: string
          tamanho_max_arquivo?: number
          usuario?: string
          validade_dias?: number
        }
        Relationships: []
      }
      config_whatsapp: {
        Row: {
          accept_audio_message_contact: boolean | null
          accept_audio_message_contact_message: string | null
          accept_call_whatsapp: boolean | null
          accept_call_whatsapp_message: string | null
          call_rejection_template_language: string | null
          call_rejection_template_name: string | null
          call_rejection_template_variables: Json | null
          call_rejection_use_template: boolean | null
          cancel_template_language: string | null
          cancel_template_name: string | null
          cancel_template_variables: Json | null
          cancel_ticket_message: string | null
          cancel_use_template: boolean | null
          close_template_language: string | null
          close_template_name: string | null
          close_template_variables: Json | null
          close_ticket_message: string | null
          close_use_template: boolean | null
          continuacao_message: string | null
          continuacao_template_language: string | null
          continuacao_template_name: string | null
          continuacao_template_variables: Json | null
          continuacao_use_template: boolean | null
          created_at: string | null
          disable_signature: boolean | null
          greeting_accepted_message: string | null
          greeting_template_language: string | null
          greeting_template_name: string | null
          greeting_template_variables: Json | null
          greeting_use_template: boolean | null
          hide_chatbot_tickets: boolean | null
          id: number
          inactivity_enabled: boolean | null
          inactivity_message: string | null
          inactivity_template_language: string | null
          inactivity_template_name: string | null
          inactivity_template_variables: Json | null
          inactivity_timeout_minutes: number | null
          inactivity_use_template: boolean | null
          max_tickets_per_agent: number | null
          new_ticket_message: string | null
          new_ticket_template_language: string | null
          new_ticket_template_name: string | null
          new_ticket_template_variables: Json | null
          new_ticket_use_template: boolean | null
          reopen_template_language: string | null
          reopen_template_name: string | null
          reopen_template_variables: Json | null
          reopen_ticket_message: string | null
          reopen_use_template: boolean | null
          send_greeting_accepted: boolean | null
          send_msg_cancel_ticket: boolean | null
          send_msg_close_ticket: boolean | null
          send_msg_continuacao: boolean | null
          send_msg_new_ticket: boolean | null
          send_msg_reopen_ticket: boolean | null
          send_msg_transf_ticket: boolean | null
          send_sign_message: boolean | null
          transfer_message: string | null
          transfer_template_language: string | null
          transfer_template_name: string | null
          transfer_template_variables: Json | null
          transfer_use_template: boolean | null
          updated_at: string | null
          user_rating: boolean | null
        }
        Insert: {
          accept_audio_message_contact?: boolean | null
          accept_audio_message_contact_message?: string | null
          accept_call_whatsapp?: boolean | null
          accept_call_whatsapp_message?: string | null
          call_rejection_template_language?: string | null
          call_rejection_template_name?: string | null
          call_rejection_template_variables?: Json | null
          call_rejection_use_template?: boolean | null
          cancel_template_language?: string | null
          cancel_template_name?: string | null
          cancel_template_variables?: Json | null
          cancel_ticket_message?: string | null
          cancel_use_template?: boolean | null
          close_template_language?: string | null
          close_template_name?: string | null
          close_template_variables?: Json | null
          close_ticket_message?: string | null
          close_use_template?: boolean | null
          continuacao_message?: string | null
          continuacao_template_language?: string | null
          continuacao_template_name?: string | null
          continuacao_template_variables?: Json | null
          continuacao_use_template?: boolean | null
          created_at?: string | null
          disable_signature?: boolean | null
          greeting_accepted_message?: string | null
          greeting_template_language?: string | null
          greeting_template_name?: string | null
          greeting_template_variables?: Json | null
          greeting_use_template?: boolean | null
          hide_chatbot_tickets?: boolean | null
          id?: number
          inactivity_enabled?: boolean | null
          inactivity_message?: string | null
          inactivity_template_language?: string | null
          inactivity_template_name?: string | null
          inactivity_template_variables?: Json | null
          inactivity_timeout_minutes?: number | null
          inactivity_use_template?: boolean | null
          max_tickets_per_agent?: number | null
          new_ticket_message?: string | null
          new_ticket_template_language?: string | null
          new_ticket_template_name?: string | null
          new_ticket_template_variables?: Json | null
          new_ticket_use_template?: boolean | null
          reopen_template_language?: string | null
          reopen_template_name?: string | null
          reopen_template_variables?: Json | null
          reopen_ticket_message?: string | null
          reopen_use_template?: boolean | null
          send_greeting_accepted?: boolean | null
          send_msg_cancel_ticket?: boolean | null
          send_msg_close_ticket?: boolean | null
          send_msg_continuacao?: boolean | null
          send_msg_new_ticket?: boolean | null
          send_msg_reopen_ticket?: boolean | null
          send_msg_transf_ticket?: boolean | null
          send_sign_message?: boolean | null
          transfer_message?: string | null
          transfer_template_language?: string | null
          transfer_template_name?: string | null
          transfer_template_variables?: Json | null
          transfer_use_template?: boolean | null
          updated_at?: string | null
          user_rating?: boolean | null
        }
        Update: {
          accept_audio_message_contact?: boolean | null
          accept_audio_message_contact_message?: string | null
          accept_call_whatsapp?: boolean | null
          accept_call_whatsapp_message?: string | null
          call_rejection_template_language?: string | null
          call_rejection_template_name?: string | null
          call_rejection_template_variables?: Json | null
          call_rejection_use_template?: boolean | null
          cancel_template_language?: string | null
          cancel_template_name?: string | null
          cancel_template_variables?: Json | null
          cancel_ticket_message?: string | null
          cancel_use_template?: boolean | null
          close_template_language?: string | null
          close_template_name?: string | null
          close_template_variables?: Json | null
          close_ticket_message?: string | null
          close_use_template?: boolean | null
          continuacao_message?: string | null
          continuacao_template_language?: string | null
          continuacao_template_name?: string | null
          continuacao_template_variables?: Json | null
          continuacao_use_template?: boolean | null
          created_at?: string | null
          disable_signature?: boolean | null
          greeting_accepted_message?: string | null
          greeting_template_language?: string | null
          greeting_template_name?: string | null
          greeting_template_variables?: Json | null
          greeting_use_template?: boolean | null
          hide_chatbot_tickets?: boolean | null
          id?: number
          inactivity_enabled?: boolean | null
          inactivity_message?: string | null
          inactivity_template_language?: string | null
          inactivity_template_name?: string | null
          inactivity_template_variables?: Json | null
          inactivity_timeout_minutes?: number | null
          inactivity_use_template?: boolean | null
          max_tickets_per_agent?: number | null
          new_ticket_message?: string | null
          new_ticket_template_language?: string | null
          new_ticket_template_name?: string | null
          new_ticket_template_variables?: Json | null
          new_ticket_use_template?: boolean | null
          reopen_template_language?: string | null
          reopen_template_name?: string | null
          reopen_template_variables?: Json | null
          reopen_ticket_message?: string | null
          reopen_use_template?: boolean | null
          send_greeting_accepted?: boolean | null
          send_msg_cancel_ticket?: boolean | null
          send_msg_close_ticket?: boolean | null
          send_msg_continuacao?: boolean | null
          send_msg_new_ticket?: boolean | null
          send_msg_reopen_ticket?: boolean | null
          send_msg_transf_ticket?: boolean | null
          send_sign_message?: boolean | null
          transfer_message?: string | null
          transfer_template_language?: string | null
          transfer_template_name?: string | null
          transfer_template_variables?: Json | null
          transfer_use_template?: boolean | null
          updated_at?: string | null
          user_rating?: boolean | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          atualizado_em: string | null
          chave: string
          criado_em: string | null
          descricao: string | null
          id: number
          tipo: string | null
          valor: string | null
        }
        Insert: {
          atualizado_em?: string | null
          chave: string
          criado_em?: string | null
          descricao?: string | null
          id?: number
          tipo?: string | null
          valor?: string | null
        }
        Update: {
          atualizado_em?: string | null
          chave?: string
          criado_em?: string | null
          descricao?: string | null
          id?: number
          tipo?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      contatos: {
        Row: {
          arquivado: string | null
          contact_id: number
          created_at: string | null
          department: string
          email: string
          lido: string | null
          message: string
          name: string
          phone: string | null
          respondido: string | null
          resposta: string | null
          status: string | null
          subject: string
        }
        Insert: {
          arquivado?: string | null
          contact_id?: number
          created_at?: string | null
          department: string
          email: string
          lido?: string | null
          message: string
          name: string
          phone?: string | null
          respondido?: string | null
          resposta?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          arquivado?: string | null
          contact_id?: number
          created_at?: string | null
          department?: string
          email?: string
          lido?: string | null
          message?: string
          name?: string
          phone?: string | null
          respondido?: string | null
          resposta?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      contatos_whatsapp: {
        Row: {
          chatbot_desabilitado: boolean | null
          criadoem: string
          email: string | null
          id: string
          informacoes_adicionais: Json | null
          nome: string
          perfil: string | null
          telefone: string | null
        }
        Insert: {
          chatbot_desabilitado?: boolean | null
          criadoem?: string
          email?: string | null
          id?: string
          informacoes_adicionais?: Json | null
          nome: string
          perfil?: string | null
          telefone?: string | null
        }
        Update: {
          chatbot_desabilitado?: boolean | null
          criadoem?: string
          email?: string | null
          id?: string
          informacoes_adicionais?: Json | null
          nome?: string
          perfil?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      conversas_internas_whatsapp: {
        Row: {
          admin_id: number
          anexos: string[] | null
          chat_id: number | null
          criado_em: string
          id: string
          marcador: string | null
          mensagem: string
          tipo: string | null
        }
        Insert: {
          admin_id: number
          anexos?: string[] | null
          chat_id?: number | null
          criado_em?: string
          id?: string
          marcador?: string | null
          mensagem: string
          tipo?: string | null
        }
        Update: {
          admin_id?: number
          anexos?: string[] | null
          chat_id?: number | null
          criado_em?: string
          id?: string
          marcador?: string | null
          mensagem?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_internas_whatsapp_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      dbfrete_token: {
        Row: {
          atualizado_em: string | null
          empresas: Json | null
          id: string
          id_cliente: string
          senha: string
          token: string | null
          usuario: string
        }
        Insert: {
          atualizado_em?: string | null
          empresas?: Json | null
          id?: string
          id_cliente: string
          senha: string
          token?: string | null
          usuario: string
        }
        Update: {
          atualizado_em?: string | null
          empresas?: Json | null
          id?: string
          id_cliente?: string
          senha?: string
          token?: string | null
          usuario?: string
        }
        Relationships: []
      }
      documento_downloads: {
        Row: {
          baixado_em: string
          cnpj_cpf: string | null
          documento_id: string
          id: string
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          baixado_em?: string
          cnpj_cpf?: string | null
          documento_id: string
          id?: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          baixado_em?: string
          cnpj_cpf?: string | null
          documento_id?: string
          id?: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documento_downloads_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_repositorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_downloads_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_repositorio: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          descricao: string | null
          id: string
          instrucoes: string | null
          mime_type: string | null
          nome_arquivo: string
          storage_path: string
          tamanho_bytes: number | null
          titulo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          instrucoes?: string | null
          mime_type?: string | null
          nome_arquivo: string
          storage_path?: string
          tamanho_bytes?: number | null
          titulo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          instrucoes?: string | null
          mime_type?: string | null
          nome_arquivo?: string
          storage_path?: string
          tamanho_bytes?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_repositorio_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      email_anexos: {
        Row: {
          content_id: string | null
          created_at: string | null
          email_mensagem_id: string
          id: string
          is_inline: boolean | null
          nome: string
          part_id: string | null
          tamanho: number | null
          tipo_mime: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          email_mensagem_id: string
          id?: string
          is_inline?: boolean | null
          nome: string
          part_id?: string | null
          tamanho?: number | null
          tipo_mime?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          email_mensagem_id?: string
          id?: string
          is_inline?: boolean | null
          nome?: string
          part_id?: string | null
          tamanho?: number | null
          tipo_mime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_anexos_email_mensagem_id_fkey"
            columns: ["email_mensagem_id"]
            isOneToOne: false
            referencedRelation: "email_mensagens"
            referencedColumns: ["id"]
          },
        ]
      }
      email_conta_usuarios: {
        Row: {
          created_at: string | null
          email_conta_id: string
          id: string
          padrao: boolean | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          email_conta_id: string
          id?: string
          padrao?: boolean | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          email_conta_id?: string
          id?: string
          padrao?: boolean | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_conta_usuarios_email_conta_id_fkey"
            columns: ["email_conta_id"]
            isOneToOne: false
            referencedRelation: "email_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_conta_usuarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      email_contas: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          id: string
          imap_host: string
          imap_port: number | null
          imap_ssl: boolean | null
          nome: string
          senha_criptografada: string
          smtp_host: string
          smtp_port: number | null
          smtp_ssl: boolean | null
          ultima_sincronizacao: string | null
          updated_at: string | null
          verificado: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          imap_host: string
          imap_port?: number | null
          imap_ssl?: boolean | null
          nome: string
          senha_criptografada: string
          smtp_host: string
          smtp_port?: number | null
          smtp_ssl?: boolean | null
          ultima_sincronizacao?: string | null
          updated_at?: string | null
          verificado?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          imap_host?: string
          imap_port?: number | null
          imap_ssl?: boolean | null
          nome?: string
          senha_criptografada?: string
          smtp_host?: string
          smtp_port?: number | null
          smtp_ssl?: boolean | null
          ultima_sincronizacao?: string | null
          updated_at?: string | null
          verificado?: boolean | null
        }
        Relationships: []
      }
      email_contatos: {
        Row: {
          created_at: string | null
          email: string
          email_conta_id: string
          id: string
          nome: string
          origem: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_conta_id: string
          id?: string
          nome: string
          origem?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_conta_id?: string
          id?: string
          nome?: string
          origem?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_contatos_email_conta_id_fkey"
            columns: ["email_conta_id"]
            isOneToOne: false
            referencedRelation: "email_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      email_mensagens: {
        Row: {
          assunto: string | null
          cc: string[] | null
          created_at: string | null
          data: string | null
          de: string
          de_nome: string | null
          email_conta_id: string
          email_pasta_id: string | null
          has_attachments: boolean | null
          headers: Json | null
          id: string
          in_reply_to: string | null
          lido: boolean | null
          message_id: string | null
          para: string[] | null
          pasta: string | null
          preview: string | null
          references: string[] | null
          starred: boolean | null
          tamanho_bytes: number | null
          thread_id: string | null
          uid: number
          updated_at: string | null
        }
        Insert: {
          assunto?: string | null
          cc?: string[] | null
          created_at?: string | null
          data?: string | null
          de: string
          de_nome?: string | null
          email_conta_id: string
          email_pasta_id?: string | null
          has_attachments?: boolean | null
          headers?: Json | null
          id?: string
          in_reply_to?: string | null
          lido?: boolean | null
          message_id?: string | null
          para?: string[] | null
          pasta?: string | null
          preview?: string | null
          references?: string[] | null
          starred?: boolean | null
          tamanho_bytes?: number | null
          thread_id?: string | null
          uid: number
          updated_at?: string | null
        }
        Update: {
          assunto?: string | null
          cc?: string[] | null
          created_at?: string | null
          data?: string | null
          de?: string
          de_nome?: string | null
          email_conta_id?: string
          email_pasta_id?: string | null
          has_attachments?: boolean | null
          headers?: Json | null
          id?: string
          in_reply_to?: string | null
          lido?: boolean | null
          message_id?: string | null
          para?: string[] | null
          pasta?: string | null
          preview?: string | null
          references?: string[] | null
          starred?: boolean | null
          tamanho_bytes?: number | null
          thread_id?: string | null
          uid?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_mensagens_email_conta_id_fkey"
            columns: ["email_conta_id"]
            isOneToOne: false
            referencedRelation: "email_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_mensagens_email_pasta_id_fkey"
            columns: ["email_pasta_id"]
            isOneToOne: false
            referencedRelation: "email_pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      email_pastas: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email_conta_id: string
          id: string
          nao_lidos: number | null
          nome_exibicao: string | null
          nome_imap: string
          tipo: string | null
          total_mensagens: number | null
          uid_validity: number | null
          ultimo_uid_sincronizado: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email_conta_id: string
          id?: string
          nao_lidos?: number | null
          nome_exibicao?: string | null
          nome_imap: string
          tipo?: string | null
          total_mensagens?: number | null
          uid_validity?: number | null
          ultimo_uid_sincronizado?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email_conta_id?: string
          id?: string
          nao_lidos?: number | null
          nome_exibicao?: string | null
          nome_imap?: string
          tipo?: string | null
          total_mensagens?: number | null
          uid_validity?: number | null
          ultimo_uid_sincronizado?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_pastas_email_conta_id_fkey"
            columns: ["email_conta_id"]
            isOneToOne: false
            referencedRelation: "email_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferencias_usuario: {
        Row: {
          assinatura_ativa: boolean | null
          assinatura_html: string | null
          assinatura_texto: string | null
          created_at: string | null
          email_conta_id: string | null
          formato_padrao: string | null
          id: string
          marcar_lido_automatico: boolean | null
          mensagens_por_pagina: number | null
          pasta_padrao: string | null
          responder_com_citacao: string | null
          updated_at: string | null
          usuario_id: string
          view: string | null
        }
        Insert: {
          assinatura_ativa?: boolean | null
          assinatura_html?: string | null
          assinatura_texto?: string | null
          created_at?: string | null
          email_conta_id?: string | null
          formato_padrao?: string | null
          id?: string
          marcar_lido_automatico?: boolean | null
          mensagens_por_pagina?: number | null
          pasta_padrao?: string | null
          responder_com_citacao?: string | null
          updated_at?: string | null
          usuario_id: string
          view?: string | null
        }
        Update: {
          assinatura_ativa?: boolean | null
          assinatura_html?: string | null
          assinatura_texto?: string | null
          created_at?: string | null
          email_conta_id?: string | null
          formato_padrao?: string | null
          id?: string
          marcar_lido_automatico?: boolean | null
          mensagens_por_pagina?: number | null
          pasta_padrao?: string | null
          responder_com_citacao?: string | null
          updated_at?: string | null
          usuario_id?: string
          view?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_preferencias_usuario_email_conta_id_fkey"
            columns: ["email_conta_id"]
            isOneToOne: false
            referencedRelation: "email_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sync_log: {
        Row: {
          duracao_ms: number | null
          email_conta_id: string
          erro: string | null
          fim: string | null
          id: string
          inicio: string | null
          mensagens_atualizadas: number | null
          mensagens_novas: number | null
          mensagens_removidas: number | null
          pasta: string | null
          status: string | null
        }
        Insert: {
          duracao_ms?: number | null
          email_conta_id: string
          erro?: string | null
          fim?: string | null
          id?: string
          inicio?: string | null
          mensagens_atualizadas?: number | null
          mensagens_novas?: number | null
          mensagens_removidas?: number | null
          pasta?: string | null
          status?: string | null
        }
        Update: {
          duracao_ms?: number | null
          email_conta_id?: string
          erro?: string | null
          fim?: string | null
          id?: string
          inicio?: string | null
          mensagens_atualizadas?: number | null
          mensagens_novas?: number | null
          mensagens_removidas?: number | null
          pasta?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sync_log_email_conta_id_fkey"
            columns: ["email_conta_id"]
            isOneToOne: false
            referencedRelation: "email_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      erros: {
        Row: {
          atualizado_em: string | null
          categoria: string
          criado_em: string | null
          dados_extra: Json | null
          data_ocorrencia: string | null
          descricao: string | null
          id: string
          nivel: string | null
          pagina: string | null
          resolvido: boolean | null
          resolvido_em: string | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          atualizado_em?: string | null
          categoria: string
          criado_em?: string | null
          dados_extra?: Json | null
          data_ocorrencia?: string | null
          descricao?: string | null
          id?: string
          nivel?: string | null
          pagina?: string | null
          resolvido?: boolean | null
          resolvido_em?: string | null
          tipo?: string | null
          titulo: string
        }
        Update: {
          atualizado_em?: string | null
          categoria?: string
          criado_em?: string | null
          dados_extra?: Json | null
          data_ocorrencia?: string | null
          descricao?: string | null
          id?: string
          nivel?: string | null
          pagina?: string | null
          resolvido?: boolean | null
          resolvido_em?: string | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: []
      }
      filas_whatsapp: {
        Row: {
          active: boolean | null
          close_ticket: boolean | null
          color: string | null
          created_at: string
          description: string | null
          enable_rotation: boolean | null
          greeting_message: string | null
          id: number
          name: string | null
          order_position: number | null
          rotation_time: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          close_ticket?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          enable_rotation?: boolean | null
          greeting_message?: string | null
          id?: number
          name?: string | null
          order_position?: number | null
          rotation_time?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          close_ticket?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          enable_rotation?: boolean | null
          greeting_message?: string | null
          id?: number
          name?: string | null
          order_position?: number | null
          rotation_time?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      flow_builders: {
        Row: {
          active: boolean | null
          company_id: number | null
          created_at: string | null
          description: string | null
          flow_data: Json | null
          id: string
          name: string
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          active?: boolean | null
          company_id?: number | null
          created_at?: string | null
          description?: string | null
          flow_data?: Json | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          active?: boolean | null
          company_id?: number | null
          created_at?: string | null
          description?: string | null
          flow_data?: Json | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: []
      }
      flow_execution_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          log_data: Json | null
          node_data: Json | null
          node_id: string | null
          node_type: string | null
          result: string | null
          session_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          log_data?: Json | null
          node_data?: Json | null
          node_id?: string | null
          node_type?: string | null
          result?: string | null
          session_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          log_data?: Json | null
          node_data?: Json | null
          node_id?: string | null
          node_type?: string | null
          result?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_execution_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "flow_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_sessions: {
        Row: {
          chat_id: number | null
          conexao_id: string | null
          contact_name: string | null
          created_at: string | null
          current_block_index: number | null
          current_group_id: string | null
          current_node_id: string | null
          flow_id: string | null
          id: string
          phone_number: string
          processing_id: string | null
          status: string | null
          updated_at: string | null
          variables: Json | null
          waiting_block_type: string | null
        }
        Insert: {
          chat_id?: number | null
          conexao_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          current_block_index?: number | null
          current_group_id?: string | null
          current_node_id?: string | null
          flow_id?: string | null
          id?: string
          phone_number: string
          processing_id?: string | null
          status?: string | null
          updated_at?: string | null
          variables?: Json | null
          waiting_block_type?: string | null
        }
        Update: {
          chat_id?: number | null
          conexao_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          current_block_index?: number | null
          current_group_id?: string | null
          current_node_id?: string | null
          flow_id?: string | null
          id?: string
          phone_number?: string
          processing_id?: string | null
          status?: string | null
          updated_at?: string | null
          variables?: Json | null
          waiting_block_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_sessions_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_sessions_conexao_id_fkey"
            columns: ["conexao_id"]
            isOneToOne: false
            referencedRelation: "conexoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_sessions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flow_builders"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_variables: {
        Row: {
          created_at: string | null
          flow_id: string | null
          id: string
          updated_at: string | null
          variable_key: string
          variable_name: string
          variable_type: string | null
        }
        Insert: {
          created_at?: string | null
          flow_id?: string | null
          id?: string
          updated_at?: string | null
          variable_key: string
          variable_name: string
          variable_type?: string | null
        }
        Update: {
          created_at?: string | null
          flow_id?: string | null
          id?: string
          updated_at?: string | null
          variable_key?: string
          variable_name?: string
          variable_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_variables_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flow_builders"
            referencedColumns: ["id"]
          },
        ]
      }
      listas_contatos: {
        Row: {
          created_at: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listas_contatos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      listas_contatos_membros: {
        Row: {
          contato_id: string | null
          created_at: string | null
          id: string
          lista_id: string | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string | null
          id?: string
          lista_id?: string | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string | null
          id?: string
          lista_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listas_contatos_membros_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listas_contatos_membros_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "listas_contatos"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_atividade: {
        Row: {
          acao: string
          created_at: string | null
          detalhes: string | null
          id: string
          ip_address: string | null
          modulo: string | null
          tipo: string | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          detalhes?: string | null
          id?: string
          ip_address?: string | null
          modulo?: string | null
          tipo?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          detalhes?: string | null
          id?: string
          ip_address?: string | null
          modulo?: string | null
          tipo?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_atividade_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_autenticacao: {
        Row: {
          created_at: string
          detalhes: Json | null
          erro: string | null
          id: string
          ip_address: string | null
          sucesso: boolean | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          detalhes?: Json | null
          erro?: string | null
          id?: string
          ip_address?: string | null
          sucesso?: boolean | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          detalhes?: Json | null
          erro?: string | null
          id?: string
          ip_address?: string | null
          sucesso?: boolean | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_autenticacao_usuario_id_fkey1"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_campanhas: {
        Row: {
          acao: string | null
          campanha_id: string | null
          conexao_id: string | null
          contato_id: string | null
          created_at: string | null
          dados_extra: Json | null
          data_evento: string | null
          duracao_ms: number | null
          entregues: number | null
          enviados: number | null
          erro_codigo: string | null
          erro_detalhes: Json | null
          erro_mensagem: string | null
          erros: number | null
          id: string
          ip_origem: string | null
          lidos: number | null
          message_id: string | null
          status_anterior: string | null
          status_novo: string | null
          telefone: string | null
          template_name: string | null
          tipo_evento: string
          total_contatos: number | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          acao?: string | null
          campanha_id?: string | null
          conexao_id?: string | null
          contato_id?: string | null
          created_at?: string | null
          dados_extra?: Json | null
          data_evento?: string | null
          duracao_ms?: number | null
          entregues?: number | null
          enviados?: number | null
          erro_codigo?: string | null
          erro_detalhes?: Json | null
          erro_mensagem?: string | null
          erros?: number | null
          id?: string
          ip_origem?: string | null
          lidos?: number | null
          message_id?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          telefone?: string | null
          template_name?: string | null
          tipo_evento: string
          total_contatos?: number | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string | null
          campanha_id?: string | null
          conexao_id?: string | null
          contato_id?: string | null
          created_at?: string | null
          dados_extra?: Json | null
          data_evento?: string | null
          duracao_ms?: number | null
          entregues?: number | null
          enviados?: number | null
          erro_codigo?: string | null
          erro_detalhes?: Json | null
          erro_mensagem?: string | null
          erros?: number | null
          id?: string
          ip_origem?: string | null
          lidos?: number | null
          message_id?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          telefone?: string | null
          template_name?: string | null
          tipo_evento?: string
          total_contatos?: number | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_campanhas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_campanhas_conexao_id_fkey"
            columns: ["conexao_id"]
            isOneToOne: false
            referencedRelation: "conexoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_campanhas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "campanhas_contatos"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_cargos: {
        Row: {
          cargo_id: number | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          departamento_id: number | null
          id: string
          ip_address: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          cargo_id?: number | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          departamento_id?: number | null
          id?: string
          ip_address?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          cargo_id?: number | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          departamento_id?: number | null
          id?: string
          ip_address?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_cargos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_cargos_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "cargos_departamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_cargos_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_chat_interno: {
        Row: {
          chat_id: number | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          mensagem_id: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          chat_id?: number | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          mensagem_id?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          chat_id?: number | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          mensagem_id?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_chat_interno_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_coleta: {
        Row: {
          acao: string
          coleta_id: number | null
          created_at: string
          dados_coleta: Json
          id: string
          ip_address: string | null
          user_agent: string | null
          usuario_email: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          acao?: string
          coleta_id?: number | null
          created_at?: string
          dados_coleta?: Json
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          acao?: string
          coleta_id?: number | null
          created_at?: string
          dados_coleta?: Json
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_coleta_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_conexoes: {
        Row: {
          conexao_id: string | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          erro: string | null
          id: string
          ip_address: string | null
          status: string | null
          tipo_conexao: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          conexao_id?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          erro?: string | null
          id?: string
          ip_address?: string | null
          status?: string | null
          tipo_conexao?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          conexao_id?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          erro?: string | null
          id?: string
          ip_address?: string | null
          status?: string | null
          tipo_conexao?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_conexoes_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_configuracoes: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          modulo: string
          tipo_de_acao: string
          user_agent: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          modulo: string
          tipo_de_acao: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          modulo?: string
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_configuracoes_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_contatos: {
        Row: {
          contato_id: string | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          tipo_contato: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          tipo_contato?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          tipo_contato?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_contatos_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_documentos: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          documento_id: string | null
          id: string
          ip_address: string | null
          solicitacao_id: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          documento_id?: string | null
          id?: string
          ip_address?: string | null
          solicitacao_id?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          documento_id?: string | null
          id?: string
          ip_address?: string | null
          solicitacao_id?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_documentos_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_email: {
        Row: {
          assunto: string | null
          conta_email_id: string | null
          created_at: string
          destinatario: string | null
          erro: string | null
          html: string | null
          id: string
          ip_address: string | null
          pasta: string | null
          tipo_de_acao: string
          uid: number | null
          user_agent: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          assunto?: string | null
          conta_email_id?: string | null
          created_at?: string
          destinatario?: string | null
          erro?: string | null
          html?: string | null
          id?: string
          ip_address?: string | null
          pasta?: string | null
          tipo_de_acao: string
          uid?: number | null
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          assunto?: string | null
          conta_email_id?: string | null
          created_at?: string
          destinatario?: string | null
          erro?: string | null
          html?: string | null
          id?: string
          ip_address?: string | null
          pasta?: string | null
          tipo_de_acao?: string
          uid?: number | null
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_email_conta_email_id_fkey"
            columns: ["conta_email_id"]
            isOneToOne: false
            referencedRelation: "email_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_email_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_filas: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          fila_id: string | null
          id: string
          ip_address: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          fila_id?: string | null
          id?: string
          ip_address?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          fila_id?: string | null
          id?: string
          ip_address?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_filas_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_flow_builder: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          flow_id: string | null
          id: string
          ip_address: string | null
          session_id: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          flow_id?: string | null
          id?: string
          ip_address?: string | null
          session_id?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          flow_id?: string | null
          id?: string
          ip_address?: string | null
          session_id?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_flow_builder_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_malotes: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          malote_id: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_responsavel: string | null
          viagem_id: string | null
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          malote_id?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_responsavel?: string | null
          viagem_id?: string | null
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          malote_id?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_responsavel?: string | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_malotes_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_mensagens_rapidas: {
        Row: {
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: number
          mensagem_id: number | null
          timestamp: string | null
          tipo_de_acao: string
          usuario_responsavel: string | null
        }
        Insert: {
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: number
          mensagem_id?: number | null
          timestamp?: string | null
          tipo_de_acao: string
          usuario_responsavel?: string | null
        }
        Update: {
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: number
          mensagem_id?: number | null
          timestamp?: string | null
          tipo_de_acao?: string
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_mensagens_rapidas_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "mensagens_rapidas"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_ocorrencia: {
        Row: {
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ocorrencia_id: string
          tipo_de_acao: string
          usuario_responsavel: number | null
        }
        Insert: {
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ocorrencia_id: string
          tipo_de_acao: string
          usuario_responsavel?: number | null
        }
        Update: {
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ocorrencia_id?: string
          tipo_de_acao?: string
          usuario_responsavel?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_ocorrencia_ocorrencia_id_fkey"
            columns: ["ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "ocorrencias"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_sistema: {
        Row: {
          created_at: string
          dados: Json | null
          id: string
          ip_address: string | null
          mensagem: string
          modulo: string | null
          nivel: string
          stack_trace: string | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          dados?: Json | null
          id?: string
          ip_address?: string | null
          mensagem: string
          modulo?: string | null
          nivel: string
          stack_trace?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          dados?: Json | null
          id?: string
          ip_address?: string | null
          mensagem?: string
          modulo?: string | null
          nivel?: string
          stack_trace?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_sistema_usuario_id_fkey1"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_tabelas_frete: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          id: string
          ip_address: string | null
          tabela_frete_id: string
          user_agent: string | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          tabela_frete_id: string
          user_agent?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          tabela_frete_id?: string
          user_agent?: string | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_tabelas_frete_tabela_frete_id_fkey"
            columns: ["tabela_frete_id"]
            isOneToOne: false
            referencedRelation: "tabelas_frete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_tabelas_frete_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_tags: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          tag_id: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          tag_id?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          tag_id?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_tags_usuario_responsavel_fkey1"
            columns: ["usuario_responsavel"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_usuarios: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_afetado_id: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_afetado_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_afetado_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_usuarios_usuario_afetado_id_fkey1"
            columns: ["usuario_afetado_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_usuarios_usuario_id_fkey1"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_vagas: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          tipo_de_acao: string
          user_agent: string | null
          usuario_id: string | null
          vaga_id: number | null
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          tipo_de_acao: string
          user_agent?: string | null
          usuario_id?: string | null
          vaga_id?: number | null
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          tipo_de_acao?: string
          user_agent?: string | null
          usuario_id?: string | null
          vaga_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_vagas_usuario_id_fkey1"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_whatsapp: {
        Row: {
          acao: string
          chat_id: number | null
          contato_id: string | null
          created_at: string | null
          detalhes: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          acao: string
          chat_id?: number | null
          contato_id?: string | null
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          acao?: string
          chat_id?: number | null
          contato_id?: string | null
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_whatsapp_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_whatsapp_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_whatsapp_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      malote_vale_viagem_itens: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          malote_id: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          malote_id: string
          updated_at?: string | null
          valor?: number
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          malote_id?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "malote_vale_viagem_itens_malote_id_fkey"
            columns: ["malote_id"]
            isOneToOne: false
            referencedRelation: "malotes"
            referencedColumns: ["id"]
          },
        ]
      }
      malote_viagens: {
        Row: {
          adiantamento: number | null
          created_at: string | null
          data: string
          destino: string
          id: string
          malote_id: string | null
          origem: string
          valor_frete: number | null
          valor_motorista: number | null
        }
        Insert: {
          adiantamento?: number | null
          created_at?: string | null
          data: string
          destino: string
          id?: string
          malote_id?: string | null
          origem: string
          valor_frete?: number | null
          valor_motorista?: number | null
        }
        Update: {
          adiantamento?: number | null
          created_at?: string | null
          data?: string
          destino?: string
          id?: string
          malote_id?: string | null
          origem?: string
          valor_frete?: number | null
          valor_motorista?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "malote_viagens_malote_id_fkey"
            columns: ["malote_id"]
            isOneToOne: false
            referencedRelation: "malotes"
            referencedColumns: ["id"]
          },
        ]
      }
      malotes: {
        Row: {
          assinado: boolean | null
          assinatura_data: string | null
          assinatura_imagem: string | null
          assinatura_ip: string | null
          assinatura_user_agent: string | null
          combustivel: number | null
          created_at: string | null
          created_by: string | null
          despesa_motorista: number | null
          extra: number | null
          id: string
          motorista: string
          motorista_id: string | null
          notas: number | null
          numero: number
          pedagio: number | null
          percentual: number
          quant_arla: number | null
          quant_litros: number | null
          saldo_vale: number | null
          soma_despesas: number | null
          telefone_motorista: string | null
          tipo_caminhao_id: string | null
          token_assinatura: string | null
          token_valido_ate: string | null
          total_adiantamento: number | null
          total_faturamento: number | null
          total_motorista: number | null
          updated_at: string | null
          vale_viagem: number
        }
        Insert: {
          assinado?: boolean | null
          assinatura_data?: string | null
          assinatura_imagem?: string | null
          assinatura_ip?: string | null
          assinatura_user_agent?: string | null
          combustivel?: number | null
          created_at?: string | null
          created_by?: string | null
          despesa_motorista?: number | null
          extra?: number | null
          id?: string
          motorista: string
          motorista_id?: string | null
          notas?: number | null
          numero?: number
          pedagio?: number | null
          percentual?: number
          quant_arla?: number | null
          quant_litros?: number | null
          saldo_vale?: number | null
          soma_despesas?: number | null
          telefone_motorista?: string | null
          tipo_caminhao_id?: string | null
          token_assinatura?: string | null
          token_valido_ate?: string | null
          total_adiantamento?: number | null
          total_faturamento?: number | null
          total_motorista?: number | null
          updated_at?: string | null
          vale_viagem?: number
        }
        Update: {
          assinado?: boolean | null
          assinatura_data?: string | null
          assinatura_imagem?: string | null
          assinatura_ip?: string | null
          assinatura_user_agent?: string | null
          combustivel?: number | null
          created_at?: string | null
          created_by?: string | null
          despesa_motorista?: number | null
          extra?: number | null
          id?: string
          motorista?: string
          motorista_id?: string | null
          notas?: number | null
          numero?: number
          pedagio?: number | null
          percentual?: number
          quant_arla?: number | null
          quant_litros?: number | null
          saldo_vale?: number | null
          soma_despesas?: number | null
          telefone_motorista?: string | null
          tipo_caminhao_id?: string | null
          token_assinatura?: string | null
          token_valido_ate?: string | null
          total_adiantamento?: number | null
          total_faturamento?: number | null
          total_motorista?: number | null
          updated_at?: string | null
          vale_viagem?: number
        }
        Relationships: [
          {
            foreignKeyName: "malotes_tipo_caminhao_id_fkey"
            columns: ["tipo_caminhao_id"]
            isOneToOne: false
            referencedRelation: "tipos_caminhao"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_chat_interno: {
        Row: {
          chat_id: string | null
          created_at: string | null
          id: string
          message: string
          sender_id: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          sender_id?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_interno_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats_internos"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_rapidas: {
        Row: {
          comando: string
          conteudo: string
          created_at: string | null
          id: number
          media_name: string | null
          media_path: string | null
          titulo: string
          updated_at: string | null
          usuario_id: string | null
          visibilidade: boolean | null
        }
        Insert: {
          comando: string
          conteudo: string
          created_at?: string | null
          id?: number
          media_name?: string | null
          media_path?: string | null
          titulo: string
          updated_at?: string | null
          usuario_id?: string | null
          visibilidade?: boolean | null
        }
        Update: {
          comando?: string
          conteudo?: string
          created_at?: string | null
          id?: number
          media_name?: string | null
          media_path?: string | null
          titulo?: string
          updated_at?: string | null
          usuario_id?: string | null
          visibilidade?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_rapidas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_whatsapp: {
        Row: {
          chatId: number | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          interactive_id: string | null
          is_deleted: boolean | null
          is_edited: boolean | null
          media_expires_at: string | null
          media_permanent: boolean | null
          message_data: Json | null
          message_id: string | null
          message_text: string | null
          message_type: string | null
          metadata: Json | null
          received_at: string | null
          reply_to_message_id: string | null
          send: string | null
        }
        Insert: {
          chatId?: number | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          interactive_id?: string | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          media_expires_at?: string | null
          media_permanent?: boolean | null
          message_data?: Json | null
          message_id?: string | null
          message_text?: string | null
          message_type?: string | null
          metadata?: Json | null
          received_at?: string | null
          reply_to_message_id?: string | null
          send?: string | null
        }
        Update: {
          chatId?: number | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          interactive_id?: string | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          media_expires_at?: string | null
          media_permanent?: boolean | null
          message_data?: Json | null
          message_id?: string | null
          message_text?: string | null
          message_type?: string | null
          metadata?: Json | null
          received_at?: string | null
          reply_to_message_id?: string | null
          send?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_whatsapp_chatId_fkey"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "chats_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_whatsapp: {
        Row: {
          anexos: string[] | null
          autor_id: string
          chat_id: number
          conteudo: string
          created_at: string | null
          editado: boolean | null
          id: string
          is_importante: boolean | null
          is_privada: boolean | null
          mencoes: string[] | null
          nota_pai_id: string | null
          reacoes: Json | null
          status_tarefa: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          anexos?: string[] | null
          autor_id: string
          chat_id: number
          conteudo: string
          created_at?: string | null
          editado?: boolean | null
          id?: string
          is_importante?: boolean | null
          is_privada?: boolean | null
          mencoes?: string[] | null
          nota_pai_id?: string | null
          reacoes?: Json | null
          status_tarefa?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          anexos?: string[] | null
          autor_id?: string
          chat_id?: number
          conteudo?: string
          created_at?: string | null
          editado?: boolean | null
          id?: string
          is_importante?: boolean | null
          is_privada?: boolean | null
          mencoes?: string[] | null
          nota_pai_id?: string | null
          reacoes?: Json | null
          status_tarefa?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_whatsapp_autor_id_fkey1"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_whatsapp_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_whatsapp_nota_pai_id_fkey"
            columns: ["nota_pai_id"]
            isOneToOne: false
            referencedRelation: "notas_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias: {
        Row: {
          atualizado_em: string | null
          conteudo_mercadoria: string | null
          cpf_cnpj: string | null
          criado_em: string | null
          dano_descricao: string | null
          descricao: string | null
          documento_relacionado: string | null
          email_resposta: string
          endereco_entrega: string | null
          fotos: Json | null
          id: string
          nome_recebedor: string | null
          numero_cte: string | null
          numero_nfe: string | null
          problema_documento: string | null
          responsavel: string | null
          resumo: string | null
          saiu_entrega: string | null
          status: string
          tipo_ocorrencia: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          conteudo_mercadoria?: string | null
          cpf_cnpj?: string | null
          criado_em?: string | null
          dano_descricao?: string | null
          descricao?: string | null
          documento_relacionado?: string | null
          email_resposta: string
          endereco_entrega?: string | null
          fotos?: Json | null
          id?: string
          nome_recebedor?: string | null
          numero_cte?: string | null
          numero_nfe?: string | null
          problema_documento?: string | null
          responsavel?: string | null
          resumo?: string | null
          saiu_entrega?: string | null
          status?: string
          tipo_ocorrencia: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          conteudo_mercadoria?: string | null
          cpf_cnpj?: string | null
          criado_em?: string | null
          dano_descricao?: string | null
          descricao?: string | null
          documento_relacionado?: string | null
          email_resposta?: string
          endereco_entrega?: string | null
          fotos?: Json | null
          id?: string
          nome_recebedor?: string | null
          numero_cte?: string | null
          numero_nfe?: string | null
          problema_documento?: string | null
          responsavel?: string | null
          resumo?: string | null
          saiu_entrega?: string | null
          status?: string
          tipo_ocorrencia?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "contatos_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string | null
          active: boolean | null
          category: string
          created_at: string | null
          critical: boolean | null
          description: string | null
          id: string
          name: string
          resource: string | null
          updated_at: string | null
        }
        Insert: {
          action?: string | null
          active?: boolean | null
          category: string
          created_at?: string | null
          critical?: boolean | null
          description?: string | null
          id: string
          name: string
          resource?: string | null
          updated_at?: string | null
        }
        Update: {
          action?: string | null
          active?: boolean | null
          category?: string
          created_at?: string | null
          critical?: boolean | null
          description?: string | null
          id?: string
          name?: string
          resource?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      secret: {
        Row: {
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      sidebar_preferencias: {
        Row: {
          categorias_expandidas: string[] | null
          created_at: string
          id: string
          scroll_position: number | null
          sidebar_expandido: boolean | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          categorias_expandidas?: string[] | null
          created_at?: string
          id?: string
          scroll_position?: number | null
          sidebar_expandido?: boolean | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          categorias_expandidas?: string[] | null
          created_at?: string
          id?: string
          scroll_position?: number | null
          sidebar_expandido?: boolean | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidebar_preferencias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacao_de_acesso: {
        Row: {
          cargo: string | null
          cnpj: string | null
          email: string
          empresa: string | null
          id: string
          motivo: string | null
          nome: string
          source: string | null
          telefone: string | null
          timestamp: string | null
        }
        Insert: {
          cargo?: string | null
          cnpj?: string | null
          email: string
          empresa?: string | null
          id?: string
          motivo?: string | null
          nome: string
          source?: string | null
          telefone?: string | null
          timestamp?: string | null
        }
        Update: {
          cargo?: string | null
          cnpj?: string | null
          email?: string
          empresa?: string | null
          id?: string
          motivo?: string | null
          nome?: string
          source?: string | null
          telefone?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      solicitacoes_documentos: {
        Row: {
          atualizado_em: string | null
          cpf_cnpj: string | null
          criado_em: string | null
          email_resposta: string
          id: string
          numero_cte: string | null
          numero_nfe: string | null
          origem: string
          status: string
          tipo_documento: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          cpf_cnpj?: string | null
          criado_em?: string | null
          email_resposta: string
          id?: string
          numero_cte?: string | null
          numero_nfe?: string | null
          origem?: string
          status?: string
          tipo_documento: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          cpf_cnpj?: string | null
          criado_em?: string | null
          email_resposta?: string
          id?: string
          numero_cte?: string | null
          numero_nfe?: string | null
          origem?: string
          status?: string
          tipo_documento?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_documentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "contatos_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      tabelas_frete: {
        Row: {
          arquivo_nome: string | null
          arquivo_tamanho: number | null
          arquivo_tipo: string | null
          arquivo_url: string | null
          ativo: boolean
          atualizado_em: string
          atualizado_por: string | null
          cliente_nome: string | null
          cnpj: string | null
          colunas: Json
          criado_em: string
          criado_por: string | null
          dados: Json
          descricao: string | null
          forma_pagamento: string | null
          id: string
          nome: string
          sequencia: string | null
          tabela_config_id: string | null
          telefone: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_tipo?: string | null
          arquivo_url?: string | null
          ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          cliente_nome?: string | null
          cnpj?: string | null
          colunas?: Json
          criado_em?: string
          criado_por?: string | null
          dados?: Json
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          nome: string
          sequencia?: string | null
          tabela_config_id?: string | null
          telefone?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_tipo?: string | null
          arquivo_url?: string | null
          ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          cliente_nome?: string | null
          cnpj?: string | null
          colunas?: Json
          criado_em?: string
          criado_por?: string | null
          dados?: Json
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          nome?: string
          sequencia?: string | null
          tabela_config_id?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tabelas_frete_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabelas_frete_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string | null
          id: number
          kanban: number
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: number
          kanban?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: number
          kanban?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tipos_caminhao: {
        Row: {
          ativo: boolean
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          percentual: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          percentual?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          percentual?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          acesso_area_admin: boolean | null
          acesso_area_cliente: boolean | null
          ativo: boolean | null
          atualizado_em: string | null
          cargo: number | null
          cnpjcpf: Json | null
          data_criacao: string | null
          data_ultima_atividade: string | null
          email: string
          filas: Json | null
          id: string
          nivel_hierarquico: number | null
          nome: string
          som: boolean
          supabase_id: string | null
          tags: Json | null
          telefone: string | null
        }
        Insert: {
          acesso_area_admin?: boolean | null
          acesso_area_cliente?: boolean | null
          ativo?: boolean | null
          atualizado_em?: string | null
          cargo?: number | null
          cnpjcpf?: Json | null
          data_criacao?: string | null
          data_ultima_atividade?: string | null
          email: string
          filas?: Json | null
          id: string
          nivel_hierarquico?: number | null
          nome: string
          som?: boolean
          supabase_id?: string | null
          tags?: Json | null
          telefone?: string | null
        }
        Update: {
          acesso_area_admin?: boolean | null
          acesso_area_cliente?: boolean | null
          ativo?: boolean | null
          atualizado_em?: string | null
          cargo?: number | null
          cnpjcpf?: Json | null
          data_criacao?: string | null
          data_ultima_atividade?: string | null
          email?: string
          filas?: Json | null
          id?: string
          nivel_hierarquico?: number | null
          nome?: string
          som?: boolean
          supabase_id?: string | null
          tags?: Json | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_cargo_fkey"
            columns: ["cargo"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_chat_interno: {
        Row: {
          chat_id: string | null
          created_at: string | null
          id: string
          unreads: number | null
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          unreads?: number | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          unreads?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_chat_interno_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats_internos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_dispositivos: {
        Row: {
          created_at: string | null
          device_id: string | null
          device_name: string | null
          id: string
          ip_address: string | null
          last_used_at: string | null
          refresh_token: string | null
          revoked: boolean | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          last_used_at?: string | null
          refresh_token?: string | null
          revoked?: boolean | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          last_used_at?: string | null
          refresh_token?: string | null
          revoked?: boolean | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_dispositivos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas_emprego: {
        Row: {
          ativo: boolean | null
          cidade: string
          created_at: string | null
          descricao: string
          id: string
          requisitos: string | null
          titulo: string
          updated_at: string | null
          vagas: number | null
        }
        Insert: {
          ativo?: boolean | null
          cidade: string
          created_at?: string | null
          descricao: string
          id?: string
          requisitos?: string | null
          titulo: string
          updated_at?: string | null
          vagas?: number | null
        }
        Update: {
          ativo?: boolean | null
          cidade?: string
          created_at?: string | null
          descricao?: string
          id?: string
          requisitos?: string | null
          titulo?: string
          updated_at?: string | null
          vagas?: number | null
        }
        Relationships: []
      }
      vagas_emprego_candidaturas: {
        Row: {
          cidade: string | null
          created_at: string | null
          curriculo: string | null
          email: string
          id: string
          mensagem: string | null
          nome: string
          telefone: string | null
          vaga_id: string | null
          vaga_titulo: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          curriculo?: string | null
          email: string
          id?: string
          mensagem?: string | null
          nome: string
          telefone?: string | null
          vaga_id?: string | null
          vaga_titulo?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          curriculo?: string | null
          email?: string
          id?: string
          mensagem?: string | null
          nome?: string
          telefone?: string | null
          vaga_id?: string | null
          vaga_titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vagas_emprego_candidaturas_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas_emprego"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_business_hours: {
        Row: {
          absence_message: string | null
          created_at: string | null
          days: Json
          fila_id: number | null
          id: string
          queue_id: string | null
          schedule_type: string
          updated_at: string | null
        }
        Insert: {
          absence_message?: string | null
          created_at?: string | null
          days?: Json
          fila_id?: number | null
          id?: string
          queue_id?: string | null
          schedule_type?: string
          updated_at?: string | null
        }
        Update: {
          absence_message?: string | null
          created_at?: string | null
          days?: Json
          fila_id?: number | null
          id?: string
          queue_id?: string | null
          schedule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_business_hours_fila_id_fkey"
            columns: ["fila_id"]
            isOneToOne: false
            referencedRelation: "filas_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_holidays: {
        Row: {
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          message: string | null
          name: string
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          message?: string | null
          name: string
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          message?: string | null
          name?: string
          start_time?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_hierarchy_level: {
        Args: { target_level: number }
        Returns: boolean
      }
      get_recovery_token_info: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          user_id: string
        }[]
      }
      get_solicitacoes_documentos_pendentes: {
        Args: never
        Returns: {
          cpf_cnpj: string
          criado_em: string
          email_resposta: string
          horas_pendente: number
          id: string
          numero_cte: string
          numero_nfe: string
          origem: string
          prioridade: string
          tipo_documento: string
        }[]
      }
      get_user_hierarchy_level:
        | { Args: never; Returns: number }
        | { Args: { p_user_id: string }; Returns: number }
      get_usuario_id:
        | { Args: never; Returns: string }
        | { Args: { _supabase_id: string }; Returns: string }
      get_usuario_id_by_supabase_id: {
        Args: { supabase_user_id: string }
        Returns: string
      }
      get_whatsapp_pending_chats: {
        Args: { p_admin_id: string }
        Returns: {
          chat_id: number
          contact_id: string
          contact_name: string
          contact_phone: string
          created_at: string
          filas: string
          last_message: string
          last_message_type: string
          message_count: number
          updated_at: string
          waiting_time_minutes: number
        }[]
      }
      get_whatsapp_priority_chats: {
        Args: { p_admin_id: string }
        Returns: {
          admin_id: string
          chat_id: number
          chat_type: string
          contact_id: string
          contact_name: string
          contact_phone: string
          filas: string
          last_client_message_at: string
          last_message: string
          last_message_type: string
          priority_level: string
          priority_order: number
          waiting_minutes: number
        }[]
      }
      get_whatsapp_unread_chats: {
        Args: { p_admin_id: string }
        Returns: {
          chat_id: number
          contact_id: string
          contact_name: string
          contact_phone: string
          filas: string
          last_message: string
          last_message_type: string
          unread_count: number
          updated_at: string
        }[]
      }
      has_admin_access: { Args: never; Returns: boolean }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      increment_chat_interno_unreads: {
        Args: { p_chat_id: string; p_sender_id: string }
        Returns: undefined
      }
      incrementar_tentativa_codigo: {
        Args: { p_telefone: string }
        Returns: undefined
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_admin_user:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      is_chat_owner: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      limpar_codigos_expirados: { Args: never; Returns: undefined }
      log_chat_interno_action: {
        Args: {
          p_chat_id?: number
          p_dados_anteriores?: Json
          p_dados_novos?: Json
          p_mensagem_id?: string
          p_tipo_acao: string
        }
        Returns: string
      }
      registrar_log_campanha: {
        Args: {
          p_acao?: string
          p_campanha_id: string
          p_contato_id?: string
          p_dados_extra?: Json
          p_erro_mensagem?: string
          p_message_id?: string
          p_status_anterior?: string
          p_status_novo?: string
          p_telefone?: string
          p_tipo_evento: string
          p_usuario_id?: string
        }
        Returns: string
      }
      user_has_email_access: { Args: { conta_id: string }; Returns: boolean }
      validar_codigo_recuperacao: {
        Args: { p_codigo_hash: string; p_telefone: string }
        Returns: {
          codigo_id: string
          user_id: string
        }[]
      }
      verificar_rate_limit_codigo: {
        Args: { p_telefone: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      tipo_acao_log:
        | "criar"
        | "editar"
        | "excluir"
        | "visualizar"
        | "login"
        | "logout"
        | "erro"
        | "importar"
        | "exportar"
        | "ativar"
        | "desativar"
        | "conectar"
        | "desconectar"
        | "enviar"
        | "receber"
        | "aprovar"
        | "rejeitar"
      tipo_mensagem: "cliente" | "atendente" | "sistema"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      tipo_acao_log: [
        "criar",
        "editar",
        "excluir",
        "visualizar",
        "login",
        "logout",
        "erro",
        "importar",
        "exportar",
        "ativar",
        "desativar",
        "conectar",
        "desconectar",
        "enviar",
        "receber",
        "aprovar",
        "rejeitar",
      ],
      tipo_mensagem: ["cliente", "atendente", "sistema"],
    },
  },
} as const
