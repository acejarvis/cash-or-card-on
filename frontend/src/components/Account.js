import React from 'react';
import './Account.css';

const Account = ({ user, onLogout, onBack }) => {
  if (!user) return <div className="account-empty">No user signed in.</div>;

  return (
    <div className="account-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>{user.username || user.email}</h2>
          <div className="account-role">{user.role === 'admin' ? 'Administrator' : 'User'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="button account-close-button" onClick={onBack} aria-label="Close account">Close</button>
          <button className="button" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="account-section">
        <div className="field"><strong>Username:</strong> {user.username}</div>
        <div className="field"><strong>Email:</strong> {user.email}</div>
      </div>
    </div>
  );
};

export default Account;
