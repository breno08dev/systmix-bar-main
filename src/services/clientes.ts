import { supabase } from '../lib/supabase';
import { Cliente } from '../types';

export const clientesService = {
  async listar(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data || [];
  },

  async buscarPorTelefone(telefone: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefone', telefone)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async criar(cliente: Omit<Cliente, 'id' | 'criado_em'>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .insert(cliente)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async atualizar(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};