import { Card } from '../components/ui/Card';
import './Analytics.css';

export const Analytics = () => {
  const chartData = [
    { month: 'Jan', value: 65 },
    { month: 'Feb', value: 78 },
    { month: 'Mar', value: 90 },
    { month: 'Apr', value: 81 },
    { month: 'May', value: 95 },
    { month: 'Jun', value: 88 },
  ];

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track your application metrics and performance</p>
        </div>
      </div>

      <div className="analytics-grid">
        <Card className="analytics-card analytics-card--large">
          <h2 className="card-title">User Growth</h2>
          <div className="chart-container">
            <div className="chart">
              {chartData.map((item, index) => (
                <div key={item.month} className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{ height: `${item.value}%` }}
                    title={`${item.month}: ${item.value}`}
                  />
                  <span className="chart-label">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="analytics-card">
          <h2 className="card-title">Traffic Sources</h2>
          <div className="traffic-list">
            <div className="traffic-item">
              <div className="traffic-source">
                <span className="traffic-icon">🔍</span>
                <span>Organic Search</span>
              </div>
              <div className="traffic-stats">
                <span className="traffic-percentage">45%</span>
                <div className="traffic-bar">
                  <div className="traffic-bar-fill" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
            <div className="traffic-item">
              <div className="traffic-source">
                <span className="traffic-icon">🔗</span>
                <span>Direct</span>
              </div>
              <div className="traffic-stats">
                <span className="traffic-percentage">30%</span>
                <div className="traffic-bar">
                  <div className="traffic-bar-fill" style={{ width: '30%' }} />
                </div>
              </div>
            </div>
            <div className="traffic-item">
              <div className="traffic-source">
                <span className="traffic-icon">📱</span>
                <span>Social Media</span>
              </div>
              <div className="traffic-stats">
                <span className="traffic-percentage">15%</span>
                <div className="traffic-bar">
                  <div className="traffic-bar-fill" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
            <div className="traffic-item">
              <div className="traffic-source">
                <span className="traffic-icon">📧</span>
                <span>Email</span>
              </div>
              <div className="traffic-stats">
                <span className="traffic-percentage">10%</span>
                <div className="traffic-bar">
                  <div className="traffic-bar-fill" style={{ width: '10%' }} />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="analytics-card">
          <h2 className="card-title">Key Metrics</h2>
          <div className="metrics-list">
            <div className="metric-item">
              <span className="metric-label">Page Views</span>
              <span className="metric-value">12,345</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Unique Visitors</span>
              <span className="metric-value">8,901</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Bounce Rate</span>
              <span className="metric-value">32%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Avg. Session</span>
              <span className="metric-value">4m 32s</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

