import React, { useState } from 'react';
import './Login.css';

const Login = ({ onClose, onLogin, onRegister, showSignUp = false }) => {
  const [isSignUp, setIsSignUp] = useState(showSignUp);
  const [identifier, setIdentifier] = useState(''); // username or email (login) or email (signup)
  const [username, setUsername] = useState(''); // signup only
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        // registration flow
        if (!identifier || !identifier.includes('@')) {
          setError('Please enter a valid email address.');
          return;
        }
        if (!username || username.length < 2) {
          setError('Please provide a username (2+ chars).');
          return;
        }
        if (!password || password.length < 8) {
          setError('Password must be at least 8 characters.');
          return;
        }

        if (!onRegister) {
          setError('Registration is not available.');
          return;
        }

        const result = await onRegister(identifier.trim(), username.trim(), password);
        if (!result || (result.ok === false)) {
          const msg = result && result.message ? result.message : 'Registration failed.';
          setError(msg);
        }
      } else {
        // login flow
        if (!identifier || !identifier.includes('@')) {
          setError('Please enter your email address.');
          return;
        }

        const result = await onLogin(identifier.trim(), password);
        if (!result || (result.ok === false)) {
          const msg = result && result.message ? result.message : 'Invalid email or password.';
          setError(msg);
        }
      }
    } catch (err) {
      setError('Login failed.');
    }
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>X</button>
        <h2>{isSignUp ? 'Sign up' : 'Sign in'}</h2>
        <form onSubmit={submit} className="login-form">
          <label>
            Email
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus />
          </label>
          {isSignUp && (
            <label>
              Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
          )}
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="login-error">{error}</div>}
          <div className="login-actions">
            <button type="submit" className="button">{isSignUp ? 'Create account' : 'Sign in'}</button>
            <button type="button" className="button" onClick={onClose}>Cancel</button>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button type="button" className="chip" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
              {isSignUp ? 'Have an account? Sign in' : 'New user? Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
