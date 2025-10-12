import React, { useState } from 'react';
import './Login.css';

const Login = ({ onClose, onLogin, showSignUp }) => {
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const ok = await onLogin(identifier.trim(), password);
      if (!ok) {
        setError('Invalid credentials.');
      }
    } catch (err) {
      setError('Login failed.');
    }
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>X</button>
        <h2>Sign in</h2>
        <form onSubmit={submit} className="login-form">
          <label>
            Username or Email
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="login-error">{error}</div>}
          <div className="login-actions">
            <button type="submit" className="button">Sign in</button>
            <button type="button" className="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
