import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import '../../styles/admin.css';

const TABS = ['Dashboard', 'Accounts', 'Studios', 'Profiles', 'Permissions'];
const PAGE_SIZE = 8;

function maskValue(value) {
  if (!value) return '—';
  return `•••• ${String(value).slice(-4)}`;
}

function ConfirmationModal({ open, title, description, confirmLabel = 'Confirm', onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        <p className="admin-subtle">{description}</p>
        <div className="admin-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="admin-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function CreateModal({ open, title, fields, values, onChange, onCancel, onSubmit }) {
  if (!open) return null;
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <form className="admin-modal" onSubmit={onSubmit}>
        <h3>{title}</h3>
        <div className="admin-form-grid">
          {fields.map((field) => (
            <label key={field.name} className={field.full ? 'full' : ''}>
              <span className="admin-subtle">{field.label}</span>
              {field.type === 'select' ? (
                <select
                  name={field.name}
                  value={values[field.name] || ''}
                  onChange={onChange}
                  required={field.required}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.name}
                  value={values[field.name] || ''}
                  onChange={onChange}
                  required={field.required}
                  type={field.type || 'text'}
                />
              )}
            </label>
          ))}
        </div>
        <div className="admin-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="admin-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="admin-btn admin-btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

// ─── Edit Studio Modal ────────────────────────────────────────────────────────
function EditStudioModal({ studio, accounts, onSave, onClose }) {
  const [form, setForm] = useState({
    name: studio.name || '',
    pricePerHour: studio.pricePerHour || 75,
    city: studio.city || '',
    state: studio.state || '',
    featured: !!studio.featured,
    verified: !!studio.verified,
    ownerAccountId: studio.owner?.id || studio.ownerId || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  const setCheck = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.checked }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateStudio(studio.id, {
        name: form.name,
        pricePerHour: Number(form.pricePerHour),
        city: form.city || undefined,
        state: form.state || undefined,
        featured: form.featured,
        verified: form.verified,
        ownerAccountId: form.ownerAccountId ? Number(form.ownerAccountId) : undefined,
      });
      onSave(updated);
    } catch (err) {
      setError(err.message || 'Save failed.');
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <form className="admin-modal" onSubmit={handleSubmit} style={{ maxWidth: 580 }}>
        <h3 style={{ marginTop: 0 }}>Edit Studio</h3>
        <div className="admin-form-grid">
          <label className="full">
            <span className="admin-subtle">Studio name *</span>
            <input value={form.name} onChange={set('name')} required />
          </label>
          <label>
            <span className="admin-subtle">Price per hour ($)</span>
            <input type="number" min="0" value={form.pricePerHour} onChange={set('pricePerHour')} />
          </label>
          <label>
            <span className="admin-subtle">Owner account ID</span>
            <input
              value={form.ownerAccountId}
              onChange={set('ownerAccountId')}
              placeholder="Leave blank to keep current owner"
              list="admin-accounts-list"
            />
            {accounts.length > 0 ? (
              <datalist id="admin-accounts-list">
                {accounts.filter((a) => a.role === 'OWNER' || a.role === 'owner').map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                ))}
              </datalist>
            ) : null}
          </label>
          <label>
            <span className="admin-subtle">City</span>
            <input value={form.city} onChange={set('city')} placeholder="Atlanta" />
          </label>
          <label>
            <span className="admin-subtle">State</span>
            <input value={form.state} onChange={set('state')} placeholder="GA" maxLength={4} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.featured} onChange={setCheck('featured')} />
            <span>Featured</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.verified} onChange={setCheck('verified')} />
            <span>Verified</span>
          </label>
        </div>
        {error ? <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: '0.5rem 0 0' }}>{error}</p> : null}
        <div className="admin-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="admin-btn" onClick={onClose}>Cancel</button>
          <a
            href={`/studios/${studio.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn"
            style={{ textDecoration: 'none' }}
          >
            View public profile ↗
          </a>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminPanel() {
  const { currentUser, showToast } = useAppContext();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [accounts, setAccounts] = useState([]);
  const [studios, setStudios] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [recentSignups, setRecentSignups] = useState([]);
  const [pendingOnboarding, setPendingOnboarding] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [revealMap, setRevealMap] = useState({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [createType, setCreateType] = useState('');
  const [formValues, setFormValues] = useState({});
  const [editStudio, setEditStudio] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 2200);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      adminApi.listAccounts().catch(() => []),
      adminApi.listStudios().catch(() => []),
      adminApi.listProfiles().catch(() => []),
      adminApi.listPermissions().catch(() => []),
      adminApi.dashboardSummary().catch(() => ({ recentSignups: [], pendingOnboarding: [] })),
    ]).then(([accountsData, studiosData, profilesData, permissionsData, summary]) => {
      if (!mounted) return;
      setAccounts(accountsData.accounts || accountsData || []);
      setStudios(studiosData.studios || studiosData || []);
      setProfiles(profilesData.profiles || profilesData || []);
      setPermissions(permissionsData.permissions || permissionsData || []);
      setRecentSignups(summary.recentSignups || []);
      setPendingOnboarding(summary.pendingOnboarding || []);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const normalized = useMemo(() => {
    const source = activeTab === 'Studios' ? studios : activeTab === 'Profiles' ? profiles : accounts;
    const filtered = source.filter((row) => {
      const text = JSON.stringify(row).toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || String(row.status || '').toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered;
  }, [activeTab, accounts, studios, profiles, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(normalized.length / PAGE_SIZE));
  const pagedRows = normalized.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const ownerStudioMap = useMemo(() => {
    const map = new Map();
    studios.forEach((studio) => {
      const ownerId = Number(studio.owner?.id || studio.ownerId);
      if (ownerId) map.set(ownerId, studio);
    });
    return map;
  }, [studios]);

  const ownerProfileSet = useMemo(() => {
    const set = new Set();
    profiles.forEach((profile) => {
      const accountId = Number(profile.accountId);
      if (accountId) set.add(accountId);
    });
    return set;
  }, [profiles]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, statusFilter]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const stats = {
    totalAccounts: accounts.length,
    totalStudios: studios.length,
    totalProfiles: profiles.length,
    recentSignups: recentSignups.length,
    pendingOnboarding: pendingOnboarding.length,
  };

  const accountFields = [
    { name: 'name', label: 'Full name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'role', label: 'Role', type: 'select', required: true, options: [
      { value: 'client', label: 'Client' },
      { value: 'owner', label: 'Studio Owner' },
      { value: 'admin', label: 'Admin' },
    ] },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'SUSPENDED', label: 'Suspended' },
    ] },
  ];

  const studioFields = [
    { name: 'name', label: 'Studio name', required: true },
    { name: 'ownerAccountId', label: 'Owner account ID', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'SUSPENDED', label: 'Suspended' },
    ] },
  ];

  const profileFields = [
    { name: 'displayName', label: 'Profile name', required: true },
    { name: 'studioId', label: 'Studio ID', required: true },
    { name: 'accountId', label: 'Account ID', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'SUSPENDED', label: 'Suspended' },
    ] },
  ];

  const createConfig = {
    account: { title: 'Manual account onboarding', fields: accountFields },
    studio: { title: 'Add studio', fields: studioFields },
    profile: { title: 'Add profile', fields: profileFields },
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      if (createType === 'account') {
        const created = await adminApi.createAccount(formValues);
        setAccounts((prev) => [created, ...prev]);
      }
      if (createType === 'studio') {
        const created = await adminApi.createStudio(formValues);
        setStudios((prev) => [created, ...prev]);
      }
      if (createType === 'profile') {
        const created = await adminApi.createProfile(formValues);
        setProfiles((prev) => [created, ...prev]);
      }
      setToast('Created successfully.');
      showToast('Created successfully.');
      setCreateType('');
      setFormValues({});
    } catch (error) {
      setToast(error.message || 'Could not create record.');
    }
  };

  const handleAccountAction = (action, account) => {
    const titleMap = {
      suspend: `Suspend ${account.name}?`,
      reactivate: `Reactivate ${account.name}?`,
      delete: `Delete ${account.name}?`,
      reset: `Reset password for ${account.name}?`,
      revoke: `Revoke all sessions for ${account.name}?`,
    };

    setConfirmAction({
      title: titleMap[action],
      description: 'This action requires secondary confirmation and is audit logged.',
      callback: async () => {
        if (action === 'suspend') {
          const updated = await adminApi.updateAccount(account.id, { status: 'SUSPENDED' });
          setAccounts((prev) => prev.map((item) => (item.id === account.id ? updated : item)));
        }
        if (action === 'reactivate') {
          const updated = await adminApi.updateAccount(account.id, { status: 'ACTIVE' });
          setAccounts((prev) => prev.map((item) => (item.id === account.id ? updated : item)));
        }
        if (action === 'delete') {
          await adminApi.deleteAccount(account.id);
          setAccounts((prev) => prev.filter((item) => item.id !== account.id));
        }
        if (action === 'reset') {
          await adminApi.resetAccountPassword(account.id);
        }
        if (action === 'revoke') {
          await adminApi.revokeAccountSessions(account.id);
        }
        setToast('Action completed.');
      },
    });
  };

  const handleEnableOwnerProfile = async (account) => {
    try {
      const result = await adminApi.enableOwnerProfile(account.id);
      const updatedAccount = { ...account, role: 'OWNER', _count: { ...(account._count || {}), studios: 1 } };
      setAccounts((prev) => prev.map((item) => (item.id === account.id ? updatedAccount : item)));
      if (result?.studio) {
        setStudios((prev) => {
          const exists = prev.some((s) => s.id === result.studio.id);
          return exists ? prev : [result.studio, ...prev];
        });
      }
      setToast('Owner profile enabled.');
      showToast('Owner profile enabled.');
    } catch (error) {
      setToast(error.message || 'Could not enable owner profile.');
    }
  };

  const handleStudioDelete = (studio) => {
    setConfirmAction({
      title: `Delete studio ${studio.name}?`,
      description: 'Studio deletion is destructive and cannot be undone.',
      callback: async () => {
        await adminApi.deleteStudio(studio.id);
        setStudios((prev) => prev.filter((item) => item.id !== studio.id));
        setToast('Studio deleted.');
      },
    });
  };

  const handleProfileDelete = (profile) => {
    setConfirmAction({
      title: `Delete profile ${profile.displayName || profile.name}?`,
      description: 'Profile deletion requires confirmation and writes to admin logs.',
      callback: async () => {
        await adminApi.deleteProfile(profile.id);
        setProfiles((prev) => prev.filter((item) => item.id !== profile.id));
        setToast('Profile deleted.');
      },
    });
  };

  const handleEnableOwnerProfile = (account) => {
    const role = String(account.role || '').toLowerCase();
    const accountId = Number(account.id);
    const ownerReady = role === 'owner' && ownerStudioMap.has(accountId) && ownerProfileSet.has(accountId);

    if (ownerReady) {
      setToast('Owner profile is already enabled for this account.');
      return;
    }

    setConfirmAction({
      title: `Enable owner profile for ${account.name}?`,
      description: 'This can upgrade the role to Owner, create a studio, and create an initial profile setup record.',
      callback: async () => {
        let updatedAccount = account;
        if (role !== 'owner') {
          updatedAccount = await adminApi.updateAccount(account.id, { role: 'owner' });
          setAccounts((prev) => prev.map((item) => (item.id === account.id ? updatedAccount : item)));
        }

        let ownerStudio = ownerStudioMap.get(accountId);
        if (!ownerStudio) {
          ownerStudio = await adminApi.createStudio({
            name: `${account.name || 'New'} Studio`,
            ownerAccountId: account.id,
            status: 'ACTIVE',
          });
          setStudios((prev) => [ownerStudio, ...prev]);
        }

        if (!ownerProfileSet.has(accountId)) {
          const createdProfile = await adminApi.createProfile({
            displayName: ownerStudio.name || `${account.name || 'New'} Studio`,
            studioId: ownerStudio.id,
            accountId: account.id,
            status: 'ACTIVE',
          });
          setProfiles((prev) => [createdProfile, ...prev]);
        }

        const message = 'Owner profile enabled. They can now sign in and start profile setup.';
        setToast(message);
        showToast(message);
      },
    });
  };

  const renderDashboard = () => (
    <>
      <div className="admin-grid-stats">
        <div className="admin-stat"><strong>{stats.totalAccounts}</strong><span className="admin-subtle">Total accounts</span></div>
        <div className="admin-stat"><strong>{stats.totalStudios}</strong><span className="admin-subtle">Total studios</span></div>
        <div className="admin-stat"><strong>{stats.totalProfiles}</strong><span className="admin-subtle">Total profiles</span></div>
        <div className="admin-stat"><strong>{stats.recentSignups}</strong><span className="admin-subtle">Recent signups</span></div>
        <div className="admin-stat"><strong>{stats.pendingOnboarding}</strong><span className="admin-subtle">Pending onboarding</span></div>
      </div>

      <div className="admin-panel">
        <h3>Recent signups</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Signup date</th><th>Status</th></tr></thead>
            <tbody>
              {recentSignups.map((item) => (
                <tr key={item.id}><td>{item.name}</td><td>{item.email}</td><td>{item.signupDate}</td><td>{item.status}</td></tr>
              ))}
              {recentSignups.length === 0 ? <tr><td colSpan={4}>No recent signups.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderAccounts = () => (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <input placeholder="Search accounts" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING">Pending</option>
        </select>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => setCreateType('account')}>+ Manual onboard</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Contact</th><th>Payment</th><th>Tax ID</th><th>Status</th><th>Signup</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((account) => {
              const accountId = Number(account.id);
              const role = String(account.role || '').toLowerCase();
              const ownerReady = role === 'owner' && ownerStudioMap.has(accountId) && ownerProfileSet.has(accountId);

              return (
              <tr key={account.id}>
                <td>{account.name}<div className="admin-subtle">{account.role}</div></td>
                <td>{account.email}<div className="admin-subtle">{account.phone || '—'}</div></td>
                <td>
                  {revealMap[`card-${account.id}`] ? account.cardOnFile || 'No card' : maskValue(account.cardOnFile)}
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setRevealMap((prev) => ({ ...prev, [`card-${account.id}`]: !prev[`card-${account.id}`] }))}
                    style={{ marginLeft: '0.35rem' }}
                  >
                    {revealMap[`card-${account.id}`] ? 'Mask' : 'Reveal'}
                  </button>
                  <div className="admin-subtle">Billing history: {account.billingHistoryCount || 0}</div>
                </td>
                <td>
                  {revealMap[`tax-${account.id}`] ? account.taxId || '—' : maskValue(account.taxId)}
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setRevealMap((prev) => ({ ...prev, [`tax-${account.id}`]: !prev[`tax-${account.id}`] }))}
                    style={{ marginLeft: '0.35rem' }}
                  >
                    {revealMap[`tax-${account.id}`] ? 'Mask' : 'Reveal'}
                  </button>
                </td>
                <td>{account.status}</td>
                <td>{account.signupDate || account.createdAt}</td>
                <td>
                  <div className="admin-actions">
                    {account.role?.toLowerCase() !== 'admin' && (account._count?.studios || 0) === 0 ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={() => handleEnableOwnerProfile(account)}
                      >
                        Enable owner profile
                      </button>
                    ) : null}
                    {account.status === 'ACTIVE' ? (
                      <button type="button" className="admin-btn" onClick={() => handleAccountAction('suspend', account)}>Suspend</button>
                    ) : (
                      <button type="button" className="admin-btn" onClick={() => handleAccountAction('reactivate', account)}>Reactivate</button>
                    )}
                    <button type="button" className="admin-btn" onClick={() => handleAccountAction('reset', account)}>Reset pw</button>
                    <button type="button" className="admin-btn" onClick={() => handleAccountAction('revoke', account)}>Revoke sessions</button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={() => handleEnableOwnerProfile(account)}
                      disabled={ownerReady}
                      title={ownerReady ? 'Owner profile already configured' : 'Enable owner role + profile setup'}
                    >
                      {ownerReady ? 'Profile ready' : 'Enable owner profile'}
                    </button>
                    <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleAccountAction('delete', account)}>Delete</button>
                  </div>
                </td>
              </tr>
              );
            })}
            {pagedRows.length === 0 ? <tr><td colSpan={7}>No accounts match this filter.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="admin-pager">
        <button type="button" className="admin-btn" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Prev</button>
        <span className="admin-subtle">Page {page} / {totalPages}</span>
        <button type="button" className="admin-btn" disabled={page >= totalPages} onClick={() => setPage((v) => v + 1)}>Next</button>
      </div>
    </div>
  );

  const renderStudios = () => (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <input placeholder="Search studios" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => setCreateType('studio')}>+ Add studio</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Studio</th>
              <th>Owner</th>
              <th>Flags</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((studio) => (
              <tr key={studio.id}>
                <td>
                  <strong>{studio.name}</strong>
                  {studio.slug ? (
                    <div className="admin-subtle">/studios/{studio.slug}</div>
                  ) : null}
                </td>
                <td>
                  {studio.owner?.name || '—'}
                  <div className="admin-subtle">{studio.owner?.email}</div>
                </td>
                <td>
                  <div className="admin-actions">
                    {studio.featured ? <span style={{ color: '#f59e0b', fontSize: '0.78rem' }}>★ Featured</span> : null}
                    {studio.verified ? <span style={{ color: '#22c55e', fontSize: '0.78rem' }}>✓ Verified</span> : null}
                    {!studio.featured && !studio.verified ? <span className="admin-subtle">—</span> : null}
                  </div>
                </td>
                <td className="admin-subtle">
                  {studio.createdAt ? new Date(studio.createdAt).toLocaleDateString() : '—'}
                </td>
                <td>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={() => setEditStudio(studio)}
                    >
                      Edit
                    </button>
                    <a
                      href={`/studios/${studio.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      Profile ↗
                    </a>
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      onClick={() => handleStudioDelete(studio)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pagedRows.length === 0 ? <tr><td colSpan={5}>No studios found.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="admin-pager">
        <button type="button" className="admin-btn" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Prev</button>
        <span className="admin-subtle">Page {page} / {totalPages}</span>
        <button type="button" className="admin-btn" disabled={page >= totalPages} onClick={() => setPage((v) => v + 1)}>Next</button>
      </div>
    </div>
  );

  const renderProfiles = () => (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <input placeholder="Search profiles" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING">Pending</option>
        </select>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => setCreateType('profile')}>+ Add profile</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Profile</th><th>Studio</th><th>Account</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {pagedRows.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.displayName || profile.name}</td>
                <td>{profile.studioName || profile.studioId}</td>
                <td>{profile.accountName || profile.accountId}</td>
                <td>{profile.status}</td>
                <td>
                  <div className="admin-actions">
                    <button type="button" className="admin-btn" onClick={() => adminApi.updateProfile(profile.id, { status: profile.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE' }).then((updated) => setProfiles((prev) => prev.map((item) => (item.id === profile.id ? updated : item))))}>Edit</button>
                    <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleProfileDelete(profile)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {pagedRows.length === 0 ? <tr><td colSpan={5}>No profiles found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="admin-panel">
      <h3>Permission matrix</h3>
      <p className="admin-subtle">Grant or revoke studio/profile permissions and set studio admins.</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Account</th><th>Studio</th><th>Profile</th><th>View studio</th><th>Manage studio</th><th>View profile</th><th>Manage profile</th><th>Studio admin</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((item) => (
              <tr key={item.id}>
                <td>{item.accountName}</td>
                <td>{item.studioName}</td>
                <td>{item.profileName}</td>
                {['viewStudio', 'manageStudio', 'viewProfile', 'manageProfile', 'studioAdmin'].map((key) => (
                  <td key={key}>
                    <input
                      type="checkbox"
                      checked={Boolean(item[key])}
                      onChange={async () => {
                        const updated = await adminApi.updatePermission(item.id, { [key]: !item[key] });
                        setPermissions((prev) => prev.map((perm) => (perm.id === item.id ? updated : perm)));
                        setToast('Permission updated.');
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {permissions.length === 0 ? <tr><td colSpan={8}>No permission mappings.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">EFYIA Internal Admin</div>
        <div className="admin-user-pill">
          <strong>{currentUser.name}</strong>
          <div>{currentUser.email}</div>
          <div>Role: SUPER USER ADMIN</div>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          {TABS.map((tab) => (
            <button key={tab} type="button" className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{activeTab}</h1>
            <p className="admin-subtle">Secure admin control plane. Internal use only.</p>
          </div>
          {toast ? <div className="admin-toast">{toast}</div> : null}
        </header>

        {loading ? <div className="admin-panel">Loading admin datasets…</div> : null}
        {!loading && activeTab === 'Dashboard' ? renderDashboard() : null}
        {!loading && activeTab === 'Accounts' ? renderAccounts() : null}
        {!loading && activeTab === 'Studios' ? renderStudios() : null}
        {!loading && activeTab === 'Profiles' ? renderProfiles() : null}
        {!loading && activeTab === 'Permissions' ? renderPermissions() : null}
      </main>

      <ConfirmationModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          try {
            await confirmAction.callback();
          } catch (error) {
            setToast(error.message || 'Action failed.');
          } finally {
            setConfirmAction(null);
          }
        }}
      />

      <CreateModal
        open={Boolean(createType)}
        title={createConfig[createType]?.title}
        fields={createConfig[createType]?.fields || []}
        values={formValues}
        onChange={(event) => setFormValues((prev) => ({ ...prev, [event.target.name]: event.target.value }))}
        onCancel={() => {
          setCreateType('');
          setFormValues({});
        }}
        onSubmit={handleCreate}
      />
    </div>
  );
}
