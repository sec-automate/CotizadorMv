import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import QuotePage from './pages/QuotePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import { useRates } from './hooks/useRates';
import { calculateTotal, isRateDateValid, parsePrice } from './utils/pricing';
import './App.css';

// Detect API URL: Use environment variable or default to relative path for production,
// falling back to local port if necessary for development.
const API_URL = process.env.REACT_APP_API_URL || 
                (window.location.hostname === 'localhost' ? 'http://localhost:5001/api' : '/api');

function App() {
    const { rates, activeRate, setActiveRate, loading, addRate, deleteRate, toggleRateActive } = useRates(API_URL);
    const [intelligentMode, setIntelligentMode] = useState(false);
    const [user, setUser] = useState(localStorage.getItem('user'));

    // Quote form state
    const [quoteInput, setQuoteInput] = useState({
        adults: 1, children: 0, pets: 0, checkIn: '', checkOut: '', 
        applyDiscount: false, discountPercentage: 0, customerName: '', 
        customerId: '', customerPhone: '', leadId: ''
    });
    const [quoteResult, setQuoteResult] = useState(null);
    const [error, setError] = useState(null);

    // Rate management state
    const [newRate, setNewRate] = useState({
        name: '', adult_price_1: 0, adult_price_2: 0, adult_price_3: 0, adult_price_4: 0, child_price: '0', pet_price: '0',
        max_people_per_room: 4, max_pets: 5, free_children_count: 0, valid_from: '', valid_until: '', always_available: true,
        room_type: 'estandar', plan_type: 'AI'
    });

    const handleLogin = (username) => {
        setUser(username);
        localStorage.setItem('user', username);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const handleAddRate = async (e) => {
        e.preventDefault();
        if (!newRate.always_available && (!newRate.valid_from || !newRate.valid_until)) {
            alert('Por favor completa las fechas de validez o marca "Siempre disponible".');
            return;
        }

        const rateToSave = {
            ...newRate,
            adult_price_1: parsePrice(newRate.adult_price_1),
            adult_price_2: parsePrice(newRate.adult_price_2),
            adult_price_3: parsePrice(newRate.adult_price_3),
            adult_price_4: parsePrice(newRate.adult_price_4),
            child_price: parsePrice(newRate.child_price),
            pet_price: parsePrice(newRate.pet_price)
        };

        try {
            await addRate(rateToSave);
            setNewRate({
                name: '', adult_price_1: '0', adult_price_2: '0', adult_price_3: '0', adult_price_4: '0',
                child_price: '0', pet_price: '0', max_people_per_room: 4, max_pets: 5, free_children_count: 0,
                valid_from: '', valid_until: '', always_available: true, room_type: 'estandar', plan_type: 'AI'
            });
        } catch (err) {
            alert('Error al guardar: ' + err.message);
        }
    };

    const handleDeleteRate = async (id) => {
        try {
            await deleteRate(id);
        } catch (err) {
            console.error('Error deleting rate', err);
        }
    };

    const handleToggleActive = async (rate) => {
        try {
            await toggleRateActive(rate);
        } catch (err) {
            console.error('Error toggling rate status', err);
        }
    };

  const handleCalculate = (e) => {
    e.preventDefault();
    setError(null);
    setQuoteResult(null);

    if (!quoteInput.checkIn || !quoteInput.checkOut) {
      setError('Por favor selecciona las fechas.');
      return;
    }

    const start = new Date(quoteInput.checkIn);
    const end = new Date(quoteInput.checkOut);
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    let selectedRate = activeRate;

    if (intelligentMode) {
      const eligibleRates = rates.filter(r => r.is_active && isRateDateValid(r, quoteInput.checkIn, quoteInput.checkOut));
      if (eligibleRates.length === 0) {
        setError('No hay ninguna tarifa activa que se ajuste.');
        return;
      }
      selectedRate = eligibleRates.reduce((prev, curr) => {
        return calculateTotal(prev, quoteInput, nights).total < calculateTotal(curr, quoteInput, nights).total ? prev : curr;
      });
    } else {
      if (!activeRate) return setError('No hay ninguna tarifa seleccionada.');
      if (!activeRate.is_active) return setError('La tarifa seleccionada no está activa.');
      if (!isRateDateValid(activeRate, quoteInput.checkIn, quoteInput.checkOut)) return setError('Tarifa no válida para estas fechas.');
    }

    const calc = calculateTotal(selectedRate, quoteInput, nights);
    if (calc.error) {
      setError(calc.error);
    } else {
      setQuoteResult({
        total: calc.total,
        nights,
        rateName: selectedRate.name,
        rooms: calc.roomDetails,
        pets: quoteInput.pets,
        applyDiscount: quoteInput.applyDiscount,
        discountPercentage: quoteInput.discountPercentage,
        discountAmount: quoteInput.applyDiscount ? (calc.total * (quoteInput.discountPercentage / 100)) : 0,
        finalTotal: quoteInput.applyDiscount ? (calc.total * (1 - quoteInput.discountPercentage / 100)) : calc.total,
        customerName: quoteInput.customerName,
        customerId: quoteInput.customerId,
        customerPhone: quoteInput.customerPhone,
        leadId: quoteInput.leadId
      });
    }
  };

  return (
    <Router>
      <div className="container">
        <header>
          <h1>TarifaMaster</h1>
          <p>Precios Escalados y Multi-habitación</p>
        </header>

        <Navbar user={user} onLogout={handleLogout} />

        <div className="dashboard">
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/admin" /> : <LoginPage onLogin={handleLogin} />
            } />
            <Route path="/" element={
              <QuotePage
                rates={rates}
                activeRate={activeRate}
                setActiveRate={setActiveRate}
                intelligentMode={intelligentMode}
                setIntelligentMode={setIntelligentMode}
                quoteInput={quoteInput}
                setQuoteInput={setQuoteInput}
                quoteResult={quoteResult}
                handleCalculate={handleCalculate}
                error={error}
                apiUrl={API_URL}
              />
            } />
            <Route path="/admin" element={
              user ? (
                <AdminPage
                  newRate={newRate}
                  setNewRate={setNewRate}
                  handleAddRate={handleAddRate}
                  rates={rates}
                  loading={loading}
                  handleToggleActive={handleToggleActive}
                  handleDeleteRate={handleDeleteRate}
                  apiUrl={API_URL}
                />
              ) : <Navigate to="/login" />
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
