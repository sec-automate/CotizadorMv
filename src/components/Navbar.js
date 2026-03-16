import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="nav-links">
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                    <span role="img" aria-label="calc">📊</span> Cotizar
                </Link>
                {/* Administrar removed as per user request to be manual route only */}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {user ? (
                    <>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Hola, <strong style={{ color: 'var(--white)' }}>{user}</strong>
                        </span>
                        <button
                            onClick={onLogout}
                            style={{
                                width: 'auto',
                                padding: '0.5rem 1rem',
                                marginTop: 0,
                                background: 'var(--glass)',
                                fontSize: '0.8rem'
                            }}
                        >
                            Cerrar Sesión
                        </button>
                    </>
                ) : (
                    <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                        Acceso Admin
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
