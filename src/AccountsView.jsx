import React, { useState } from 'react';
import { Users, Trash2, History, Package, ReceiptIndianRupee } from 'lucide-react';
import { supabase } from './supabaseClient';

export const AccountsView = ({ customers, setCustomers, activeBranch, formatMoney, addTransaction, currentUser, sales, transactions }) => {
  const [newCustomerName, setNewCustomerName] = useState('');
  const [payAmounts, setPayAmounts] = useState({});

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName) return;
    
    const { data, error } = await supabase
      .from('customers')
      .insert([{ name: newCustomerName, balance: 0, branch: activeBranch }])
      .select();

    if (!error && data) {
      setCustomers(prev => [...prev, data[0]]);
      setNewCustomerName('');
    }
  };

  const handlePayment = async (customerId, currentBalance) => {
    const amount = parseFloat(payAmounts[customerId]);
    if (!amount || amount <= 0 || amount > currentBalance) return;

    const newBalance = currentBalance - amount;

    const { error } = await supabase
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', customerId);

    if (!error) {
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, balance: newBalance } : c));
      const customer = customers.find(c => c.id === customerId);
      const transactionResult = await addTransaction('IN', amount, `Entrega CC - ${customer.name}`, customerId);
      if (!transactionResult) {
        alert("Pago registrado, pero hubo un problema al registrar la transacción en el historial.");
        return;
      }
      setPayAmounts(prev => ({ ...prev, [customerId]: '' }));
      alert(`¡Pago de ${formatMoney(amount)} registrado con éxito!`);
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (customer.balance > 0) {
      alert("No se puede eliminar un cliente que tiene saldo pendiente. Primero debe saldar su cuenta.");
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${customer.name}? Se perderá todo su historial.`)) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (!error) {
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <h2 className="text-2xl font-bold text-white">Cuentas Corrientes</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${activeBranch === 'LOCAL1' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-fuchsia-900/50 text-fuchsia-400'}`}>
          {activeBranch === 'LOCAL1' ? 'LOCAL 1' : 'LOCAL 2'}
        </span>
      </div>
      
      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <form onSubmit={handleAddCustomer} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nuevo Cliente</label>
            <input type="text" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-white" placeholder="Nombre completo" required />
          </div>
          <button type="submit" className="px-6 py-2 bg-white text-black font-bold rounded-lg">Crear</button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(customer => (
          <div key={customer.id} className="bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-lg text-white">{customer.name}</h4>
                <div className="flex items-center space-x-2">
                  {currentUser === 'ADMIN' && (
                    <button onClick={() => handleDeleteCustomer(customer)} className="text-rose-500 hover:text-rose-400 p-1 transition-colors" title="Eliminar Cliente">
                      <Trash2 size={18} />
                    </button>
                  )}
                  <Users size={20} className="text-zinc-500" />
                </div>
              </div>
              <div className="my-4">
                <p className="text-sm text-zinc-500 mb-1">Deuda Actual</p>
                <p className={`text-2xl font-bold ${customer.balance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{formatMoney(customer.balance)}</p>
              </div>
              {customer.balance > 0 && (
                <div className="pt-4 border-t border-zinc-800 flex gap-2">
                  <input type="number" placeholder="Monto" className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-sm text-white" value={payAmounts[customer.id] || ''} onChange={e => setPayAmounts({...payAmounts, [customer.id]: e.target.value})} />
                  <button onClick={() => handlePayment(customer.id, customer.balance)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">Cobrar</button>
                </div>
              )}
            </div>

            {/* Historial de Compras */}
            <div className="bg-zinc-950/50 p-4 rounded-b-xl border-t border-zinc-800 max-h-60 overflow-y-auto">
              <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center">
                <History size={14} className="mr-2" /> Historial de Compras
              </h5>
              <div className="space-y-3">
                {sales
                  .filter(s => s.customer_id?.toString() === customer.id.toString())
                  .map(sale => (
                    <div key={sale.id} className="text-xs border-b border-zinc-800 pb-2 last:border-0">
                      <p className="text-zinc-500 mb-1">{new Date(sale.date).toLocaleDateString('es-AR')}</p>
                      {sale.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-zinc-300">
                          <span><Package size={10} className="inline mr-1" /> {item.name} (x{item.qty})</span>
                          <span>{formatMoney(item.price * item.qty)}</span>
                        </div>
                      ))}
                      <p className="text-right font-bold text-white mt-1">Total: {formatMoney(sale.total)}</p>
                    </div>
                  ))}
                {sales.filter(s => s.customer_id?.toString() === customer.id.toString()).length === 0 && (
                  <p className="text-zinc-600 text-center py-2 italic">Sin compras registradas</p>
                )}
              </div>
            </div>

            {/* Historial de Pagos */}
            <div className="bg-emerald-950/20 p-4 border-t border-zinc-800 max-h-40 overflow-y-auto">
              <h5 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center">
                <ReceiptIndianRupee size={14} className="mr-2" /> Historial de Pagos
              </h5>
              <div className="space-y-2">
                {transactions
                  .filter(tx => tx.customer_id?.toString() === customer.id.toString() && tx.type === 'IN')
                  .map(tx => (
                    <div key={tx.id} className="flex justify-between items-center text-xs border-b border-emerald-900/30 pb-1 last:border-0">
                      <div>
                        <p className="text-zinc-300 font-medium">{new Date(tx.date).toLocaleDateString('es-AR')} - {new Date(tx.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-[10px] text-zinc-500">Recibido por: {tx.user}</p>
                      </div>
                      <span className="text-emerald-400 font-bold">+{formatMoney(tx.amount)}</span>
                    </div>
                  ))}
                {transactions.filter(tx => tx.customer_id?.toString() === customer.id.toString() && tx.type === 'IN').length === 0 && (
                  <p className="text-zinc-600 text-center py-2 italic text-[10px]">Sin pagos registrados</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};