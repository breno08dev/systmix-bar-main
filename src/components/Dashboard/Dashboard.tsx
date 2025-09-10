import React, { useState, useEffect } from 'react';
import { Receipt, Package, Users, TrendingUp } from 'lucide-react';
import { comandasService } from '../../services/comandas';
import { produtosService } from '../../services/produtos';
import { clientesService } from '../../services/clientes';
import { Comanda } from '../../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    comandasAbertas: 0,
    totalProdutos: 0,
    totalClientes: 0,
    faturamentoDia: 0
  });
  const [comandasRecentes, setComandasRecentes] = useState<Comanda[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [comandas, produtos, clientes] = await Promise.all([
        comandasService.listarAbertas(),
        produtosService.listar(),
        clientesService.listar()
      ]);

      setStats({
        comandasAbertas: comandas.length,
        totalProdutos: produtos.filter(p => p.ativo).length,
        totalClientes: clientes.length,
        faturamentoDia: 0 // TODO: calcular faturamento do dia
      });

      setComandasRecentes(comandas.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu bar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Comandas Abertas"
          value={stats.comandasAbertas}
          icon={Receipt}
          color="bg-blue-500"
        />
        <StatCard
          title="Produtos Ativos"
          value={stats.totalProdutos}
          icon={Package}
          color="bg-green-500"
        />
        <StatCard
          title="Total Clientes"
          value={stats.totalClientes}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="Faturamento Hoje"
          value={stats.faturamentoDia}
          icon={TrendingUp}
          color="bg-amber-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Comandas Recentes</h2>
        </div>
        <div className="p-6">
          {comandasRecentes.length === 0 ? (
            <p className="text-gray-500 text-center">Nenhuma comanda aberta</p>
          ) : (
            <div className="space-y-4">
              {comandasRecentes.map(comanda => (
                <div key={comanda.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                      {comanda.numero}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {comanda.cliente?.nome || 'Cliente não informado'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Aberta em {new Date(comanda.criado_em).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{comanda.itens?.length || 0} itens</p>
                    <p className="font-bold text-green-600">
                      R$ {comanda.itens?.reduce((total, item) => 
                        total + (item.quantidade * item.valor_unit), 0
                      ).toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};