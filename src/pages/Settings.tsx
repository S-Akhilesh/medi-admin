import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import './Settings.css';

export const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Admin Panel',
    siteEmail: 'admin@example.com',
    maintenanceMode: false,
    notifications: true,
    emailNotifications: true,
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // In a real app, this would save to an API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your application settings</p>
        </div>
      </div>

      {saved && (
        <Alert variant="success" className="settings-alert">
          Settings saved successfully!
        </Alert>
      )}

      <div className="settings-grid">
        <Card className="settings-card">
          <h2 className="card-title">General Settings</h2>
          <div className="settings-form">
            <Input
              label="Site Name"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              placeholder="Enter site name"
            />
            <Input
              label="Site Email"
              type="email"
              value={settings.siteEmail}
              onChange={(e) => handleChange('siteEmail', e.target.value)}
              placeholder="admin@example.com"
            />
            <Button variant="primary" onClick={handleSave} fullWidth>
              Save Changes
            </Button>
          </div>
        </Card>

        <Card className="settings-card">
          <h2 className="card-title">System Settings</h2>
          <div className="settings-form">
            <div className="setting-toggle">
              <div className="toggle-content">
                <label className="toggle-label">Maintenance Mode</label>
                <p className="toggle-description">Enable to put the site in maintenance mode</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-toggle">
              <div className="toggle-content">
                <label className="toggle-label">Push Notifications</label>
                <p className="toggle-description">Receive push notifications</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleChange('notifications', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-toggle">
              <div className="toggle-content">
                <label className="toggle-label">Email Notifications</label>
                <p className="toggle-description">Receive email notifications</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

