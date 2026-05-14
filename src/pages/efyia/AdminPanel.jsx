import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import '../../styles/admin.css';

const TABS = ['Dashboard', 'Accounts', 'Studios', 'Profiles', 'Permissions', 'Revenue', 'Bookings'];
const PAGE_SIZE = 8;
const BOOKINGS_PAGE_SIZE = 20;

function maskValue(value) {
  if (!value) return '—';
  return `•••• ${String(value).slice(-4)}`;
}

function formatCurrency(cents) {
  if (!cents && cents !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

const CONNECT_STATUS_COLOR = {
  ACTIVE: '#22c55e',
  PENDING: '#f59e0b',
  NOT_CONNECTED: '#94a3b8',
};

function ConnectChip({ status }) {
  const color = CONNECT_STATUS_COLOR[status] || '#94a3b8';
  return (
    <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: 9999, background: `${color}22`, color, fontSize: '0.75rem', fontWeight: 600 }}>
      {status || '—'}
    </span>
  );
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
    ownerAccountId: studio.owner?.id || studio.ownerId || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateStudio(studio.id, {
        name: form.name,
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
      <form className="admin-modal" onSubmit={handleSubmit} style={{ maxWidth: 440 }}>
        <h3 style={{ marginTop: 0 }}>Edit Studio</h3>
        <p className="admin-subtle" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
          Prices, location, session types, and services are managed by the studio owner in their profile editor.
        </p>

        <div className="admin-form-grid">
          <label className="full">
            <span className="admin-subtle">Studio name *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </label>
          <label className="full">
            <span className="admin-subtle">Reassign owner</span>
            <input
              value={form.ownerAccountId}
              onChange={(e) => setForm((p) => ({ ...p, ownerAccountId: e.target.value }))}
              placeholder="Account ID -- leave blank to keep current"
              list="admin-owners-list"
            />
            <datalist id="admin-owners-list">
              {accounts
                .filter((a) => String(a.role).toUpperCase() === 'OWNER')
                .map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                ))}
            </datalist>
          </label>
        </div>

        {error ? (
          <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: '0.75rem 0 0' }}>{error}</p>
        ) : null}

        <div className="admin-actions" style={{ marginTop: '1.25rem' }}>
          <button type="button" className="admin-btn" onClick={onClose}>Cancel</button>
          {studio.slug ? (
            <a
              href={`/studios/${studio.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn"
              style={{ textDecoration: 'none' }}
            >
              View profile &#8599;
            </a>
          ) : null}
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
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
  const [dashboardData, setDashboardData] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [accountRoleFilter, setAccountRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');  
  const [page, setPage] = useState(1);
  const [revealMap, setRevealMap] = useState({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [createType, setCreateType] = useState('');
  const [formValues, setFormValues] = useState({});
  const [editStudio, setEditStudio] = useState(null);

  // Revenue tab state
  const [revenueStudios, setRevenueStudios] = useState([]);
  const [revenueLoaded, setRevenueLoaded] = useState(false);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Bookings tab state
  const [bookings, setBookings] = useState([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsPages, setBookingsPages] = useState(1);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [cancelBookingTarget, setCancelBookingTarget] = useState(null);

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
      setDashboardData(summary);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  // Lazy-load Revenue tab
  useEffect(() => {
    if (activeTab !== 'Revenue' || revenueLoaded || revenueLoading) return;
    setRevenueLoading(true);
    adminApi.getStudioRevenue().then((data) => {
      setRevenueStudios(Array.isArray(data) ? data : (data.studios || []));
      setRevenueLoaded(true);
    }).catch(() => {
      setRevenueStudios([]);
      setRevenueLoaded(true);
    }).finally(() => setRevenueLoading(false));
  }, [activeTab, revenueLoaded, revenueLoading]);

  // Lazy-load / re-fetch Bookings tab
  const fetchBookings = useCallback(() => {
    setBookingsLoading(true);
    adminApi.listBookings({
      page: bookingsPage,
      limit: BOOKINGS_PAGE_SIZE,
      status: bookingStatusFilter === 'ALL' ? undefined : bookingStatusFilter,
    }).then((data) => {
      setBookings(data.bookings || data || []);
      setBookingsTotal(data.total || 0);
      setBookingsPages(data.pages || Math.max(1, Math.ceil((data.total || 0) / BOOKINGS_PAGE_SIZE)));
    }).catch(() => {
      setBookings([]);
    }).finally(() => setBookingsLoading(false));
  }, [bookingsPage, bookingStatusFilter]);

  useEffect(() => {
    if (activeTab !== 'Bookings') return;
    fetchBookings();
  }, [activeTab, fetchBookings]);

  const normalized = useMemo(() => {
    const source = activeTab === 'Studios' ? studios : activeTab === 'Profiles' ? profiles : accounts;
    const filtered = source.filter((row) => {
      const text = JSON.stringify(row).toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || String(row.status || '').toUpperCase() === statusFilter;
      const matchesRole = activeTab !== 'Accounts' || accountRoleFilter === 'ALL' || String(row.role || '').toUpperCase() === accountRoleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
    return filtered;
  }, [activeTab, accounts, studios, profiles, search, statusFilter, accountRoleFilter]);

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
  }, [activeTab, search, statusFilter, accountRoleFilter]);

  useEffect(() => {
    setBookingsPage(1);
  }, [bookingStatusFilter]);

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
      { value: 'CLIENT', label: 'Client' },
      { value: 'OWNER', label: 'Studio Owner' },
    ] },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'SUSPENDED', label: 'Suspended' },
    ] },
  ];

  const studioFields = [
    { name: 'name', label: 'Studio name', required: true },
    { name: 'ownerAccountId', label: 'Owner account ID', required: true },
  ];

  const profileFields = [
    { name: 'displayName', label: 'Profile name', required: true },
    { name: 'studioId', label: 'Studio ID', required: true },
    { name: 'accountId', label: 'Account ID', required: true },
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
          updatedAccount = await adminApi.updateAccount(account.id, { role: 'OWNER' });
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

  const handleCancelBooking = (booking) => {
    setCancelBookingTarget(booking);
  };

  const confirmCancelBooking = async () => {
    if (!cancelBookingTarget) return;
    try {
      await adminApi.updateBooking(cancelBookingTarget.id, { status: 'CANCELLED' });
      setBookings((prev) => prev.map((b) => b.id === cancelBookingTarget.id ? { ...b, status: 'CANCELLED' } : b));
      setToast('Booking cancelled.');
    } catch (err) {
      setToast(err.message || 'Could not cancel booking.');
    } finally {
      setCancelBookingTarget(null);
    }
  };

  const renderDashboard = () => {
    const connectBreakdown = dashboardData?.connectStatusBreakdown || [];
    return (
      <>
        <div className="admin-grid-stats">
          <div className="admin-stat"><strong>{stats.totalAccounts}</strong><span className="admin-subtle">Total accounts</span></div>
          <div className="admin-stat"><strong>{stats.totalStudios}</strong><span className="admin-subtle">Total studios</span></div>
          <div className="admin-stat"><strong>{stats.totalProfiles}</strong><span className="admin-subtle">Total profiles</span></div>
          <div className="admin-stat"><strong>{stats.recentSignups}</strong><span className="admin-subtle">Recent signups</span></div>
          <div className="admin-stat"><strong>{stats.pendingOnboarding}</strong><span className="admin-subtle">Pending onboarding</span></div>
        </div>

        <div className="admin-grid-stats" style={{ marginTop: '0.75rem' }}>
          <div className="admin-stat">
            <strong>{dashboardData?.confirmedBookings ?? '—'}</strong>
            <span className="admin-subtle">Confirmed bookings</span>
          </div>
          <div className="admin-stat">
            <strong>{dashboardData?.completedBookings ?? '—'}</strong>
            <span className="admin-subtle">Completed bookings</span>
          </div>
          <div className="admin-stat">
            <strong>{dashboardData?.newBookingsThisWeek ?? '—'}</strong>
            <span className="admin-subtle">New this week</span>
          </div>
          <div className="admin-stat">
            <strong>{formatCurrency(dashboardData?.totalPlatformFee)}</strong>
            <span className="admin-subtle">Platform fee (all-time)</span>
          </div>
          <div className="admin-stat">
            <strong>{formatCurrency(dashboardData?.platformFeeLastThirtyDays)}</strong>
            <span className="admin-subtle">Platform fee (30 days)</span>
          </div>
        </div>

        {connectBreakdown.length > 0 ? (
          <div className="admin-panel" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="admin-subtle" style={{ marginRight: '0.5rem' }}>Stripe Connect:</span>
            {connectBreakdown.map((entry) => (
              <span key={entry.stripeConnectStatus} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <ConnectChip status={entry.stripeConnectStatus} />
                <span className="admin-subtle">{entry._count?.stripeConnectStatus ?? entry.count}</span>
              </span>
            ))}
          </div>
        ) : null}

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
  };

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
        <select value={accountRoleFilter} onChange={(e) => setAccountRoleFilter(e.target.value)}>
          <option value="ALL">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="OWNER">Owner</option>
          <option value="CLIENT">Client</option>
        </select>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => setCreateType('account')}>+ Manual onboard</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Contact</th><th>Payment</th><th>Tax ID</th><th>Status</th><th>Signup</th><th>Bookings</th><th>Actions</th>
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
                <td className="admin-subtle">{account._count?.bookings ?? '—'}</td>
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
                    <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleAccountAction('delete', account)}>Delete</button>
                  </div>
                </td>
              </tr>
              );
            })}
            {pagedRows.length === 0 ? <tr><td colSpan={8}>No accounts match this filter.</td></tr> : null}
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
          <thead><tr><th>Profile</th><th>Studio</th><th>Account</th><th>Complete</th><th>Flags</th><th>Actions</th></tr></thead>
          <tbody>
            {pagedRows.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.displayName || profile.name}</td>
                <td>{profile.studioName || profile.studioId}</td>
                <td>{profile.accountName || profile.accountId}</td>
                <td>{profile.completion != null ? `${profile.completion}%` : '—'}</td>
                <td>
                  <div className="admin-actions">
                    {profile.featured ? <span style={{ color: '#f59e0b', fontSize: '0.78rem' }}>★ Featured</span> : null}
                    {profile.verified ? <span style={{ color: '#22c55e', fontSize: '0.78rem' }}>✓ Verified</span> : null}
                    {!profile.featured && !profile.verified ? <span className="admin-subtle">—</span> : null}
                  </div>
                </td>
                <td>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() =>
                        adminApi.updateProfile(profile.id, { featured: !profile.featured }).then((updated) =>
                          setProfiles((prev) => prev.map((item) => (item.id === profile.id ? updated : item))),
                        )
                      }
                    >
                      {profile.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() =>
                        adminApi.updateProfile(profile.id, { verified: !profile.verified }).then((updated) =>
                          setProfiles((prev) => prev.map((item) => (item.id === profile.id ? updated : item))),
                        )
                      }
                    >
                      {profile.verified ? 'Unverify' : 'Verify'}
                    </button>
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

  const renderRevenue = () => (
    <div className="admin-panel">
      <h3>Studio revenue</h3>
      <p className="admin-subtle">Per-studio booking totals from completed transactions, sorted by revenue.</p>
      {revenueLoading ? <p className="admin-subtle">Loading...</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Studio</th>
                <th>Owner</th>
                <th>Connect Status</th>
                <th>Bookings</th>
                <th>Total Revenue</th>
                <th>Platform Fee</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {revenueStudios.map((studio) => (
                <tr key={studio.id}>
                  <td>
                    <strong>{studio.name}</strong>
                    {studio.slug ? <div className="admin-subtle">/studios/{studio.slug}</div> : null}
                  </td>
                  <td>
                    {studio.owner?.name || '—'}
                    <div className="admin-subtle">{studio.owner?.email}</div>
                  </td>
                  <td><ConnectChip status={studio.stripeConnectStatus} /></td>
                  <td className="admin-subtle">{studio._count?.bookings ?? 0}</td>
                  <td>{formatCurrency(studio.totalRevenue)}</td>
                  <td>{formatCurrency(studio.totalPlatformFee)}</td>
                  <td>{studio.verified ? <span style={{ color: '#22c55e' }}>✓</span> : <span className="admin-subtle">—</span>}</td>
                </tr>
              ))}
              {revenueStudios.length === 0 ? (
                <tr><td colSpan={7}>No revenue data available.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBookings = () => (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <select value={bookingStatusFilter} onChange={(e) => setBookingStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <span className="admin-subtle">{bookingsTotal} total</span>
      </div>
      {bookingsLoading ? <p className="admin-subtle">Loading...</p> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Studio</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="admin-subtle">#{booking.id}</td>
                    <td>
                      {booking.studio?.name || '—'}
                      {booking.studio?.slug ? <div className="admin-subtle">/studios/{booking.studio.slug}</div> : null}
                    </td>
                    <td>
                      {booking.user?.name || '—'}
                      <div className="admin-subtle">{booking.user?.email}</div>
                    </td>
                    <td>
                      <span style={{
                        color: booking.status === 'CONFIRMED' ? '#22c55e'
                          : booking.status === 'CANCELLED' ? '#ef4444'
                          : booking.status === 'COMPLETED' ? '#3b82f6'
                          : '#94a3b8',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}>
                        {booking.status}
                      </span>
                    </td>
                    <td>{formatCurrency(booking._sum?.amount ?? booking.totalAmount)}</td>
                    <td className="admin-subtle">
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleCancelBooking(booking)}
                        >
                          Cancel
                        </button>
                      ) : <span className="admin-subtle">—</span>}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 ? <tr><td colSpan={7}>No bookings found.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <div className="admin-pager">
            <button type="button" className="admin-btn" disabled={bookingsPage <= 1} onClick={() => setBookingsPage((v) => v - 1)}>Prev</button>
            <span className="admin-subtle">Page {bookingsPage} / {bookingsPages}</span>
            <button type="button" className="admin-btn" disabled={bookingsPage >= bookingsPages} onClick={() => setBookingsPage((v) => v + 1)}>Next</button>
          </div>
        </>
      )}
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

        {loading ? <div className="admin-panel">Loading admin datasets...</div> : null}
        {!loading && activeTab === 'Dashboard' ? renderDashboard() : null}
        {!loading && activeTab === 'Accounts' ? renderAccounts() : null}
        {!loading && activeTab === 'Studios' ? renderStudios() : null}
        {!loading && activeTab === 'Profiles' ? renderProfiles() : null}
        {!loading && activeTab === 'Permissions' ? renderPermissions() : null}
        {!loading && activeTab === 'Revenue' ? renderRevenue() : null}
        {!loading && activeTab === 'Bookings' ? renderBookings() : null}
      </main>

      {editStudio ? (
        <EditStudioModal
          studio={editStudio}
          accounts={accounts}
          onSave={(updated) => {
            setStudios((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setEditStudio(null);
            setToast('Studio saved.');
            showToast('Studio saved.');
          }}
          onClose={() => setEditStudio(null)}
        />
      ) : null}

      <ConfirmationModal
        open={Boolean(cancelBookingTarget)}
        title={`Cancel booking #${cancelBookingTarget?.id}?`}
        description="This will set the booking status to CANCELLED. This action is audit logged."
        confirmLabel="Cancel booking"
        onCancel={() => setCancelBookingTarget(null)}
        onConfirm={confirmCancelBooking}
      />

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
