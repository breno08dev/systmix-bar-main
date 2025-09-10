import React, { useState } from 'react';
import { Calendar, Download, TrendingUp, Receipt, Star, DollarSign } from 'lucide-react';
import { relatoriosService } from '../../services/relatorios';
import { RelatorioVendas } from '../../types';

export const Relatorios: React.FC = () => {
  const [dataInicio, setDataInicio] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dataFim, setDataFim] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [relatorio, setRelatorio] = useState<RelatorioVendas | null>(null);
  const [carregando, setCarregando] = useState(false);

  const gerarRelatorio = async () => {
    setCarregando(true);
    try {
      const data = await relatoriosService.obterVendasPorPeriodo(
        `${dataInicio}T00:00:00`,
        `${dataFim}T23:59:59`
      );
      setRelatorio(data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setCarregando(false);
    }
  };

  const exportarCSV = async () => {
    try {
      const csv = await relatoriosService.exportarVendasCSV(
        `${dataInicio}T00:00:00`,
        `${dataFim}T23:59:59`
      );
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vendas_${dataInicio}_${dataFim}.csv`;
      link.click();
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios</h1>
        <p className="text-gray-600">Análise de vendas e performance</p>
      </div>

      {/* Filtros de Data */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500" />
            <span className="font-medium text-gray-700">Período</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={gerarRelatorio}
              disabled={carregando}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {carregando ? 'Gerando...' : 'Gerar Relatório'}
            </button>

            {relatorio && (
              <button
                onClick={exportarCSV}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Download size={16} />
                Exportar CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Relatório */}
      {relatorio && (
        <div className="space-y-8">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total de Vendas"
              value={`R$ ${relatorio.total_vendas.toFixed(2)}`}
              icon={DollarSign}
              color="bg-green-500"
            />
            <StatCard
              title="Total de Comandas"
              value={relatorio.total_comandas}
              icon={Receipt}
              color="bg-blue-500"
            />
            <StatCard
              title="Ticket Médio"
              value={`R$ ${relatorio.ticket_medio.toFixed(2)}`}
              icon={TrendingUp}
              color="bg-purple-500"
            />
            <StatCard
              title="Item Mais Vendido"
              value={relatorio.item_mais_vendido}
              icon={Star}
              color="bg-amber-500"
            />
          </div>

          {/* Resumo do Período */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Resumo do Período
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Performance</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Período analisado: {new Date(dataInicio).toLocaleDateString('pt-BR')} até {new Date(dataFim).toLocaleDateString('pt-BR')}</li>
                  <li>• Total arrecadado: R$ {relatorio.total_vendas.toFixed(2)}</li>
                  <li>• Comandas fechadas: {relatorio.total_comandas}</li>
                  <li>• Valor médio por comanda: R$ {relatorio.ticket_medio.toFixed(2)}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Destaques</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Item mais vendido: {relatorio.item_mais_vendido}</li>
                  <li>• Média de itens por comanda: {relatorio.total_comandas > 0 ? 'Calculando...' : '0'}</li>
                  <li>• Status geral: {relatorio.total_vendas > 0 ? 'Ativo' : 'Sem vendas'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {!relatorio && !carregando && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Gerar Relatório
          </h3>
          <p className="text-gray-500">
            Selecione o período desejado e clique em "Gerar Relatório" para visualizar as estatísticas de vendas.
          </p>
        </div>
      )}
    </div>
  );
};