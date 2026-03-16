import React from 'react';

const AdminPage = ({
    newRate,
    setNewRate,
    handleAddRate,
    rates,
    loading,
    handleToggleActive,
    handleDeleteRate,
    apiUrl
}) => {
    return (
        <div className="card">
            <h2><span role="img" aria-label="settings">⚙️</span> Gestionar Tarifas</h2>
            <form onSubmit={handleAddRate} style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                    <label>Nombre de la Oferta</label>
                    <input type="text" placeholder="Ej: Suite Deluxe" value={newRate.name} onChange={(e) => setNewRate({ ...newRate, name: e.target.value })} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label>1 Adulto ($)</label>
                        <input type="text" placeholder="0,00" value={newRate.adult_price_1} onChange={(e) => setNewRate({ ...newRate, adult_price_1: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>2 Adultos ($p/p)</label>
                        <input type="text" placeholder="0,00" value={newRate.adult_price_2} onChange={(e) => setNewRate({ ...newRate, adult_price_2: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>3 Adultos ($p/p)</label>
                        <input type="text" placeholder="0,00" value={newRate.adult_price_3} onChange={(e) => setNewRate({ ...newRate, adult_price_3: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>4 Adultos ($p/p)</label>
                        <input type="text" placeholder="0,00" value={newRate.adult_price_4} onChange={(e) => setNewRate({ ...newRate, adult_price_4: e.target.value })} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label>Precio Niños</label>
                        <input type="text" placeholder="0,00" value={newRate.child_price} onChange={(e) => setNewRate({ ...newRate, child_price: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Precio M</label>
                        <input type="text" placeholder="0,00" value={newRate.pet_price} onChange={(e) => setNewRate({ ...newRate, pet_price: e.target.value })} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label>Cap. Habitación</label>
                        <input type="number" min="1" max="4" value={newRate.max_people_per_room} onChange={(e) => setNewRate({ ...newRate, max_people_per_room: Math.min(4, parseInt(e.target.value) || 1) })} />
                    </div>
                    <div className="form-group">
                        <label>Cap. Mascotas</label>
                        <input type="number" value={newRate.max_pets} onChange={(e) => setNewRate({ ...newRate, max_pets: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                        <label>Niños Gratis</label>
                        <input type="number" min="0" value={newRate.free_children_count} onChange={(e) => setNewRate({ ...newRate, free_children_count: parseInt(e.target.value) || 0 })} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label>Tipo de Habitación</label>
                        <select value={newRate.room_type} onChange={(e) => setNewRate({ ...newRate, room_type: e.target.value })}>
                            <option value="estandar">Estándar</option>
                            <option value="superior">Superior</option>
                            <option value="deluxe">Deluxe</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Tipo de Plan</label>
                        <select value={newRate.plan_type} onChange={(e) => setNewRate({ ...newRate, plan_type: e.target.value })}>
                            <option value="AI">AI (Todo Incluido)</option>
                            <option value="AP">AP</option>
                            <option value="MP">MP</option>
                            <option value="PC">PC</option>
                        </select>
                    </div>
                </div>

                <div className="form-group" style={{ background: 'var(--glass)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            style={{ width: 'auto' }}
                            checked={newRate.always_available}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setNewRate({ ...newRate, always_available: checked });
                            }}
                        />
                        <span style={{ fontWeight: 'bold' }}>Esta oferta está siempre disponible</span>
                    </label>
                </div>

                {!newRate.always_available && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label>Desde</label>
                            <input type="date" value={newRate.valid_from} onChange={(e) => setNewRate({ ...newRate, valid_from: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Hasta</label>
                            <input type="date" value={newRate.valid_until} onChange={(e) => setNewRate({ ...newRate, valid_until: e.target.value })} />
                        </div>
                    </div>
                )}

                <button type="submit" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>Guardar Oferta</button>
            </form>

            <div className="rates-list">
                <h3>Ofertas Disponibles</h3>
                {loading ? <p>Cargando...</p> : rates.map(rate => (
                    <div key={rate.id} className="rate-item" style={{ opacity: rate.is_active ? 1 : 0.6 }}>
                        <div className="rate-info">
                            <h4 style={{ textDecoration: rate.is_active ? 'none' : 'line-through' }}>{rate.name}</h4>
                            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                                Hab: <strong style={{ color: 'var(--primary)' }}>{rate.room_type}</strong> | Plan: <strong style={{ color: 'var(--secondary)' }}>{rate.plan_type}</strong>
                            </div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                                1A: ${rate.adult_price_1} | 2A: ${rate.adult_price_2} | 3A: ${rate.adult_price_3} | 4A: ${rate.adult_price_4}
                            </div>
                            <p style={{ fontSize: '0.75rem' }}>Niño: ${rate.child_price} | Mascota: ${rate.pet_price}</p>
                            <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>
                                {String(rate.always_available) === 'true' ? (
                                    <span className="badge" style={{ background: 'var(--secondary)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>Siempre disponible</span>
                                ) : (
                                    <span className="badge" style={{ background: 'var(--glass)', border: '1px solid var(--primary)', padding: '2px 8px', borderRadius: '4px' }}>
                                        📅 {rate.valid_from ? new Date(rate.valid_from).toLocaleDateString() : 'N/A'} - {rate.valid_until ? new Date(rate.valid_until).toLocaleDateString() : 'N/A'}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleToggleActive(rate)}
                                style={{ width: 'auto', padding: '0.5rem', background: rate.is_active ? '#f59e0b' : '#10b981', marginTop: 0 }}
                            >
                                {rate.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                                onClick={() => handleDeleteRate(rate.id)}
                                style={{ width: 'auto', padding: '0.5rem', background: '#ef4444', marginTop: 0 }}
                            >
                                Borrar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminPage;
