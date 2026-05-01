import React from 'react';
import { DollarSign, ShoppingCart, Users } from 'lucide-react';

export const DashboardView = ({ transactions, activeBranch, customers, sales, formatMoney }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const todayIn = transactions
    .filter(tx => tx.type === 'IN' && tx.date.startsWith(today))
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const todayOut = transactions
    .filter(tx => tx.type === 'OUT' && tx.date.startsWith(today))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalCC = customers.reduce((sum, c) => sum + c.balance, 0);
  const todaySalesCount = sales.filter(s => s.date.startsWith(today)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <h2 className="text-2xl font-bold text-white">Resumen del Día</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${activeBranch === 'LOCAL1' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-fuchsia-900/50 text-fuchsia-400'}`}>
          {activeBranch === 'LOCAL1' ? 'LOCAL 1' : 'LOCAL 2'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex items-center space-x-4">
          <div className="p-3 bg-emerald-950 text-emerald-400 rounded-full"><DollarSign size={24} /></div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Ingresos Hoy</p>
            <p className="text-2xl font-bold text-white">{formatMoney(todayIn)}</p>
          </div>
        </div>
        
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex items-center space-x-4">
          <div className="p-3 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-full"><ShoppingCart size={24} /></div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Egresos Hoy</p>
            <p className="text-2xl font-bold text-white">{formatMoney(todayOut)}</p>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex items-center space-x-4">
          <div className="p-3 bg-zinc-800 text-white rounded-full"><ShoppingCart size={24} /></div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Ventas Hoy</p>
            <p className="text-2xl font-bold text-white">{todaySalesCount}</p>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex items-center space-x-4">
          <div className="p-3 bg-zinc-800 text-zinc-400 rounded-full"><Users size={24} /></div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">A Cobrar (CC)</p>
            <p className="text-2xl font-bold text-white">{formatMoney(totalCC)}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Últimas Transacciones</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-sm uppercase">
                <th className="pb-3 font-medium">Fecha/Hora</th>
                <th className="pb-3 font-medium">Descripción</th>
                <th className="pb-3 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
               {transactions.slice(0, 5).map(tx => (
                <tr key={tx.id} className="border-b border-zinc-800 last:border-0">
                  <td className="py-3 text-sm text-zinc-200">{new Date(tx.date).toLocaleString('es-AR')}</td>
                  <td className="py-3 text-sm text-zinc-200">{tx.description}</td>
                  <td className={`py-3 text-sm text-right font-medium ${tx.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'IN' ? '+' : '-'}{formatMoney(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};