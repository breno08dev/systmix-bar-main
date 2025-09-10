import React, { useState, useEffect } from 'react';
import { Plus, Users, Phone, Calendar } from 'lucide-react';
import { clientesService } from '../../services/clientes';
import { Cliente } from '../../types';
import { ClienteModal } from './ClienteModal';

export const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const data = await clientesService.listar();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const handleClienteSalvo = () => {
    carregarClientes();
    setModalAberto(false);
    setClienteEdicao(null);
  };

  const editarCliente = (cliente: Cliente) => {
    setClienteEdicao(cliente);
    setModalAberto(true);
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.telefone?.includes(busca)
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h1>
            <p className="text-gray-600">Gerencie sua base de clientes</p>
          </div>
          <button
            onClick={() => {
              setClienteEdicao(null);
              setModalAberto(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            <Plus size={20} />
            Novo Cliente
          </button>
        </div>

        {/* Busca */}
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Buscar cliente por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientesFiltrados.map(cliente => (
                <div
                  key={cliente.id}
                  onClick={() => editarCliente(cliente)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{cliente.nome}</h3>
                      
                      {cliente.telefone && (
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <Phone size={14} />
                          <span className="text-sm">{cliente.telefone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-gray-500 mt-2">
                        <Calendar size={14} />
                        <span className="text-xs">
                          Cadastrado em {new Date(cliente.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Clique para ver detalhes e histórico
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <ClienteModal
          cliente={clienteEdicao}
          onClose={() => {
            setModalAberto(false);
            setClienteEdicao(null);
          }}
          onClienteSalvo={handleClienteSalvo}
        />
      )}
    </div>
  );
};