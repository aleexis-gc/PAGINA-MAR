import React, { useState } from 'react';
import { Tag } from 'lucide-react';

export const LoginView = ({ onLogin, logoUrl }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const u = user.toLowerCase();
    
    if (u === 'local1' && pass === '1012') {
      onLogin('LOCAL1', 'LOCAL1');
    } else if (u === 'local2' && pass === '1012') {
      onLogin('LOCAL2', 'LOCAL2');
    } else if ((u === 'admin' || u === 'jefe') && pass === 'admin') {
      onLogin('ADMIN', 'LOCAL1');
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-48 object-contain" />
          ) : (
            <div className="bg-white p-4 rounded-2xl">
              <Tag size={48} className="text-black" />
            </div>
          )}
          <h2 className="text-white mt-4 font-bold tracking-widest text-sm uppercase">Acceso al Sistema</h2>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Usuario</label>
            <input 
              type="text" 
              className="w-full p-3 bg-zinc-800 border-zinc-700 border rounded-xl text-white outline-none"
              value={user}
              onChange={e => setUser(e.target.value)}
              placeholder="local1, local2 o admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full p-3 bg-zinc-800 border-zinc-700 border rounded-xl text-white outline-none"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••"
            />
          </div>
          <button type="submit" className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all mt-4">
            INGRESAR
          </button>
        </form>
      </div>
    </div>
  );
};