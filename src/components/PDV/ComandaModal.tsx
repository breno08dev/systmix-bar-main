import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, CreditCard, Banknote } from 'lucide-react';
import { comandasService } from '../../services/comandas';
import { clientesService } from '../../services/clientes';
import { Comanda, Produto, Cliente, ItemComanda } from '../../types';

interface ComandaModalProps {
  comanda: Comanda;
  produtos: Produto[];
  clientes: Cliente[];
  onClose: () => void;
  onComandaAtualizada: () => void;
}

export const ComandaModal: React.FC<ComandaModalProps> = ({
  comanda,
  produtos,
  clientes,
  onClose,
  onComandaAtualizada
}) => {
  const [comandaAtual, setComandaAtual] = useState<Comanda>(comanda);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('');
  const [nomeCliente, setNomeCliente] = useState(comanda.cliente?.nome || '');
  const [telefoneCliente, setTelefoneCliente] = useState(comanda.cliente?.telefone || '');
  const [mostrarPagamento, setMostrarPagamento] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState('dinheiro');
  const [valorPagamento, setValorPagamento] = useState('');

  const calcularTotal = () => {
    return comandaAtual.itens?.reduce((total, item) => 
      total + (item.quantidade * item.valor_unit), 0
    ) || 0;
  };

  const adicionarProduto = async () => {
    if (!produtoSelecionado) return;

    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) return;

    try {
      // Verificar se o item já existe na comanda
      const itemExistente = comandaAtual.itens?.find(item => item.id_produto === produto.id);
      
      if (itemExistente) {
        // Atualizar quantidade
        await comandasService.atualizarQuantidadeItem(
          itemExistente.id, 
          itemExistente.quantidade + 1
        );
      } else {
        // Adicionar novo item
        await comandasService.adicionarItem({
          id_comanda: comandaAtual.id,
          id_produto: produto.id,
          quantidade: 1,
          valor_unit: produto.preco
        });
      }

      // Recarregar comanda
      const comandaAtualizada = await comandasService.buscarPorNumero(comandaAtual.numero);
      if (comandaAtualizada) {
        setComandaAtual(comandaAtualizada);
      }
      
      setProdutoSelecionado('');
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
    }
  };

  const alterarQuantidade = async (itemId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      await removerItem(itemId);
      return;
    }

    try {
      await comandasService.atualizarQuantidadeItem(itemId, novaQuantidade);
      
      const comandaAtualizada = await comandasService.buscarPorNumero(comandaAtual.numero);
      if (comandaAtualizada) {
        setComandaAtual(comandaAtualizada);
      }
    } catch (error) {
      console.error('Erro ao alterar quantidade:', error);
    }
  };

  const removerItem = async (itemId: string) => {
    try {
      await comandasService.removerItem(itemId);
      
      const comandaAtualizada = await comandasService.buscarPorNumero(comandaAtual.numero);
      if (comandaAtualizada) {
        setComandaAtual(comandaAtualizada);
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  const salvarCliente = async () => {
    if (!nomeCliente && !telefoneCliente) return;

    try {
      let cliente = comandaAtual.cliente;
      
      if (!cliente && (nomeCliente || telefoneCliente)) {
        // Buscar cliente existente por telefone ou criar novo
        if (telefoneCliente) {
          cliente = await clientesService.buscarPorTelefone(telefoneCliente);
        }
        
        if (!cliente) {
          cliente = await clientesService.criar({
            nome: nomeCliente,
            telefone: telefoneCliente
          });
        }
      }
      
      // TODO: Atualizar comanda com cliente
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const fecharComanda = async () => {
    const total = calcularTotal();
    const valor = parseFloat(valorPagamento) || total;
    
    try {
      await comandasService.fecharComanda(comandaAtual.id, [{
        id_comanda: comandaAtual.id,
        metodo: metodoPagamento,
        valor
      }]);
      
      onComandaAtualizada();
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
    }
  };

  const categoriasProdutos = produtos.reduce((acc, produto) => {
    if (!acc[produto.categoria]) {
      acc[produto.categoria] = [];
    }
    acc[produto.categoria].push(produto);
    return acc;
  }, {} as Record<string, Produto[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Comanda {comandaAtual.numero}
            </h2>
            <p className="text-gray-600">
              Aberta em {new Date(comandaAtual.criado_em).toLocaleString('pt-BR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lado Esquerdo - Produtos */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Adicionar Produtos</h3>
            
            {/* Cliente */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Cliente</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  onBlur={salvarCliente}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={telefoneCliente}
                  onChange={(e) => setTelefoneCliente(e.target.value)}
                  onBlur={salvarCliente}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Adicionar Produto */}
            <div className="flex gap-2 mb-6">
              <select
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">Selecionar produto...</option>
                {Object.entries(categoriasProdutos).map(([categoria, produtosCategoria]) => (
                  <optgroup key={categoria} label={categoria}>
                    {produtosCategoria.map(produto => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} - R$ {produto.preco.toFixed(2)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                onClick={adicionarProduto}
                disabled={!produtoSelecionado}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Lado Direito - Itens da Comanda */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Itens da Comanda</h3>
              <div className="text-2xl font-bold text-green-600">
                R$ {calcularTotal().toFixed(2)}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {comandaAtual.itens?.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.produto?.nome}</p>
                    <p className="text-sm text-gray-500">R$ {item.valor_unit.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Minus size={16} />
                    </button>
                    
                    <span className="w-8 text-center font-medium">{item.quantidade}</span>
                    
                    <button
                      onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Plus size={16} />
                    </button>
                    
                    <button
                      onClick={() => removerItem(item.id)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="w-20 text-right font-medium">
                      R$ {(item.quantidade * item.valor_unit).toFixed(2)}
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-8">Nenhum item adicionado</p>
              )}
            </div>

            {/* Pagamento */}
            {(comandaAtual.itens?.length || 0) > 0 && (
              <div className="border-t border-gray-200 pt-6">
                {!mostrarPagamento ? (
                  <button
                    onClick={() => setMostrarPagamento(true)}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Fechar Comanda - R$ {calcularTotal().toFixed(2)}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Finalizar Pagamento</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setMetodoPagamento('dinheiro')}
                        className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                          metodoPagamento === 'dinheiro'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <Banknote size={20} />
                        Dinheiro
                      </button>
                      
                      <button
                        onClick={() => setMetodoPagamento('cartao')}
                        className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                          metodoPagamento === 'cartao'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <CreditCard size={20} />
                        Cartão
                      </button>
                    </div>
                    
                    <input
                      type="number"
                      placeholder={`Valor (R$ ${calcularTotal().toFixed(2)})`}
                      value={valorPagamento}
                      onChange={(e) => setValorPagamento(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setMostrarPagamento(false)}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={fecharComanda}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Confirmar Pagamento
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};