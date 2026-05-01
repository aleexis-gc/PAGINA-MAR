import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Tag, Wallet, Users, LogOut, Store, Menu, X } from 'lucide-react';
import { supabase } from './supabaseClient';

// Importar las vistas desde sus archivos para modularizar
import { DashboardView } from './DashboardView';
import { PosView } from './PosView';
import { ProductsView } from './ProductsView';
import { CashbookView } from './CashbookView';
import { AccountsView } from './AccountsView';
import { LoginView } from './LoginView';

// --- CONFIGURACIÓN DE IMAGEN ---
// Importante: Si usas Vite, la carpeta 'IMAGES' debe estar dentro de 'public'.
const LOGO_URL = "/MAR PNG.png"; 

// --- DATOS INICIALES DE PRUEBA ---
const initialProducts = [
  { id: 1, name: 'Remera Básica Algodón', price: 8500, stock: 50 },
  { id: 2, name: 'Jean Mom Vintage', price: 28000, stock: 15 },
  { id: 3, name: 'Campera de Cuero PU', price: 45000, stock: 8 },
  { id: 4, name: 'Zapatillas Urbanas', price: 32000, stock: 12 },
  { id: 5, name: 'Buzo Canguro Oversize', price: 19500, stock: 20 },
];

const initialCustomers = [
  { id: 1, name: 'María Gómez', phone: '3512345678', balance: 15000 },
  { id: 2, name: 'Juan Pérez', phone: '3518765432', balance: 0 },
  { id: 3, name: 'Sofía López', phone: '3511122334', balance: 32000 },
];

const initialTransactions = [
  { id: 1, date: new Date().toISOString(), type: 'IN', amount: 50000, description: 'Saldo inicial de caja' },
];

export default function App() {
  // --- ESTADOS DE SESIÓN Y SUCURSAL ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('currentUser') || null);
  const [activeBranch, setActiveBranch] = useState(() => localStorage.getItem('activeBranch') || null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE DATOS ---
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // --- CARGAR DATOS DESDE SUPABASE ---
  useEffect(() => {
    if (activeBranch) {
      fetchBranchData(activeBranch);
    }
  }, [activeBranch]);

  const fetchBranchData = async (branch) => {
    setLoading(true);
    const [
      { data: p },
      { data: c },
      { data: s },
      { data: t }
    ] = await Promise.all([
      supabase.from('products').select('*').eq('branch', branch),
      supabase.from('customers').select('*').eq('branch', branch),
      supabase.from('sales').select('*').eq('branch', branch),
      supabase.from('transactions').select('*').eq('branch', branch).order('date', { ascending: false })
    ]);

    setProducts(p || []); setCustomers(c || []); setSales(s || []); setTransactions(t || []);
    setLoading(false);
  };

  // --- CONTROL DE CAMBIO DE SUCURSAL (PARA EL ADMIN) ---
  const handleBranchChange = (branch) => {
    setActiveBranch(branch);
    localStorage.setItem('activeBranch', branch);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveBranch(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('activeBranch');
  };

  // --- FUNCIONES AUXILIARES ---
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const addTransaction = async (type, amount, description) => {
    const newTx = {
      type,
      amount: parseFloat(amount),
      description,
      user: currentUser,
      branch: activeBranch
    };

    const { data, error } = await supabase.from('transactions').insert([newTx]).select();
    
    if (!error && data) {
      setTransactions(prev => [data[0], ...prev]);
    } else {
      console.error("Error en Supabase:", error);
    }
  };

  const login = (role, branch) => {
    setCurrentUser(role);
    localStorage.setItem('currentUser', role);
    handleBranchChange(branch);
  };

  // --- NAVEGACIÓN Y LAYOUT PRINCIPAL ---
  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: <LayoutDashboard size={20} /> },
    { id: 'pos', label: 'Ventas (POS)', icon: <ShoppingCart size={20} /> },
    { id: 'products', label: 'Productos', icon: <Tag size={20} /> },
    { id: 'cash', label: 'Caja', icon: <Wallet size={20} /> },
    { id: 'accounts', label: 'Cuentas C.', icon: <Users size={20} /> },
  ];

  if (!currentUser) {
    return <LoginView onLogin={login} logoUrl={LOGO_URL} />;
  }

  return (
    <div className="min-h-screen bg-[family-name:--color-fondo-principal] bg-zinc-950 flex flex-col md:flex-row font-sans text-white">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-72 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-800 p-3 md:p-4 flex flex-col z-30 sticky top-0 md:h-screen shadow-xl md:shadow-none">
        {/* Logo Container */}
        <div className="flex items-center justify-between mb-3 md:mb-8">
          <div className="flex items-center flex-1">
            {LOGO_URL ? (
              <img src={LOGO_URL} alt="Logo" className="h-12 md:h-28 w-auto max-w-full object-contain block" />
            ) : (
              <Tag size={24} className="text-white" />
            )}
          </div>
          <div className="relative md:hidden">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-zinc-500 hover:text-white transition-colors">
              {showSettings ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            {showSettings && (
              <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl z-50 space-y-4 w-64">
                {currentUser === 'ADMIN' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Sucursal</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                      <select 
                        value={activeBranch} 
                        onChange={(e) => { handleBranchChange(e.target.value); setShowSettings(false); }}
                        className="w-full pl-8 pr-2 py-2 bg-zinc-800 border-zinc-700 border rounded-lg text-xs text-white focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="LOCAL1">CHILE 164 (Local 1)</option>
                        <option value="LOCAL2">MIGUEL J. 542 (Local 2)</option>
                      </select>
                    </div>
                  </div>
                )}
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center space-x-3 px-3 py-3 w-full rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-sm font-bold"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selector de Sucursal para Admin (Solo PC) */}
        {currentUser === 'ADMIN' && (
          <div className="hidden md:block mb-8 px-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 opacity-50">Viendo Sucursal</p>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <select 
                value={activeBranch} 
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none appearance-none cursor-pointer hover:border-zinc-700 transition-all shadow-sm font-medium"
              >
                <option value="LOCAL1">CHILE 164 (Local 1)</option>
                <option value="LOCAL2">MIGUEL J. 542 (Local 2)</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex md:flex-col justify-center md:justify-start space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setShowSettings(false);
              }}
              className={`flex items-center justify-center md:justify-start space-x-2 md:space-x-3 px-4 py-2.5 md:py-3 rounded-xl transition-all font-medium whitespace-nowrap ${
                activeTab === item.id 
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-lg shadow-white/5' 
                  : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Logout PC only */}
        <div className="hidden md:flex mt-auto pt-6 border-t border-zinc-900">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-zinc-500 hover:bg-rose-500/5 hover:text-rose-500 transition-all font-medium"
          >
            <LogOut size={20} />
            <span className="text-sm font-bold">Cerrar Sesión</span>
          </button>
        </div>

      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto bg-black">
        {activeTab === 'dashboard' && <DashboardView transactions={transactions} activeBranch={activeBranch} customers={customers} sales={sales} formatMoney={formatMoney} />}
        {activeTab === 'pos' && <PosView products={products} customers={customers} sales={sales} setSales={setSales} setProducts={setProducts} setCustomers={setCustomers} addTransaction={addTransaction} formatMoney={formatMoney} currentUser={currentUser} />}
        {activeTab === 'products' && <ProductsView products={products} setProducts={setProducts} activeBranch={activeBranch} formatMoney={formatMoney} />}
        {activeTab === 'cash' && <CashbookView transactions={transactions} activeBranch={activeBranch} formatMoney={formatMoney} addTransaction={addTransaction} />}
        {activeTab === 'accounts' && <AccountsView customers={customers} setCustomers={setCustomers} activeBranch={activeBranch} formatMoney={formatMoney} addTransaction={addTransaction} currentUser={currentUser} />}
      </main>
    </div>
  );
}