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
  },

  // NOVA FUNÇÃO
  async deletar(id: string): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);
    
    if (error) {
      // Adiciona um log de erro mais detalhado
      console.error("Erro no Supabase ao deletar cliente:", error.message);
      // Informa ao usuário sobre o problema de chave estrangeira
      if (error.code === '23503') { // Código de erro para violação de chave estrangeira no PostgreSQL
        throw new Error('Não é possível excluir este cliente, pois ele está associado a uma ou mais comandas.');
      }
      throw error;
    }
  }
};