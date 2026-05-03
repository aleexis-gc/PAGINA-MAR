import React, { useState } from 'react';
import { Search, ShoppingCart, Minus, Plus, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

export const PosView = ({ products, customers, sales, setSales, setProducts, setCustomers, addTransaction, formatMoney, currentUser, activeBranch }) => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * item.qty), 0);

  const addToCart = (product) => {
    const currentStock = product.stock ?? 0; // Si es null, lo toma como 0

    if (currentStock <= 0) {
      alert("Este producto no tiene stock disponible.");
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty >= currentStock) {
        alert("No hay más stock disponible para este producto.");
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Cuenta Corriente' && !selectedCustomer) {
      alert("Debe seleccionar un cliente para enviar a cuenta corriente.");
      return;
    }

    const newSale = {
      items: cart,
      total: cartTotal,
      payment_method: paymentMethod,
      customer_id: selectedCustomer || null,
      seller: currentUser,
      branch: activeBranch
    };

    const { data: saleData, error: saleError } = await supabase.from('sales').insert([newSale]).select();

    if (saleError) {
      console.error("Error de Supabase:", saleError);
      alert("Error al guardar la venta: " + saleError.message);
      return;
    }

    setSales(prev => [saleData[0], ...prev]);

    // Descontar Stock en Supabase (Uno por uno o por RPC)
    try {
      await Promise.all(
        cart.map(item => 
          supabase.from('products')
            .update({ stock: item.stock - item.qty })
            .eq('id', item.id)
        )
      );

      // Actualizar el estado local de productos para que la UI refleje el nuevo stock inmediatamente
      setProducts(prev => prev.map(p => {
        const itemInCart = cart.find(item => item.id === p.id);
        return itemInCart ? { ...p, stock: p.stock - itemInCart.qty } : p;
      }));
    } catch (err) {
      console.error("Error actualizando stock:", err);
      alert("La venta se registró pero hubo un problema al actualizar el stock en el servidor.");
    }

    // --- Lógica de transacción y actualización de saldo ---
    try {
      let transactionDescription = `Venta (${paymentMethod})`;
      let customerNameForTransaction = '';

      if (paymentMethod === 'Cuenta Corriente' && selectedCustomer) {
        const customerToUpdate = customers.find(c => c.id?.toString() === selectedCustomer?.toString());
        if (customerToUpdate) {
          customerNameForTransaction = customerToUpdate.name;
          transactionDescription = `Venta CC - ${customerNameForTransaction}`;

          // Actualizar el saldo del cliente en la base de datos
          const newBalance = customerToUpdate.balance + cartTotal;
          const { error: customerError } = await supabase
            .from('customers')
            .update({ balance: newBalance })
            .eq('id', selectedCustomer);

          if (customerError) {
            console.error("Error actualizando saldo del cliente:", customerError);
            alert("La venta se registró, pero hubo un problema al actualizar el saldo del cliente en el servidor.");
          } else {
            // Actualizar el estado local de clientes
            setCustomers(prev => prev.map(c => 
              c.id?.toString() === selectedCustomer?.toString() ? { ...c, balance: newBalance } : c
            ));
          }
        }
      }

      // Registrar la transacción de pago
      const transactionResult = await addTransaction(
        paymentMethod === 'Cuenta Corriente' ? 'CC_SALE' : 'IN',
        cartTotal,
        transactionDescription,
        selectedCustomer || null
      );

      if (!transactionResult) {
        alert("¡Venta registrada! Sin embargo, hubo un problema al registrar la transacción de pago.");
      }

      setCart([]); // Limpiar el carrito
      setSelectedCustomer(''); // Resetear cliente seleccionado
      setPaymentMethod('Efectivo'); // Resetear método de pago
      alert("¡Venta registrada!"); // Mensaje final de éxito
    } catch (error) {
      console.error("Error general en handleCheckout:", error);
      alert("Ocurrió un error inesperado al procesar la venta.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-120px)]">
      <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden min-h-[300px]">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border-zinc-700 border rounded-lg text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 md:p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-3 content-start">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)} 
              className="group border border-zinc-800 rounded-xl p-3 cursor-pointer hover:border-zinc-600 hover:bg-zinc-800/40 transition-all bg-zinc-900/50 flex flex-col justify-between h-28 md:h-32 active:scale-95 select-none"
            >
              <div className="flex-1"> {/* Added flex-1 to allow content to grow, if not already present */}
                <p className="font-semibold text-zinc-100 text-sm line-clamp-2 leading-tight group-hover:text-white">
                  {product.name}
                </p>
                {product.size && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded mt-1 inline-block">Talle: {product.size}</span>}
              </div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-xs text-zinc-500 font-medium">Stock: {product.stock}</span>
                <span className="text-lg font-black text-white">{formatMoney(product.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-96 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h3 className="font-bold text-white flex items-center"><ShoppingCart className="mr-2" size={20}/> Venta Actual</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-zinc-400">{formatMoney(item.price)} x {item.qty}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-zinc-800 rounded"><Minus size={14}/></button>
                <span className="w-4 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-zinc-800 rounded"><Plus size={14}/></button>
                <button onClick={() => removeFromCart(item.id)} className="text-rose-500 ml-2"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 space-y-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>{formatMoney(cartTotal)}</span>
          </div>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-sm text-white">
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Cuenta Corriente">A Cuenta Corriente</option>
          </select>
          {paymentMethod === 'Cuenta Corriente' && (
            <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-sm text-white">
              <option value="">-- Seleccionar Cliente --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-white text-black font-bold rounded-lg flex justify-center items-center space-x-2 disabled:bg-zinc-800"
          >
            <CheckCircle size={20} />
            <span>Cobrar {formatMoney(cartTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};