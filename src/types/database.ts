export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRole = 'superadmin' | 'brand_admin' | 'advisor'
export type TicketStatus = 'waiting' | 'in_progress' | 'done' | 'cancelled'
export type FieldType = 'text' | 'number' | 'select' | 'date' | 'textarea'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          brand_id: string | null
          establishment_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['brands']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['brands']['Insert']>
      }
      establishments: {
        Row: {
          id: string
          brand_id: string
          name: string
          slug: string
          address: string | null
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['establishments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['establishments']['Insert']>
      }
      visit_reasons: {
        Row: {
          id: string
          brand_id: string
          name: string
          description: string | null
          sort_order: number
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['visit_reasons']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['visit_reasons']['Insert']>
      }
      promotions: {
        Row: {
          id: string
          establishment_id: string
          title: string
          description: string | null
          image_url: string | null
          active: boolean
          starts_at: string | null
          ends_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['promotions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['promotions']['Insert']>
      }
      advisor_fields: {
        Row: {
          id: string
          establishment_id: string
          label: string
          field_type: FieldType
          options: Json | null
          required: boolean
          sort_order: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          label: string
          field_type?: string
          options?: Json | null
          required?: boolean
          sort_order?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          establishment_id?: string
          label?: string
          field_type?: string
          options?: Json | null
          required?: boolean
          sort_order?: number
          active?: boolean
        }
      }
      tickets: {
        Row: {
          id: string
          establishment_id: string
          visit_reason_id: string | null
          queue_number: string
          customer_name: string
          customer_phone: string | null
          customer_email: string | null
          marketing_opt_in: boolean
          push_subscription: Json | null
          status: TicketStatus
          advisor_id: string | null
          created_at: string
          attended_at: string | null
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>
      }
      attentions: {
        Row: {
          id: string
          ticket_id: string
          advisor_id: string
          establishment_id: string
          fields_data: Json
          notes: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['attentions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['attentions']['Insert']>
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Brand = Database['public']['Tables']['brands']['Row']
export type Establishment = Database['public']['Tables']['establishments']['Row']
export type VisitReason = Database['public']['Tables']['visit_reasons']['Row']
export type Promotion = Database['public']['Tables']['promotions']['Row']
export type AdvisorField = Database['public']['Tables']['advisor_fields']['Row']
export type Ticket = Database['public']['Tables']['tickets']['Row']
export type Attention = Database['public']['Tables']['attentions']['Row']

export type TicketWithRelations = Ticket & {
  visit_reasons: VisitReason | null
  profiles: Profile | null
}
