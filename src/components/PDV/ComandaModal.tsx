import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { comandasService } from '../../services/comandas';
import { Comanda, Produto } from '../../types';
import { Comprovante } from './Comprovante';
import { useToast } from '../../contexts/ToastContext';

interface ComandaModalProps {
  comandaInicial: Comanda;
  produtos: Produto[];
  onClose: () => void;
  // A prop 'onComandaAtualizada' foi removida para evitar o bug
}

export const ComandaModal: React.FC<ComandaModalProps> = ({
  comandaInicial,
  produtos,
  onClose,
}) => {
  const [comandaAtual, setComandaAtual] = useState<Comanda>(comandaInicial);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('');
  const [mostrarPagamento, setMostrarPagamento] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState('dinheiro');
  const [valorPagamento, setValorPagamento] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  const comprovanteRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setComandaAtual(comandaInicial);
  }, [comandaInicial]);

  const totalComanda = React.useMemo(() => {
    return comandaAtual.itens?.reduce((total, item) => total + item.quantidade * item.valor_unit, 0) || 0;
  }, [comandaAtual.itens]);

const handlePrint = useReactToPrint({
    contentRef: comprovanteRef,
  });

  const adicionarProduto = async () => {
    if (!produtoSelecionado || carregando) return;
    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) return;

    const itemExistente = comandaAtual.itens?.find(item => item.id_produto === produto.id);
    if (itemExistente) {
      await alterarQuantidade(itemExistente.id, itemExistente.quantidade + 1);
    } else {
      setCarregando(true);
      try {
        const novoItem = await comandasService.adicionarItem({
          id_comanda: comandaAtual.id,
          id_produto: produto.id,
          quantidade: 1,
          valor_unit: produto.preco,
        });
        // Atualiza o estado local com os dados do banco
        const comandaDoBanco = await comandasService.buscarPorNumero(comandaAtual.numero);
        if (comandaDoBanco) setComandaAtual(comandaDoBanco);
        
        setProdutoSelecionado('');
      } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        addToast('Erro ao adicionar produto.', 'error');
      } finally {
        setCarregando(false);
      }
    }
  };

  const alterarQuantidade = async (itemId: string, novaQuantidade: number) => {
    if (novaQuantidade < 1) return removerItem(itemId);

    let comandaOriginal: Comanda | null = null;

    setComandaAtual(currentState => {
      comandaOriginal = currentState;
      const novosItens = currentState.itens?.map(item =>
        item.id === itemId ? { ...item, quantidade: novaQuantidade } : item
      );
      return { ...currentState, itens: novosItens };
    });

    try {
      await comandasService.atualizarQuantidadeItem(itemId, novaQuantidade);
    } catch (error) {
      console.error('Erro ao alterar quantidade:', error);
      addToast('Erro ao atualizar. Desfazendo alteração.', 'error');
      if (comandaOriginal) setComandaAtual(comandaOriginal);
    }
  };

  const removerItem = async (itemId: string) => {
    let comandaOriginal: Comanda | null = null;

    setComandaAtual(currentState => {
      comandaOriginal = currentState;
      const novosItens = currentState.itens?.filter(item => item.id !== itemId);
      return { ...currentState, itens: novosItens };
    });

    try {
      await comandasService.removerItem(itemId);
    } catch (error) {
      console.error('Erro ao remover item:', error);
      addToast('Erro ao remover. Desfazendo alteração.', 'error');
      if (comandaOriginal) setComandaAtual(comandaOriginal);
    }
  };
  
  const fecharComanda = async () => {
    if (totalComanda <= 0) {
      addToast('Não é possível fechar uma comanda sem itens.', 'error');
      return;
    }
    const valorPago = parseFloat(valorPagamento) || totalComanda;
    if (metodoPagamento === 'dinheiro' && valorPago < totalComanda) {
      addToast('O valor pago não pode ser menor que o total da comanda.', 'error');
      return;
    }
    setCarregando(true);
    try {
      await comandasService.fecharComanda(comandaAtual.id, [{
        id_comanda: comandaAtual.id,
        metodo: metodoPagamento,
        valor: totalComanda,
      }]);
      addToast('Comanda fechada com sucesso!', 'success');
      onClose(); // Apenas fecha o modal. O PDV vai recarregar a lista.
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
      addToast('Não foi possível fechar a comanda.', 'error');
    } finally {
      setCarregando(false);
    }
  };

  const valorPagoFloat = parseFloat(valorPagamento) || 0;
  const troco = valorPagoFloat > totalComanda ? valorPagoFloat - totalComanda : 0;

  useEffect(() => {
    if (mostrarPagamento && !valorPagamento) {
      setValorPagamento(totalComanda.toFixed(2));
    }
  }, [mostrarPagamento, totalComanda, valorPagamento]);

  return (
    <>
      <div style={{ display: 'none' }}>
        <Comprovante ref={comprovanteRef} comanda={comandaAtual} />
      </div>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* O restante do JSX do modal permanece o mesmo */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Comanda {comandaAtual.numero}</h2>
              <p className="text-gray-600">{comandaAtual.cliente?.nome || 'Cliente não informado'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Imprimir Comprovante" disabled={totalComanda <= 0}>
                <Printer size={20} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto flex-1">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Adicionar Produtos</h3>
              <div className="flex gap-2 mb-6">
                <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary" disabled={carregando}>
                  <option value="">Selecione um produto...</option>
                  {Object.entries(produtos.reduce((acc, produto) => {
                    if (!acc[produto.categoria]) acc[produto.categoria] = [];
                    acc[produto.categoria].push(produto);
                    return acc;
                  }, {} as Record<string, Produto[]>)).map(([categoria, produtosCategoria]) => (
                    <optgroup key={categoria} label={categoria}>
                      {produtosCategoria.map(produto => (
                        <option key={produto.id} value={produto.id}>{produto.nome} - R$ {produto.preco.toFixed(2)}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button onClick={adicionarProduto} disabled={!produtoSelecionado || carregando} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:bg-gray-300 disabled:cursor-not-allowed">
                  {carregando ? '...' : <Plus size={20} />}
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Itens da Comanda</h3>
                <div className="text-2xl font-bold text-green-600">R$ {totalComanda.toFixed(2).replace('.', ',')}</div>
              </div>
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {comandaAtual.itens && comandaAtual.itens.length > 0 ? (
                  comandaAtual.itens.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.produto?.nome}</p>
                        <p className="text-sm text-gray-500">R$ {item.valor_unit.toFixed(2).replace('.', ',')} cada</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)} className="p-1 hover:bg-gray-200 rounded"><Minus size={16} /></button>
                        <span className="w-8 text-center font-medium">{item.quantidade}</span>
                        <button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)} className="p-1 hover:bg-gray-200 rounded"><Plus size={16} /></button>
                        <button onClick={() => removerItem(item.id)} className="p-1 hover:bg-red-100 text-red-600 rounded ml-2"><Trash2 size={16} /></button>
                        <div className="w-20 text-right font-medium text-green-600">R$ {(item.quantidade * item.valor_unit).toFixed(2).replace('.', ',')}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhum item adicionado</p>
                )}
              </div>
            </div>
          </div>
          {totalComanda > 0 && (
            <div className="p-6 border-t border-gray-200">
              {!mostrarPagamento ? (
                <button onClick={() => setMostrarPagamento(true)} disabled={carregando} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg disabled:bg-gray-300 disabled:cursor-not-allowed">
                  {carregando ? 'Carregando...' : `Finalizar Pagamento - R$ ${totalComanda.toFixed(2).replace('.', ',')}`}
                </button>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Finalizar Pagamento</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setMetodoPagamento('dinheiro')} className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${metodoPagamento === 'dinheiro' ? 'border-secondary bg-gray-100' : 'border-gray-300 hover:border-gray-400'}`}><Banknote size={20} /> Dinheiro</button>
                    <button onClick={() => setMetodoPagamento('cartao')} className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${metodoPagamento === 'cartao' ? 'border-secondary bg-gray-100' : 'border-gray-300 hover:border-gray-400'}`}><CreditCard size={20} /> Cartão</button>
                    <button onClick={() => setMetodoPagamento('pix')} className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${metodoPagamento === 'pix' ? 'border-secondary bg-gray-100' : 'border-gray-300 hover:border-gray-400'}`}><QrCode size={20} /> PIX</button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <label htmlFor="valorPago" className="text-sm font-medium text-gray-600">Total a Pagar</label>
                      <span className="text-xl font-bold text-gray-800">R$ {totalComanda.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {metodoPagamento === 'dinheiro' && (
                      <div>
                        <input id="valorPago" type="number" step="0.01" min={totalComanda} placeholder="Valor entregue pelo cliente" value={valorPagamento} onChange={(e) => setValorPagamento(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-secondary" />
                        {troco > 0 && (
                          <div className="flex justify-between items-center mt-3 text-blue-600">
                            <span className="font-medium">Troco:</span>
                            <span className="font-bold text-xl">R$ {troco.toFixed(2).replace('.', ',')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setMostrarPagamento(false); setValorPagamento(''); }} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium" disabled={carregando}>Cancelar</button>
                    <button onClick={fecharComanda} disabled={carregando || (metodoPagamento === 'dinheiro' && valorPagoFloat < totalComanda)} className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">
                      {carregando ? 'Processando...' : 'Confirmar Pagamento'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};