import { supabase } from '../lib/supabase';
import { RelatorioVendas } from '../types';

export const relatoriosService = {
  async obterVendasPorPeriodo(dataInicio: string, dataFim: string): Promise<RelatorioVendas> {
    // Total de vendas
    const { data: vendas, error: vendasError } = await supabase
      .from('pagamentos')
      .select('valor')
      .gte('data', dataInicio)
      .lte('data', dataFim);
    
    if (vendasError) throw vendasError;

    // Total de comandas
    const { data: comandas, error: comandasError } = await supabase
      .from('comandas')
      .select('id')
      .eq('status', 'fechada')
      .gte('fechado_em', dataInicio)
      .lte('fechado_em', dataFim);
    
    if (comandasError) throw comandasError;

    // Item mais vendido
    const { data: itens, error: itensError } = await supabase
      .from('itens_comanda')
      .select(`
        quantidade,
        produto:produtos(nome),
        comanda:comandas!inner(fechado_em)
      `)
      .gte('comanda.fechado_em', dataInicio)
      .lte('comanda.fechado_em', dataFim);
    
    if (itensError) throw itensError;

    const totalVendas = vendas?.reduce((sum, venda) => sum + venda.valor, 0) || 0;
    const totalComandas = comandas?.length || 0;
    const ticketMedio = totalComandas > 0 ? totalVendas / totalComandas : 0;

    // Calcular item mais vendido
    const itemCount: Record<string, number> = {};
    itens?.forEach(item => {
      const nome = item.produto?.nome || 'Desconhecido';
      itemCount[nome] = (itemCount[nome] || 0) + item.quantidade;
    });

    const itemMaisVendido = Object.entries(itemCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Nenhum';

    return {
      total_vendas: totalVendas,
      total_comandas: totalComandas,
      item_mais_vendido: itemMaisVendido,
      ticket_medio: ticketMedio
    };
  },

  async exportarVendasCSV(dataInicio: string, dataFim: string): Promise<string> {
    const { data, error } = await supabase
      .from('comandas')
      .select(`
        numero,
        criado_em,
        fechado_em,
        cliente:clientes(nome, telefone),
        itens:itens_comanda(
          quantidade,
          valor_unit,
          produto:produtos(nome, categoria)
        ),
        pagamentos(metodo, valor)
      `)
      .eq('status', 'fechada')
      .gte('fechado_em', dataInicio)
      .lte('fechado_em', dataFim);
    
    if (error) throw error;

    let csv = 'Comanda,Cliente,Telefone,Item,Categoria,Quantidade,Valor Unit,Total Item,Metodo Pgto,Valor Pgto,Data Fechamento\n';
    
    data?.forEach(comanda => {
      comanda.itens?.forEach(item => {
        comanda.pagamentos?.forEach(pagamento => {
          csv += `${comanda.numero},`;
          csv += `"${comanda.cliente?.nome || 'Sem nome'}",`;
          csv += `"${comanda.cliente?.telefone || ''}",`;
          csv += `"${item.produto?.nome || ''}",`;
          csv += `"${item.produto?.categoria || ''}",`;
          csv += `${item.quantidade},`;
          csv += `${item.valor_unit.toFixed(2)},`;
          csv += `${(item.quantidade * item.valor_unit).toFixed(2)},`;
          csv += `"${pagamento.metodo}",`;
          csv += `${pagamento.valor.toFixed(2)},`;
          csv += `"${new Date(comanda.fechado_em!).toLocaleDateString('pt-BR')}"\n`;
        });
      });
    });
    
    return csv;
  }
};