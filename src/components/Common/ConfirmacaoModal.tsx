import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmacaoModalProps {
  titulo: string;
  mensagem: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmacaoModal: React.FC<ConfirmacaoModalProps> = ({
  titulo,
  mensagem,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">{mensagem}</p>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>
  );
};