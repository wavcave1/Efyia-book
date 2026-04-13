export default function RevenueChart({ data }) {
  const items = Array.isArray(data) ? data.slice(0, 6) : [];
  const revenues = items.map((item) => Number(item.revenue || 0));
  const maxRevenue = Math.max(...revenues, 0);

  const formatRevenue = (value) => {
    const num = Number(value || 0);
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
    return `$${Math.round(num)}`;
  };

  if (!items.length || maxRevenue === 0) {
    return (
      <div className="eyf-card">
        <p className="eyf-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
          No revenue data yet.
        </p>
      </div>
    );
  }

  return (
    <div className="eyf-analytics-chart">
      {items.map((item) => {
        const revenue = Number(item.revenue || 0);
        const height = revenue > 0 ? `${(revenue / maxRevenue) * 100}%` : '4px';

        return (
          <div key={`${item.month}-${revenue}`} className="eyf-analytics-bar-wrap">
            <div className="eyf-analytics-bar-value">{formatRevenue(revenue)}</div>
            <div className="eyf-analytics-bar" style={{ height }} />
            <div className="eyf-analytics-bar-label">{item.month}</div>
          </div>
        );
      })}
    </div>
  );
}
