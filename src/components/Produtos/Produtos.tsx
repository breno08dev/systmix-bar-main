import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { produtosService } from '../../services/produtos';
import { Produto } from '../../types';
import { ProdutoModal } from './ProdutoModal';

export const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEdicao, setProdutoEdicao] = useState<Produto | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const data = await produtosService.listar();
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleProdutoSalvo = () => {
    carregarProdutos();
    setModalAberto(false);
    setProdutoEdicao(null);
  };

  const editarProduto = (produto: Produto) => {
    setProdutoEdicao(produto);
    setModalAberto(true);
  };

  const excluirProduto = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await produtosService.deletar(id);
        carregarProdutos();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
      }
    }
  };

  const alternarStatus = async (produto: Produto) => {
    try {
      await produtosService.atualizar(produto.id, { ativo: !produto.ativo });
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const categorias = [...new Set(produtos.map(p => p.categoria))];

  const produtosFiltrados = produtos.filter(produto => {
    const matchCategoria = !filtroCategoria || produto.categoria === filtroCategoria;
    const matchAtivo = filtroAtivo === 'todos' || 
                      (filtroAtivo === 'ativo' && produto.ativo) ||
                      (filtroAtivo === 'inativo' && !produto.ativo);
    
    return matchCategoria && matchAtivo;
  });

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Produtos</h1>
            <p className="text-gray-600">Gerencie o cardápio do seu bar</p>
          </div>
          <button
            onClick={() => {
              setProdutoEdicao(null);
              setModalAberto(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(categoria => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>

          <select
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Apenas ativos</option>
            <option value="inativo">Apenas inativos</option>
          </select>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtosFiltrados.map(produto => (
                <div key={produto.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{produto.nome}</h3>
                      <p className="text-sm text-gray-500 mb-1">{produto.categoria}</p>
                      <p className="text-lg font-bold text-green-600">
                        R$ {produto.preco.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        produto.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => alternarStatus(produto)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        produto.ativo
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {produto.ativo ? 'Inativar' : 'Ativar'}
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => editarProduto(produto)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      <button
                        onClick={() => excluirProduto(produto.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <ProdutoModal
          produto={produtoEdicao}
          onClose={() => {
            setModalAberto(false);
            setProdutoEdicao(null);
          }}
          onProdutoSalvo={handleProdutoSalvo}
        />
      )}
    </div>
  );
};