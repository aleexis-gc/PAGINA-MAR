import React, { useState } from 'react';
import { Pencil, Trash2, CheckCircle, X } from 'lucide-react';
import { supabase } from './supabaseClient';

export const ProductsView = ({ products, setProducts, activeBranch, formatMoney }) => { // currentUser no se usa directamente aquí
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', type: 'Accesorio', size: '' });
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editingStockId, setEditingStockId] = useState(null);
  const [editStock, setEditStock] = useState('');

  const handleStartEdit = (product) => {
    setEditingId(product.id);
    setEditPrice(product.price.toString());
  };

  const handleStartEditStock = (product) => {
    setEditingStockId(product.id);
    setEditStock(product.stock.toString());
  };

  const handleSavePrice = async (id) => {
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice)) return;
    
    const { error } = await supabase.from('products').update({ price: newPrice }).eq('id', id);
    
    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, price: newPrice } : p));
      setEditingId(null);
      setEditPrice('');
    }
  };

  const handleSaveStock = async (id) => {
    const newStock = parseInt(editStock);
    if (isNaN(newStock) || newStock < 0) return; // El stock no puede ser negativo

    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);

    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
      setEditingStockId(null);
      setEditStock('');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    
    const product = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock) || 0,
      branch: activeBranch,
      type: newProduct.type,
      size: newProduct.type === 'Indumentaria' ? newProduct.size : null
    };

    const { data, error } = await supabase.from('products').insert([product]).select();
    
    if (!error && data) {
      setProducts([...products, data[0]]);
      setNewProduct({ name: '', price: '', stock: '', type: 'Accesorio', size: '' });
    } else {
      console.error("Error al agregar producto:", error);
      alert("No se pudo agregar el producto: " + (error?.message || "Error de conexión"));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este producto?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <h2 className="text-2xl font-bold text-white">Catálogo y Precios</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${activeBranch === 'LOCAL1' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-fuchsia-900/50 text-fuchsia-400'}`}>
          {activeBranch === 'LOCAL1' ? 'LOCAL 1' : 'LOCAL 2'}
        </span>
      </div>
      
      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h3 className="text-lg font-semibold mb-4 text-white">Agregar Nuevo Producto</h3>
        <form onSubmit={handleAddProduct} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre / Descripción</label>
            <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-white" placeholder="Ej. Remera Lisa Blanca" required />
          </div>
          <div className="w-full md:w-40">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Tipo</label>
            <select 
              value={newProduct.type}
              onChange={e => {
                const type = e.target.value;
                setNewProduct({...newProduct, type, size: type === 'Indumentaria' ? newProduct.size : ''});
              }}
              className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-white"
            >
              <option value="Accesorio">Accesorio</option>
              <option value="Indumentaria">Indumentaria</option>
            </select>
          </div>
          {newProduct.type === 'Indumentaria' && (
            <div className="w-full md:w-24">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Talle</label>
              <input 
                type="text" 
                value={newProduct.size} 
                onChange={e => setNewProduct({...newProduct, size: e.target.value})} 
                className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-white" 
                placeholder="XL, 42..." 
              />
            </div>
          )}
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Precio ($)</label>
            <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-white" placeholder="0.00" required min="0" />
          </div>
          <div className="w-full md:w-24">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Stock</label>
            <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full p-2 bg-zinc-800 border-zinc-700 border rounded-lg text-white" placeholder="0" min="0" />
          </div>
          <button type="submit" className="w-full md:w-auto px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200">Agregar</button>
        </form>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-950/50">
            <tr className="text-zinc-500 text-sm">
              <th className="p-4 font-medium">Producto</th>
              <th className="p-4 font-medium">Tipo / Talle</th>
              <th className="p-4 font-medium text-right">Precio Venta</th>
              <th className="p-4 font-medium text-center">Stock Disponible</th>
              <th className="p-4 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-t border-zinc-800">
                <td className="p-4 text-zinc-100 font-medium">{product.name}</td>
                <td className="p-4 text-zinc-400 text-sm">
                  {product.type} 
                  {product.size && <span className="ml-2 px-2 py-0.5 bg-zinc-800 rounded text-zinc-200">Talle: {product.size}</span>}
                </td>
                <td className="p-4 text-right">
                  {editingId === product.id ? (
                    <input 
                      type="number" 
                      value={editPrice} 
                      onChange={e => setEditPrice(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePrice(product.id)} 
                      className="w-24 p-1 bg-zinc-800 border-zinc-700 border rounded text-right text-white" 
                      autoFocus 
                    />
                  ) : (
                    <span className="font-bold text-white">{formatMoney(product.price)}</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {editingStockId === product.id ? (
                    <input 
                      type="number" 
                      value={editStock} 
                      onChange={e => setEditStock(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveStock(product.id)} 
                      className="w-20 p-1 bg-zinc-800 border-zinc-700 border rounded text-center text-white" 
                      autoFocus 
                    />
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.stock > 5 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
                      {product.stock} un.
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {/* Botón para editar precio */}
                  <button 
                    onClick={() => {
                      if (editingId === product.id) {
                        handleSavePrice(product.id);
                      } else {
                        setEditingStockId(null); // Cerrar edición de stock si está abierta
                        handleStartEdit(product);
                      }
                    }} 
                    className="text-zinc-400 hover:text-white p-2"
                  >
                    {editingId === product.id ? <CheckCircle size={18}/> : <Pencil size={18}/>}
                  </button>
                  {/* Botón para editar stock */}
                  <button 
                    onClick={() => {
                      if (editingStockId === product.id) {
                        handleSaveStock(product.id);
                      } else {
                        setEditingId(null); // Cerrar edición de precio si está abierta
                        handleStartEditStock(product);
                      }
                    }} 
                    className="text-zinc-400 hover:text-white p-2 ml-1"
                  >
                    {editingStockId === product.id ? <CheckCircle size={18}/> : <Pencil size={18}/>}
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="text-rose-500 hover:text-rose-400 p-2"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};