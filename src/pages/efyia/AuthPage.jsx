import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const { login, signup } = useAppContext();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const isLogin = mode === 'login';

  const handleSubmit = (event) => {
    event.preventDefault();
    const account = isLogin ? login(form.email) : signup(form);
    navigate(
      account.role === 'admin'
        ? '/dashboard/admin'
        : account.role === 'owner'
          ? '/dashboard/studio'
          : '/dashboard/client',
    );
  };

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-auth-wrap">
        <form className="eyf-card eyf-auth-card eyf-stack" onSubmit={handleSubmit}>
          <div>
            <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <p className="eyf-muted">
              {isLogin ? 'Use any demo login or create a new user persona for the MVP.' : 'Choose a role to preview client and studio-owner flows.'}
            </p>
          </div>
          {isLogin ? (
            <div className="eyf-demo-box">
              <strong>Demo accounts</strong>
              {[
                ['admin@efyia.com', 'Admin'],
                ['owner@studio.com', 'Studio Owner'],
                ['artist@music.com', 'Artist/Client'],
              ].map(([email, label]) => (
                <button key={email} type="button" className="eyf-demo-link" onClick={() => setForm((current) => ({ ...current, email, password: 'any' }))}>
                  {email} ({label})
                </button>
              ))}
            </div>
          ) : null}
          {!isLogin ? (
            <label>
              Name
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
          ) : null}
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </label>
          {!isLogin ? (
            <label>
              Role
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                <option value="client">Artist / Client</option>
                <option value="owner">Studio Owner</option>
              </select>
            </label>
          ) : null}
          <button type="submit" className="eyf-button">{isLogin ? 'Sign in' : 'Create account'}</button>
        </form>
      </section>
    </div>
  );
}
