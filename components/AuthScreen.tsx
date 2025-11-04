import React, { useState, FormEvent } from 'react';
import { User } from '../types';
import Card from './ui/Card';
import useLocalStorage from '../hooks/useLocalStorage';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [users, setUsers] = useLocalStorage<User[]>('constructpro_users', []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Handle Login
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Correo electrónico o contraseña incorrectos.');
      }
    } else {
      // Handle Register
      if (users.some(u => u.email === email)) {
        setError('Este correo electrónico ya está registrado.');
        return;
      }
      if (password.length < 4) {
        setError('La contraseña debe tener al menos 4 caracteres.');
        return;
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        password, // NOTE: In a real app, this should be hashed!
      };
      setUsers([...users, newUser]);
      onLogin(newUser);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <Card title={isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'} className="w-full max-w-sm shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full p-2 border rounded-md shadow-sm bg-white text-black"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md shadow-sm bg-white text-black"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md shadow-sm bg-white text-black"
              required
            />
          </div>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700"
          >
            {isLogin ? 'Entrar' : 'Registrarse'}
          </button>
          
          <p className="text-center text-sm">
            {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="ml-2 font-medium text-primary-600 hover:text-primary-500"
            >
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default AuthScreen;