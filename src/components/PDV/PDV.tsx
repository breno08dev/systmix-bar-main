import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { comandasService } from '../../services/comandas';
import { produtosService } from '../../services/produtos';
import { clientesService } from '../../services/clientes';
import { Comanda, Produto, Cliente } from '../../types';
import { ComandaModal } from './ComandaModal';
import { AbrirComandaModal } from './AbrirComandaModal';

export const PDV: React.FC = () => {
  const [comandasAbertas, setComandasAbertas] = useState<Comanda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [atualizando, setAtualizando] = useState(false);
  
  const [comandaSelecionada, setComandaSelecionada] = useState<Comanda | null>(null);
  const [numeroParaAbrir, setNumeroParaAbrir] = useState<number | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    if (atualizando) return;
    setAtualizando(true);
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
      console.error('Erro ao recarregar dados:', error);
    } finally {
      setAtualizando(false);
    }
  };

  const handleAbrirOuEditarComanda = (numero: number) => {
    const comandaExistente = comandasAbertas.find(c => c.numero === numero);
    if (comandaExistente) {
      setComandaSelecionada(comandaExistente);
    } else {
      setNumeroParaAbrir(numero);
    }
  };

  const handleConfirmarAbertura = async (numero: number, idCliente?: string) => {
    try {
      const novaComanda = await comandasService.criarComanda(numero, idCliente);
      setNumeroParaAbrir(null);
      await carregarDados();
      
      const comandaRecemCriada = await comandasService.buscarPorNumero(novaComanda.numero);
      if (comandaRecemCriada) {
        setComandaSelecionada(comandaRecemCriada);
      }
    } catch (error) {
      console.error('Erro ao confirmar abertura da comanda:', error);
      alert('Erro ao abrir comanda. Tente novamente.');
    }
  };

  // AGORA SÓ RECARREGA OS DADOS QUANDO O MODAL É FECHADO
  const handleFecharModal = () => {
    setComandaSelecionada(null);
    carregarDados();
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

      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Comandas Abertas</h2>
          {/* CÓDIGO CORRIGIDO PARA O CONTADOR */}
          <div className="text-sm text-gray-500">{comandasAbertas.length} comandas ativas</div>
        </div>
        
        <div className="p-6">
          {comandasAbertas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma comanda aberta</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {comandasAbertas.map(comanda => (
                <div
                  key={comanda.id}
                  onClick={() => handleAbrirOuEditarComanda(comanda.numero)}
                  className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-secondary hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">{comanda.numero}</div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <ShoppingCart size={16} />
                      <span className="text-sm">{comanda.itens?.length || 0}</span>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900 truncate">{comanda.cliente?.nome || 'Cliente não informado'}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    Aberta às {new Date(comanda.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {calcularTotalComanda(comanda).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Abrir Nova Comanda</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-5 md:grid-cols-10 lg:grid-cols-20 gap-2">
            {Array.from({ length: 100 }, (_, i) => i + 1).map(numero => {
              const comandaExistente = comandasAbertas.find(c => c.numero === numero);
              return (
                <button
                  key={numero}
                  onClick={() => handleAbrirOuEditarComanda(numero)}
                  className={`w-12 h-12 rounded-lg font-bold text-sm transition-colors ${
                    comandaExistente ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  title={comandaExistente ? `Comanda ${numero} - Ocupada` : `Abrir comanda ${numero}`}
                >{numero}</button>
              );
            })}
          </div>
        </div>
      </div>

      {numeroParaAbrir && (
        <AbrirComandaModal
          numeroComanda={numeroParaAbrir}
          clientes={clientes}
          onClose={() => setNumeroParaAbrir(null)}
          onComandaAberta={handleConfirmarAbertura}
        />
      )}

      {comandaSelecionada && (
        <ComandaModal
          comandaInicial={comandaSelecionada}
          produtos={produtos}
          onClose={handleFecharModal}
        />
      )}
    </div>
  );
};