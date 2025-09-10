import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { signIn, supabase } from '../../lib/supabase';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Sign up new user
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          setError(error.message);
        } else {
          setError('');
          // Try to sign in immediately after signup
          const { error: signInError } = await signIn(email, password);
          if (signInError) {
            setError('Conta criada! Agora faça login com suas credenciais.');
          } else {
            onLoginSuccess();
          }
        }
      } else {
        // Sign in existing user
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Credenciais inválidas. Tente criar uma conta primeiro.');
          } else {
            setError(error.message);
          }
        } else {
          onLoginSuccess();
        }
      }
    } catch (err) {
      setError('Erro interno do sistema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-full mb-4">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">BarManager</h1>
          <p className="text-gray-600">Sistema de Gerenciamento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (isSignUp ? 'Criando conta...' : 'Entrando...') : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            {isSignUp ? 'Já tem uma conta? Fazer login' : 'Não tem conta? Criar uma'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Primeiro acesso:</strong> Clique em "Criar Conta" para registrar um novo usuário.
            Certifique-se de que o Supabase está configurado corretamente no arquivo .env
          </p>
        </div>
      </div>
    </div>
  );
};