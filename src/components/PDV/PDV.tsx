import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart } from 'lucide-react';
import { comandasService } from '../../services/comandas';
import { produtosService } from '../../services/produtos';
import { clientesService } from '../../services/clientes';
import { Comanda, Produto, Cliente } from '../../types';
import { ComandaModal } from './ComandaModal';

export const PDV: React.FC = () => {
  const [comandasAbertas, setComandasAbertas] = useState<Comanda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [comandaSelecionada, setComandaSelecionada] = useState<Comanda | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [comandasData, produtosData, clientesData] = await Promise.all([
        comandasService.listarAbertas(),
        produtosService.listarAtivos(),
        clientesService.listar()
      ]);
      
      setComandasAbertas(comandasData);
      setProdutos(produtosData);
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const abrirComanda = async (numero: number) => {
    try {
      // Verificar se a comanda já existe
      const comandaExistente = await comandasService.buscarPorNumero(numero);
      
      if (comandaExistente) {
        setComandaSelecionada(comandaExistente);
      } else {
        // Criar nova comanda
        const novaComanda = await comandasService.criarComanda(numero);
        const comandaCompleta = await comandasService.buscarPorNumero(numero);
        setComandaSelecionada(comandaCompleta);
      }
      
      setModalAberto(true);
    } catch (error) {
      console.error('Erro ao abrir comanda:', error);
    }
  };

  const handleComandaAtualizada = () => {
    carregarDados();
    setModalAberto(false);
    setComandaSelecionada(null);
  };

  const calcularTotalComanda = (comanda: Comanda) => {
    return comanda.itens?.reduce((total, item) => 
      total + (item.quantidade * item.valor_unit), 0
    ) || 0;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDV - Ponto de Venda</h1>
        <p className="text-gray-600">Gerencie comandas e vendas</p>
      </div>

      {/* Comandas Abertas */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Comandas Abertas</h2>
            <div className="text-sm text-gray-500">
              {comandasAbertas.length} comandas ativas
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {comandasAbertas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma comanda aberta</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {comandasAbertas.map(comanda => (
                <div
                  key={comanda.id}
                  onClick={() => {
                    setComandaSelecionada(comanda);
                    setModalAberto(true);
                  }}
                  className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {comanda.numero}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <ShoppingCart size={16} />
                      <span className="text-sm">{comanda.itens?.length || 0}</span>
                    </div>
                  </div>
                  
                  <p className="font-medium text-gray-900 truncate">
                    {comanda.cliente?.nome || 'Cliente não informado'}
                  </p>
                  
                  <p className="text-sm text-gray-500 mb-2">
                    Aberta às {new Date(comanda.criado_em).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  
                  <p className="text-lg font-bold text-green-600">
                    R$ {calcularTotalComanda(comanda).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Abrir Nova Comanda */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Abrir Nova Comanda</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-5 md:grid-cols-10 lg:grid-cols-20 gap-2">
            {Array.from({ length: 100 }, (_, i) => i + 1).map(numero => {
              const comandaExistente = comandasAbertas.find(c => c.numero === numero);
              const isOcupada = !!comandaExistente;
              
              return (
                <button
                  key={numero}
                  onClick={() => abrirComanda(numero)}
                  className={`w-12 h-12 rounded-lg font-bold text-sm transition-colors ${
                    isOcupada
                      ? 'bg-red-500 text-white cursor-pointer hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  title={isOcupada ? `Comanda ${numero} - Ocupada` : `Abrir comanda ${numero}`}
                >
                  {numero}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal da Comanda */}
      {modalAberto && comandaSelecionada && (
        <ComandaModal
          comanda={comandaSelecionada}
          produtos={produtos}
          clientes={clientes}
          onClose={() => {
            setModalAberto(false);
            setComandaSelecionada(null);
          }}
          onComandaAtualizada={handleComandaAtualizada}
        />
      )}
    </div>
  );
};