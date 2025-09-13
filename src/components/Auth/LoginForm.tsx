import React, { useState } from 'react';
import { signIn } from '../../lib/supabase';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else {
        onLoginSuccess();
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      {/* Card branco responsivo */}
      <div className="bg-white rounded-lg shadow-xl p-10 w-full max-w-md md:max-w-lg lg:max-w-xl">
        
        {/* Logo centralizada */}
        <div className="text-center mb-6">
          <img 
            src="/nexts.logo1.png" 
            alt="Logo NextSys" 
            className="w-72 h-auto mx-auto" 
          />
          <p className="mt-2 text-gray-600 text-base">Sistema de Gerenciamento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700"
            >
              E-mail
            </label>
            <div className="mt-1">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                required
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <div className="mt-1">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-primary text-white rounded-lg hover:bg-secondary disabled:bg-gray-400 font-medium transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
