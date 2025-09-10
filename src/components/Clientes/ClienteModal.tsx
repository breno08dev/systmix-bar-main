import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { clientesService } from '../../services/clientes';
import { Cliente } from '../../types';

interface ClienteModalProps {
  cliente: Cliente | null;
  onClose: () => void;
  onClienteSalvo: () => void;
}

export const ClienteModal: React.FC<ClienteModalProps> = ({
  cliente,
  onClose,
  onClienteSalvo
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: ''
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome,
        telefone: cliente.telefone || ''
      });
    }
  }, [cliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const clienteData = {
        nome: formData.nome,
        telefone: formData.telefone || undefined
      };

      if (cliente) {
        await clientesService.atualizar(cliente.id, clienteData);
      } else {
        await clientesService.criar(clienteData);
      }

      onClienteSalvo();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              {cliente ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>

        {cliente && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-700 mb-2">Informações</h3>
            <p className="text-sm text-gray-500">
              Cadastrado em: {new Date(cliente.criado_em).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};