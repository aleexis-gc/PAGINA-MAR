import React, { useState } from 'react';
import { Wallet, Search } from 'lucide-react';

export const CashbookView = ({ transactions, activeBranch, formatMoney, addTransaction }) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('IN');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (e) => {
    e.preventDefault();
    if (!amount || !desc) return;
    addTransaction(type, amount, desc);
    setAmount('');
    setDesc('');
  };

  const balance = transactions.reduce((sum, tx) => tx.type === 'IN' ? sum + tx.amount : sum - tx.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-white">Caja</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${activeBranch === 'LOCAL1' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-fuchsia-900/50 text-fuchsia-400'}`}>
            {activeBranch === 'LOCAL1' ? 'LOCAL 1' : 'LOCAL 2'}
          </span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 text-white px-6 py-3 rounded-xl flex items-center space-x-3">
          <Wallet size={24} className="text-zinc-500" />
          <div>
            <p className="text-zinc-500 text-xs uppercase font-bold">Saldo en Caja</p>
            <p className="text-xl font-bold">{formatMoney(balance)}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-40">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-white">
              <option value="IN">Ingreso (+)</option>
              <option value="OUT">Egreso (-)</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Descripción</label>
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-white" required />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Monto</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-white" required />
          </div>
          <button type="submit" className="w-full md:w-auto px-6 py-2 bg-white text-black font-bold rounded-lg">Registrar</button>
        </form>
      </div>

      <div className="relative w-full md:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={16} />
        <input type="text" placeholder="Buscar movimiento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white" />
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-zinc-950/50">
            <tr className="text-zinc-500 text-sm">
              <th className="p-4 font-medium">Fecha</th>
              <th className="p-4 font-medium">Detalle</th>
              <th className="p-4 font-medium text-right">Ingreso</th>
              <th className="p-4 font-medium text-right">Egreso</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(tx => (
              <tr key={tx.id} className="border-t border-zinc-800 hover:bg-zinc-800/20">
                <td className="p-4 text-xs text-zinc-500">{new Date(tx.date).toLocaleString('es-AR')}</td>
                <td className="p-4 text-zinc-100 font-medium">{tx.description}</td>
                <td className="p-4 text-right text-emerald-400 font-medium">
                  {tx.type === 'IN' ? formatMoney(tx.amount) : '-'}
                </td>
                <td className="p-4 text-right text-rose-400 font-medium">
                  {tx.type === 'OUT' ? formatMoney(tx.amount) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};