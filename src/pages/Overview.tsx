import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import './Overview.css';

export const Overview = () => {
  const { currentUser } = useAuth();

  const stats = [
    { label: 'Total Users', value: '1,234', change: '+12%', trend: 'up' },
    { label: 'Active Sessions', value: '456', change: '+5%', trend: 'up' },
    { label: 'Revenue', value: '$12,345', change: '+8%', trend: 'up' },
    { label: 'Conversion Rate', value: '3.2%', change: '-2%', trend: 'down' },
  ];

  return (
    <div className="overview-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Welcome back, {currentUser?.email?.split('@')[0] || 'User'}</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <Card key={stat.label} className="stat-card">
            <div className="stat-header">
              <span className="stat-label">{stat.label}</span>
              <span className={`stat-change stat-change--${stat.trend}`}>
                {stat.change}
              </span>
            </div>
            <div className="stat-value">{stat.value}</div>
          </Card>
        ))}
      </div>

      <div className="overview-content">
        <Card className="overview-card">
          <h2 className="card-title">Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">👤</div>
              <div className="activity-content">
                <p className="activity-text">New user registered</p>
                <span className="activity-time">2 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🔐</div>
              <div className="activity-content">
                <p className="activity-text">User authentication successful</p>
                <span className="activity-time">15 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">⚙️</div>
              <div className="activity-content">
                <p className="activity-text">Settings updated</p>
                <span className="activity-time">1 hour ago</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overview-card">
          <h2 className="card-title">Account Information</h2>
          <div className="account-info">
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{currentUser?.email || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">User ID</span>
              <span className="info-value info-value--small">{currentUser?.uid}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email Verified</span>
              <span className={`info-badge ${currentUser?.emailVerified ? 'info-badge--success' : 'info-badge--warning'}`}>
                {currentUser?.emailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Account Created</span>
              <span className="info-value">
                {currentUser?.metadata?.creationTime
                  ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

