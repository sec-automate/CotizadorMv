import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const QuotePage = ({
    rates,
    activeRate,
    setActiveRate,
    intelligentMode,
    setIntelligentMode,
    quoteInput,
    setQuoteInput,
    quoteResult,
    handleCalculate,
    error
}) => {
    const [leadLoading, setLeadLoading] = useState(false);
    const [leadError, setLeadError] = useState('');

    const loadLead = async () => {
        if (!quoteInput.leadId || !quoteInput.leadId.trim()) return;
        setLeadLoading(true);
        setLeadError('');
        try {
            const resp = await fetch(`http://localhost:5001/api/lead/${quoteInput.leadId.trim()}`);
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Error al cargar lead');
            setQuoteInput(prev => ({
                ...prev,
                customerName: data.customerName || '',
                customerPhone: data.customerPhone || '',
                adults: data.adults || 1,
                children: data.children || 0,
                pets: data.pets || 0,
                checkIn: data.checkIn || '',
                checkOut: data.checkOut || '',
            }));
        } catch (err) {
            setLeadError(err.message);
        } finally {
            setLeadLoading(false);
        }
    };

    const generateQuotePDF = () => {
        if (!quoteResult) return;
        
        const element = document.getElementById('pdf-export-container');

        // Mostramos el elemento por un instante si estuviera oculto y capturamos
        setTimeout(() => {
            html2canvas(element, { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                windowWidth: 900
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Cotizacion_${quoteResult.leadId || 'S_N'}_${new Date().getTime()}.pdf`);

            }).catch(err => {
                console.error("Error al generar PDF:", err);
            });
        }, 300); // 300ms delay to ensure rendering is complete
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2><span role="img" aria-label="calc">📊</span> Cotización</h2>
                <div className="status-badge" style={{
                    background: intelligentMode ? 'var(--secondary)' : 'var(--glass)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                }} onClick={() => setIntelligentMode(!intelligentMode)}>
                    {intelligentMode ? 'Modo Inteligente ON' : 'Modo Manual'}
                </div>
            </div>

            <form onSubmit={handleCalculate}>
                {!intelligentMode && (
                    <div className="form-group">
                        <label>Seleccionar Tarifa Base</label>
                        <select
                            value={activeRate?.id || ''}
                            onChange={(e) => setActiveRate(rates.find(r => r.id === parseInt(e.target.value)))}
                        >
                            <option value="" disabled>Selecciona una tarifa...</option>
                            {rates.filter(r => r.is_active).map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.name} ({r.room_type} - {r.plan_type})
                                </option>
                            ))}
                        </select>
                        {rates.filter(r => r.is_active).length === 0 && <p style={{ fontSize: '0.8rem', color: '#ef4444' }}>No hay tarifas activas disponibles.</p>}
                    </div>
                )}

                {/* ── Kommo CRM Lead Import ── */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: '0.6rem',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem'
                }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#a5b4fc', marginBottom: '0.5rem' }}>
                        🔗 Cargar desde Kommo CRM
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="ID del Lead (ej: 18404150)"
                            value={quoteInput.leadId || ''}
                            onChange={e => setQuoteInput({ ...quoteInput, leadId: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && loadLead()}
                            style={{ flex: 1, margin: 0 }}
                        />
                        <button
                            type="button"
                            onClick={loadLead}
                            disabled={leadLoading}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                padding: '0 1rem',
                                fontSize: '0.85rem',
                                width: 'auto',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {leadLoading ? '⏳ Cargando...' : 'Cargar Lead'}
                        </button>
                    </div>
                    {leadError && <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.4rem', marginBottom: 0 }}>{leadError}</p>}
                </div>

                <div className="form-section-title" style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    Detalles de la Estadía
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Adultos</label>
                        <input type="number" min="1" value={quoteInput.adults} onChange={(e) => setQuoteInput({ ...quoteInput, adults: parseInt(e.target.value) })} />
                    </div>
                    <div className="form-group">
                        <label>Niños</label>
                        <input type="number" min="0" value={quoteInput.children} onChange={(e) => setQuoteInput({ ...quoteInput, children: parseInt(e.target.value) })} />
                    </div>
                </div>
                <div className="form-group">
                    <label>Mascotas</label>
                    <input type="number" min="0" value={quoteInput.pets} onChange={(e) => setQuoteInput({ ...quoteInput, pets: parseInt(e.target.value) })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label>Entrada</label>
                        <input type="date" value={quoteInput.checkIn} onChange={(e) => setQuoteInput({ ...quoteInput, checkIn: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Salida</label>
                        <input type="date" value={quoteInput.checkOut} onChange={(e) => setQuoteInput({ ...quoteInput, checkOut: e.target.value })} />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ background: 'var(--glass)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            style={{ width: 'auto' }}
                            checked={quoteInput.applyDiscount}
                            onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (isChecked) {
                                    const user = prompt("Usuario:");
                                    const pass = prompt("Contraseña:");
                                    if (user === 'admin' && pass === '123') {
                                        setQuoteInput({ ...quoteInput, applyDiscount: true });
                                    } else {
                                        alert("Acceso denegado");
                                    }
                                } else {
                                    setQuoteInput({ ...quoteInput, applyDiscount: false });
                                }
                            }}
                        />
                        <label style={{ marginBottom: 0, cursor: 'pointer' }}>Aplicar Descuento</label>
                    </div>
                    {quoteInput.applyDiscount && (
                        <div className="form-group">
                            <label>Porcentaje (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={quoteInput.discountPercentage}
                                onChange={(e) => setQuoteInput({ ...quoteInput, discountPercentage: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    )}
                </div>

                <div style={{ background: 'var(--glass)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--primary)' }}>
                    <div className="form-section-title" style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        Datos del Cliente
                    </div>
                    <div className="form-group">
                        <label>Nombre Completo</label>
                        <input
                            type="text"
                            placeholder="Ej: Juan Pérez"
                            value={quoteInput.customerName || ''}
                            onChange={(e) => setQuoteInput({ ...quoteInput, customerName: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Cédula o RIF</label>
                            <input
                                type="text"
                                placeholder="V-12345678"
                                value={quoteInput.customerId || ''}
                                onChange={(e) => setQuoteInput({ ...quoteInput, customerId: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="text"
                                placeholder="+58 412..."
                                value={quoteInput.customerPhone || ''}
                                onChange={(e) => setQuoteInput({ ...quoteInput, customerPhone: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <button type="submit">Generar Oferta</button>
            </form>

            {error && <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}

            {quoteResult && (
                <div className="quote-result">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass)', paddingBottom: '0.5rem' }}>
                        Resumen de Cotización: {quoteResult.rateName}
                    </h3>

                    <div style={{ background: 'var(--glass)', padding: '0.8rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>Cliente: <strong>{quoteResult.customerName || 'N/A'}</strong></div>
                            <div>C.I/RIF: <strong>{quoteResult.customerId || 'N/A'}</strong></div>
                            <div>Teléfono: <strong>{quoteResult.customerPhone || 'N/A'}</strong></div>
                            <div>Noches: <strong>{quoteResult.nights}</strong></div>
                        </div>
                        <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                            <span>Tipo de Habitación: <strong style={{ color: 'var(--primary)' }}>{rates.find(r => r.name === quoteResult.rateName)?.room_type}</strong></span>
                            <span>Tipo de Plan: <strong style={{ color: 'var(--secondary)' }}>{rates.find(r => r.name === quoteResult.rateName)?.plan_type}</strong></span>
                        </div>
                    </div>

                    {quoteResult.applyDiscount ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', opacity: 0.8 }}>
                                <span>Subtotal ({quoteResult.nights} noches):</span>
                                <span>${quoteResult.total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#10b981' }}>
                                <span>Descuento ({quoteResult.discountPercentage}%):</span>
                                <span>-${quoteResult.discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="total" style={{ marginTop: '0.5rem' }}>${quoteResult.finalTotal.toFixed(2)}</div>
                        </>
                    ) : (
                        <>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem' }}>Total por {quoteResult.nights} noches</p>
                            <div className="total">${quoteResult.total.toFixed(2)}</div>
                        </>
                    )}
                    <div style={{ fontSize: '0.85rem', marginTop: '1rem', borderTop: '1px solid var(--glass)', paddingTop: '0.5rem' }}>
                        <strong>Distribución:</strong> {quoteResult.rooms.length} habitación(es)
                        {quoteResult.rooms.map((room, i) => (
                            <div key={i} style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.4rem', padding: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                    <span>Hab {i + 1}: {room.adults}A, {room.children}N{room.pets > 0 ? `, ${room.pets}M` : ''}</span>
                                    <span style={{ color: 'var(--primary)' }}>${(room.cost * quoteResult.nights).toFixed(2)}</span>
                                </div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.75, marginTop: '0.25rem', paddingLeft: '0.5rem' }}>
                                    <div>Adultos: {room.adults} × ${(room.adultPricePerPerson || 0).toFixed(2)} = ${(room.adultTotal || 0).toFixed(2)}</div>
                                    {room.children > 0 && (
                                        <div>
                                            Niños: {room.children}
                                            {room.freeChild ? (
                                                <span style={{ color: '#10b981' }}> (1 gratis) → {room.billableChildren} cobrado(s) × ${(room.adultPricePerPerson > 0 ? (room.childTotal / (room.billableChildren || 1)) : 0).toFixed(2)}</span>
                                            ) : (
                                                <span> × ${(room.children > 0 ? (room.childTotal / (room.children || 1)) : 0).toFixed(2)} = ${(room.childTotal || 0).toFixed(2)}</span>
                                            )}
                                        </div>
                                    )}
                                    {room.pets > 0 && (
                                        <div>Mascotas: {room.pets} × ${((room.petTotal || 0) / (room.pets || 1)).toFixed(2)} = ${(room.petTotal || 0).toFixed(2)}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={generateQuotePDF}
                        style={{
                            width: '100%',
                            marginTop: '1.2rem',
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            fontWeight: 'bold',
                            border: '1px solid var(--primary)',
                            padding: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <span role="img" aria-label="pdf">📄</span> Descargar Cotización PDF
                    </button>
                </div>
            )}

            {/* Contenedor Oculto para Generación de PDF */}
            {quoteResult && (
                <div style={{ position: 'absolute', top: 0, left: 0, zIndex: -9999, opacity: 0.01, pointerEvents: 'none' }}>
                    <div id="pdf-export-container" style={{ 
                        width: '900px', 
                        fontFamily: 'Arial, Helvetica, sans-serif', 
                        background: 'white',
                        color: 'black',
                        padding: '30px', 
                        boxSizing: 'border-box' 
                    }}>
                        
                        <div style={{ textAlign: 'center', padding: '20px 0 10px 0' }}>
                            <img src="/Margarita.png" alt="Logo" style={{ width: '130px', margin: 'auto' }} />
                        </div>

                        <div style={{ background: '#2f5597', color: 'white', textAlign: 'center', fontWeight: 'bold', padding: '10px', letterSpacing: '1px' }}>
                            COTIZACIÓN
                        </div>

                        <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
                            <div style={{ width: '65%', padding: '10px', fontSize: '13px', textAlign: 'left' }}>
                                <b>Cliente:</b> {quoteResult.customerName || 'PARTICULAR'}<br />
                                <b>C.I/RIF:</b> {quoteResult.customerId || 'N/A'}<br />
                                <b>Teléfono:</b> {quoteResult.customerPhone || 'N/A'}<br />
                                <b>Fecha elaboración:</b> {new Date().toLocaleDateString('es-VE')}
                            </div>
                            <div style={{ width: '35%', borderLeft: '1px solid #ccc' }}>
                                <div style={{ background: '#d9e1f2', padding: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}>HUESPED PRINCIPAL:</div>
                                <div style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{quoteResult.customerName || 'N/A'}</div>
                            </div>
                        </div>

                        <div style={{ background: '#d9e1f2', textAlign: 'center', fontSize: '12px', padding: '6px', margin: '15px 0' }}>
                            <b>PLAN:</b> {quoteResult.rateName} - {rates.find(r => r.name === quoteResult.rateName)?.plan_type || ''}
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '15px' }}>
                            <thead>
                                <tr>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>IN</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>OUT</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>PLAN</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>CATEGORIA</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>CANT</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>TIPO DE HABITACIÓN</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>NOCHES</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>ADL</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>TARIFA</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>CHD</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>TARIFA</th>
                                    <th style={{ background: '#2f5597', color: 'white', padding: '6px', border: '1px solid #ccc' }}>TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quoteResult.rooms.map((room, index) => (
                                    <tr key={index}>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{quoteInput.checkIn || '-'}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{quoteInput.checkOut || '-'}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{rates.find(r => r.name === quoteResult.rateName)?.plan_type || '-'}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{rates.find(r => r.name === quoteResult.rateName)?.room_type || '-'}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>1</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Hab {index + 1}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{quoteResult.nights}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{room.adults}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>${room.adultPricePerPerson !== undefined ? room.adultPricePerPerson.toFixed(2) : ((room.adultTotal || 0)/room.adults).toFixed(2)}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>{room.children}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>${room.children > 0 ? ((room.childTotal || 0)/ (room.billableChildren || room.children)).toFixed(2) : '0.00'}</td>
                                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>${(room.cost * quoteResult.nights).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {quoteResult.pets > 0 && (
                                    <tr>
                                        <td colSpan="8" style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>Mascotas ({quoteResult.pets})</td>
                                        <td colSpan="4" style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>${(quoteResult.pets * (rates.find(r => r.name === quoteResult.rateName)?.pet_price || 0) * quoteResult.nights).toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {quoteResult.applyDiscount && (
                            <div style={{ textAlign: 'right', padding: '10px', color: '#10b981', fontWeight: 'bold' }}>
                                Descuento ({quoteResult.discountPercentage}%): -${quoteResult.discountAmount.toFixed(2)}
                            </div>
                        )}

                        <div style={{ textAlign: 'right', fontWeight: 'bold', padding: '10px', fontSize: '14px' }}>
                            TOTAL A PAGAR &nbsp;&nbsp; ${quoteResult.applyDiscount ? quoteResult.finalTotal.toFixed(2) : quoteResult.total.toFixed(2)}
                        </div>

                        <div style={{ fontSize: '11px', padding: '10px', marginBottom: '15px' }}>
                            NOTA: Todos los pagos efectuados en moneda diferente a la de curso legal debe contemplar el 3% adicional del impuesto a las grandes transacciones financieras (IGTF).
                        </div>

                        <div style={{ background: '#2f5597', color: 'white', textAlign: 'center', padding: '6px', fontSize: '12px', letterSpacing: '2px', marginBottom: '10px' }}>
                            CONDICIONES GENERALES
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '200px auto', fontSize: '12px', lineHeight: '1.4' }}>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Tarifas</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Neto</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Pagos</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>El huésped deberá efectuar el monto total de la reserva antes de la llegada de los clientes sin excepción.</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Vigencia de tarifas</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Precios sujetos a cambios sin previo aviso.</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Políticas de niños</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>-</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Check IN</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Ingreso al hotel 15:00 hrs (03:00 pm)</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Check OUT</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Salida del hotel 13:00 hrs (01:00 pm)</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Early Check IN</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Servicio adicional, se cobrará el 50% de la tarifa DBL por persona.</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Late Check OUT</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Servicio adicional, se cobrará el 50% de la tarifa DBL por persona.</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Reembolsos</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>No se realizan reembolsos.</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Requerimiento Especial</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Toda solicitud especial debe ser informada al momento de la reserva.</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Sugerencia de clientes</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Las sugerencias o quejas deben notificarse por escrito durante la estadía.</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Sugerencia del hotel</div><div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>En días de mayor ocupación el horario de check in puede sufrir demoras.</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Ambiente libre de humo de tabaco</div>
                            <div style={{ background: '#fde9d9', padding: '10px', fontSize: '12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Queda terminantemente prohibido fumar dentro de las areas internas del hotel y habitaciones, en caso contrario, se realizara un cargo de $90 por concepto de limpieza profunda.</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>Deposito de Garantía</div>
                            <div style={{ background: '#fde9d9', padding: '10px', fontSize: '12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Al hacer el check-in, el hotel solicita 50$ unicamente en efectivo como garantía por toallas de piscina, control de Tv y control de aire acondicionado, cilindro para la caja de seguridad. Esta cantidad se devolverá al huésped al momento de realizar el check-out, siempre y cuando no se hayan incurrido en gastos extras.</div>
                            <div style={{ color: '#2f5597', fontWeight: 'bold', borderBottom: '1px solid #ddd', padding: '8px' }}>NO Show</div>
                            <div style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Las anulaciones o cambios de fechas en las reservas deberán ser gestionadas con 72 horas de antelación en temporada baja y 15 días de antelación en temporada alta para ser efectivas, de lo contrario se cobrará el total de la reservación.</div>
                        </div>

                        <div style={{ background: '#2f5597', color: 'white', textAlign: 'center', padding: '12px', fontSize: '12px', marginTop: '15px' }}>
                            @margaritavillage &nbsp; | &nbsp; Campotel CA Rif J-31755793-0
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotePage;
