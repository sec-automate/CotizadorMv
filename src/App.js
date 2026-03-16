import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import QuotePage from './pages/QuotePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import './App.css';

const API_URL = 'http://localhost:5001/api';

function App() {
  const [rates, setRates] = useState([]);
  const [activeRate, setActiveRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [intelligentMode, setIntelligentMode] = useState(false);
  const [user, setUser] = useState(localStorage.getItem('user'));

  // Quote form state
  const [quoteInput, setQuoteInput] = useState({
    adults: 1,
    children: 0,
    pets: 0,
    checkIn: '',
    checkOut: '',
    applyDiscount: false,
    discountPercentage: 0,
    customerName: '',
    customerId: '',
    customerPhone: '',
    leadId: ''
  });
  const [quoteResult, setQuoteResult] = useState(null);
  const [error, setError] = useState(null);

  // Rate management state
  const [newRate, setNewRate] = useState({
    name: '',
    adult_price_1: 0,
    adult_price_2: 0,
    adult_price_3: 0,
    adult_price_4: 0,
    child_price: '0',
    pet_price: '0',
    max_people_per_room: 4,
    max_pets: 5,
    free_children_count: 0,
    valid_from: '',
    valid_until: '',
    always_available: true,
    room_type: 'estandar',
    plan_type: 'AI'
  });

  const parsePrice = (price) => {
    if (!price) return 0;
    const str = price.toString().replace(',', '.');
    return parseFloat(str) || 0;
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const resp = await fetch(`${API_URL}/rates`);
      if (!resp.ok) throw new Error('Failed to fetch');
      const data = await resp.json();
      if (Array.isArray(data)) {
        setRates(data);
        if (data.length > 0) setActiveRate(data[0]);
      } else {
        setRates([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching rates', err);
      setRates([]);
      setLoading(false);
    }
  };

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
      const resp = await fetch(`${API_URL}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateToSave)
      });
      if (!resp.ok) {
        const contentType = resp.headers.get('content-type');
        let errorMessage = 'Failed to save';

        if (contentType && contentType.includes('application/json')) {
          const errData = await resp.json();
          errorMessage = errData.error || errorMessage;
        } else {
          const textError = await resp.text();
          console.error('Non-JSON error response:', textError);
          errorMessage = `Server Error (${resp.status})`;
        }
        throw new Error(errorMessage);
      }
      fetchRates();
      setNewRate({
        name: '',
        adult_price_1: '0',
        adult_price_2: '0',
        adult_price_3: '0',
        adult_price_4: '0',
        child_price: '0',
        pet_price: '0',
        max_people_per_room: 4,
        max_pets: 5,
        free_children_count: 0,
        valid_from: '',
        valid_until: '',
        always_available: true,
        room_type: 'estandar',
        plan_type: 'AI'
      });
    } catch (err) {
      console.error('Error adding rate', err);
      alert('Error al guardar: ' + err.message);
    }
  };

  const handleDeleteRate = async (id) => {
    try {
      await fetch(`${API_URL}/rates/${id}`, { method: 'DELETE' });
      fetchRates();
    } catch (err) {
      console.error('Error deleting rate', err);
    }
  };

  const handleToggleActive = async (rate) => {
    try {
      await fetch(`${API_URL}/rates/${rate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rate, is_active: !rate.is_active })
      });
      fetchRates();
    } catch (err) {
      console.error('Error toggling rate status', err);
    }
  };

  const calculateTotal = (rate, input, days) => {
    const totalPeople = input.adults + input.children;
    const roomCapacity = rate.max_people_per_room || 4;
    const numRooms = Math.ceil(totalPeople / roomCapacity);

    if (input.adults < numRooms) {
      return { error: `Se requieren al menos ${numRooms} adultos para ${numRooms} habitaciones.` };
    }

    let rooms = [];
    for (let i = 0; i < numRooms; i++) {
      rooms.push({ adults: 0, children: 0 });
    }

    let adultsToDistribute = input.adults;
    let roomIdx = 0;
    while (adultsToDistribute > 0) {
      rooms[roomIdx].adults++;
      adultsToDistribute--;
      roomIdx = (roomIdx + 1) % numRooms;
    }

    let petsToDistribute = input.pets;
    roomIdx = 0;
    while (petsToDistribute > 0 && roomIdx < numRooms) {
      rooms[roomIdx].pets = 1;
      petsToDistribute--;
      roomIdx++;
    }
    // Initialize pets to 0 for rooms without pets
    rooms.forEach(r => { if (!r.pets) r.pets = 0; });

    let childrenToDistribute = input.children;
    roomIdx = 0;
    let attempts = 0;
    const maxAttempts = input.children * numRooms * 2;

    while (childrenToDistribute > 0 && attempts < maxAttempts) {
      const currentTotal = rooms[roomIdx].adults + rooms[roomIdx].children;
      if (currentTotal < roomCapacity) {
        rooms[roomIdx].children++;
        childrenToDistribute--;
      }
      roomIdx = (roomIdx + 1) % numRooms;
      attempts++;
    }

    if (childrenToDistribute > 0) return { error: `No hay suficiente espacio en las habitaciones.` };

    if (input.pets > numRooms) {
      return { error: `Límite de 1 mascota por habitación excedido (Máx: ${numRooms} para esta distribución).` };
    }

    // Free children: 1 free child per room if the room has more than 1 adult AND the rate enables it (free_children_count > 0)
    const freeChildEnabled = parseInt(rate.free_children_count) > 0;

    const childPrice = parseFloat(rate.child_price) || 0;
    const petPrice = parseFloat(rate.pet_price) || 0;

    let totalCost = 0;
    rooms.forEach(room => {
      const numAdults = Number(room.adults);
      const numChildren = Number(room.children);
      const priceKey = `adult_price_${Math.min(4, numAdults)}`;
      const adultPricePerPerson = parseFloat(rate[priceKey]) || 0;
      let billableChildren = numChildren;

      // 1 free child per room if room has more than 1 adult and rate enables free children
      if (freeChildEnabled && numAdults > 1 && billableChildren > 0) {
        billableChildren -= 1;
      }

      const adultTotal = numAdults * adultPricePerPerson;
      const childTotal = billableChildren * childPrice;
      const petTotal = (Number(room.pets) || 0) * petPrice;
      const roomCost = adultTotal + childTotal + petTotal;


      // Store breakdown for display
      room.adultPricePerPerson = adultPricePerPerson;
      room.adultTotal = adultTotal;
      room.billableChildren = billableChildren;
      room.childTotal = childTotal;
      room.petTotal = petTotal;
      room.freeChild = (freeChildEnabled && numAdults > 1 && numChildren > 0);

      room.cost = roomCost;
      totalCost += roomCost;
    });

    return { total: totalCost * days, roomDetails: rooms };
  };

  const isRateDateValid = (rate, checkIn, checkOut) => {
    if (rate.always_available === true || rate.always_available === 'true') return true;
    if (!rate.valid_from || !rate.valid_until) return false;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const validFrom = new Date(rate.valid_from);
    const validUntil = new Date(rate.valid_until);
    return start >= validFrom && end <= validUntil;
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
