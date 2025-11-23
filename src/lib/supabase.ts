import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL e Anon Key devem ser configurados no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      movements: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          type: 'entrada' | 'saida';
          category: string;
          date: string;
          payment_method: string;
          bank: string;
          notes: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['movements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['movements']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          status: 'pending' | 'completed' | 'overdue';
          type: 'receive' | 'pay';
          due_date: string;
          completion_date: string | null;
          category: string;
          export_type: 'contabil' | 'boleto' | 'nenhum';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      debt_interests: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string;
          daily_interest_rate: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['debt_interests']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['debt_interests']['Insert']>;
      };
      debt_fines: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string;
          fine_percentage: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['debt_fines']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['debt_fines']['Insert']>;
      };
    };
  };
};
