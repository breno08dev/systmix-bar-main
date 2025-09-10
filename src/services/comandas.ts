import { supabase } from '../lib/supabase';
import { Comanda, ItemComanda, Pagamento } from '../types';

export const comandasService = {
  async listarAbertas(): Promise<Comanda[]> {
    const { data, error } = await supabase
      .from('comandas')
      .select(`
        *,
        cliente:clientes(*),
        itens:itens_comanda(
          *,
          produto:produtos(*)
        )
      `)
      .eq('status', 'aberta')
      .order('numero');
    
    if (error) throw error;
    return data || [];
  },

  async buscarPorNumero(numero: number): Promise<Comanda | null> {
    const { data, error } = await supabase
      .from('comandas')
      .select(`
        *,
        cliente:clientes(*),
        itens:itens_comanda(
          *,
          produto:produtos(*)
        ),
        pagamentos(*)
      `)
      .eq('numero', numero)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async criarComanda(numero: number, idCliente?: string): Promise<Comanda> {
    const { data, error } = await supabase
      .from('comandas')
      .insert({
        numero,
        id_cliente: idCliente,
        status: 'aberta'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async adicionarItem(item: Omit<ItemComanda, 'id' | 'criado_em'>): Promise<ItemComanda> {
    const { data, error } = await supabase
      .from('itens_comanda')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async atualizarQuantidadeItem(id: string, quantidade: number): Promise<void> {
    const { error } = await supabase
      .from('itens_comanda')
      .update({ quantidade })
      .eq('id', id);
    
    if (error) throw error;
  },

  async removerItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('itens_comanda')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async fecharComanda(idComanda: string, pagamentos: Omit<Pagamento, 'id' | 'data'>[]): Promise<void> {
    // Atualizar status da comanda
    const { error: updateError } = await supabase
      .from('comandas')
      .update({
        status: 'fechada',
        fechado_em: new Date().toISOString()
      })
      .eq('id', idComanda);
    
    if (updateError) throw updateError;

    // Inserir pagamentos
    if (pagamentos.length > 0) {
      const { error: paymentError } = await supabase
        .from('pagamentos')
        .insert(pagamentos);
      
      if (paymentError) throw paymentError;
    }
  }
};