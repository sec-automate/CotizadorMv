import React, { useState } from 'react';

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const validUsers = [
        { user: 'admin', pass: '123' },
        { user: 'ventas', pass: '123456' },
        { user: 'gerente', pass: '12345678' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        const foundUser = validUsers.find(u => u.user === username && u.pass === password);

        if (foundUser) {
            onLogin(foundUser.user);
        } else {
            setError('Usuario o contraseña incorrectos');
        }
    };

    return (
        <div className="card login-card" style={{ maxWidth: '400px', margin: '4rem auto' }}>
            <h2 style={{ textAlign: 'center' }}>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Usuario</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Introduce tu usuario"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
                <button type="submit">Entrar</button>
            </form>
        </div>
    );
};

export default LoginPage;
