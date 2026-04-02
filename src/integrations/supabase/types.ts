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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      fornecedores: {
        Row: {
          cnpj: string | null
          contato: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      indicadores_semanais: {
        Row: {
          ano: number
          captacoes: number
          created_at: string
          data: string
          id: string
          mes: string
          orcamentos: number
          semana: number
          updated_at: string
          user_id: string
          vendedor: string
          visitas: number
        }
        Insert: {
          ano: number
          captacoes?: number
          created_at?: string
          data: string
          id?: string
          mes: string
          orcamentos?: number
          semana: number
          updated_at?: string
          user_id: string
          vendedor: string
          visitas?: number
        }
        Update: {
          ano?: number
          captacoes?: number
          created_at?: string
          data?: string
          id?: string
          mes?: string
          orcamentos?: number
          semana?: number
          updated_at?: string
          user_id?: string
          vendedor?: string
          visitas?: number
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_lancamento"]
          cliente: string
          created_at: string
          data: string
          id: string
          item: string | null
          produto: string | null
          servico: string | null
          updated_at: string
          user_id: string
          valor: number
          vendedor: string | null
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_lancamento"]
          cliente: string
          created_at?: string
          data: string
          id?: string
          item?: string | null
          produto?: string | null
          servico?: string | null
          updated_at?: string
          user_id: string
          valor: number
          vendedor?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_lancamento"]
          cliente?: string
          created_at?: string
          data?: string
          id?: string
          item?: string | null
          produto?: string | null
          servico?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
          vendedor?: string | null
        }
        Relationships: []
      }
      metas_historicas: {
        Row: {
          ano: number
          created_at: string
          id: string
          mes: number
          meta_acessorio: number
          meta_captacoes: number
          meta_contrato: number
          meta_orcamentos: number
          meta_produto: number
          meta_servico: number
          meta_visitas: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          mes: number
          meta_acessorio?: number
          meta_captacoes?: number
          meta_contrato?: number
          meta_orcamentos?: number
          meta_produto?: number
          meta_servico?: number
          meta_visitas?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          mes?: number
          meta_acessorio?: number
          meta_captacoes?: number
          meta_contrato?: number
          meta_orcamentos?: number
          meta_produto?: number
          meta_servico?: number
          meta_visitas?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          cliente: string | null
          created_at: string
          documento_ref: string | null
          id: string
          motivo: string | null
          observacao: string | null
          produto_id: string
          quantidade: number
          tipo: string
          user_id: string
          vendedor_id: string | null
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          documento_ref?: string | null
          id?: string
          motivo?: string | null
          observacao?: string | null
          produto_id: string
          quantidade: number
          tipo: string
          user_id: string
          vendedor_id?: string | null
        }
        Update: {
          cliente?: string | null
          created_at?: string
          documento_ref?: string | null
          id?: string
          motivo?: string | null
          observacao?: string | null
          produto_id?: string
          quantidade?: number
          tipo?: string
          user_id?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_contato: {
        Row: {
          created_at: string
          id: string
          pos_venda_id: string
          texto: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pos_venda_id: string
          texto: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pos_venda_id?: string
          texto?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_contato_pos_venda_id_fkey"
            columns: ["pos_venda_id"]
            isOneToOne: false
            referencedRelation: "pos_venda"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_venda: {
        Row: {
          cliente: string
          created_at: string
          data: string
          id: string
          status: Database["public"]["Enums"]["status_pos_venda"]
          status_changed_at: string | null
          updated_at: string
          user_id: string
          vendedor: string
        }
        Insert: {
          cliente: string
          created_at?: string
          data: string
          id?: string
          status?: Database["public"]["Enums"]["status_pos_venda"]
          status_changed_at?: string | null
          updated_at?: string
          user_id: string
          vendedor: string
        }
        Update: {
          cliente?: string
          created_at?: string
          data?: string
          id?: string
          status?: Database["public"]["Enums"]["status_pos_venda"]
          status_changed_at?: string | null
          updated_at?: string
          user_id?: string
          vendedor?: string
        }
        Relationships: []
      }
      produtos_estoque: {
        Row: {
          ativo: boolean
          categoria: string | null
          codigo_barras: string | null
          created_at: string
          estoque_atual: number
          estoque_minimo: number
          fornecedor_id: string | null
          id: string
          nome: string
          numero_serie: string | null
          preco_custo: number | null
          preco_venda: number | null
          unidade: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string
          estoque_atual?: number
          estoque_minimo?: number
          fornecedor_id?: string | null
          id?: string
          nome: string
          numero_serie?: string | null
          preco_custo?: number | null
          preco_venda?: number | null
          unidade?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string
          estoque_atual?: number
          estoque_minimo?: number
          fornecedor_id?: string | null
          id?: string
          nome?: string
          numero_serie?: string | null
          preco_custo?: number | null
          preco_venda?: number | null
          unidade?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_estoque_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendedores: {
        Row: {
          created_at: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_lancamento: "produto" | "servico" | "contrato" | "acessorio"
      status_pos_venda: "Aguardando retorno" | "Contatado" | "Convertido"
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
      categoria_lancamento: ["produto", "servico", "contrato", "acessorio"],
      status_pos_venda: ["Aguardando retorno", "Contatado", "Convertido"],
    },
  },
} as const
