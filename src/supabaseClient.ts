import { createClient } from '@supabase/supabase-js';

// O Vite vai buscar de forma segura os valores salvos no arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicializa e exporta o cliente do banco de dados para ser usado nas telas
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
