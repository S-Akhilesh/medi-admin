import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { appointmentsService } from '../services/appointmentsService';
import { type Appointment } from '../types';
import './Overview.css';

export const Overview = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const allAppointments = await appointmentsService.getAppointmentsByDoctor(currentUser.uid);
      setAppointments(allAppointments);
      
      const today = new Date().toISOString().split('T')[0];
      const todayApts = allAppointments.filter((apt) => apt.date === today);
      setTodayAppointments(todayApts);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const totalSlots = appointments.length;

  const stats = [
    { label: 'Total Appointments', value: totalSlots.toString(), change: '', trend: 'up' as const },
    { label: 'Scheduled Today', value: todayAppointments.length.toString(), change: '', trend: 'up' as const },
    { label: 'Confirmed', value: confirmedCount.toString(), change: '', trend: 'up' as const },
    { label: 'Completed', value: completedCount.toString(), change: '', trend: 'up' as const },
  ];

  return (
    <div className="overview-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clinic Overview</h1>
          <p className="page-subtitle">Welcome back, {currentUser?.email?.split('@')[0] || 'Doctor'}</p>
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
          <h2 className="card-title">Today's Appointments</h2>
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : todayAppointments.length === 0 ? (
            <div className="empty-state">
              <p>No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="activity-list">
              {todayAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="activity-item">
                  <div className="activity-icon">📅</div>
                  <div className="activity-content">
                    <p className="activity-text">
                      {apt.patientName} - {apt.startTime} to {apt.endTime}
                    </p>
                    <span className="activity-time">Status: {apt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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

