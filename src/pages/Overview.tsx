import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { appointmentsService } from '../services/appointmentsService';
import { type Appointment } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
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

  // Chart data: Appointment status distribution
  const statusData = useMemo(() => {
    const statusCounts = appointments.reduce(
      (acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const statusColors: Record<string, string> = {
      scheduled: '#3b82f6',
      confirmed: '#10b981',
      completed: '#6366f1',
      cancelled: '#ef4444',
      'no-show': '#f59e0b',
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: statusColors[status] || '#6b7280',
    }));
  }, [appointments]);

  // Chart data: Appointments over last 7 days
  const weeklyData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayAppointments = appointments.filter((apt) => apt.date === dateStr);
      
      days.push({
        date: dayName,
        fullDate: dateStr,
        appointments: dayAppointments.length,
        confirmed: dayAppointments.filter((a) => a.status === 'confirmed').length,
        completed: dayAppointments.filter((a) => a.status === 'completed').length,
      });
    }
    
    return days;
  }, [appointments]);

  // Chart data: Monthly trend (last 30 days)
  const monthlyData = useMemo(() => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.date + 'T00:00:00');
        return aptDate >= weekStart && aptDate <= weekEnd;
      });
      
      weeks.push({
        week: `Week ${4 - i}`,
        appointments: weekAppointments.length,
      });
    }
    
    return weeks;
  }, [appointments]);

  return (
    <div className="overview-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clinic Overview</h1>
          <p className="page-subtitle">Welcome back, {currentUser?.email?.split('@')[0] || 'Doctor'}</p>
        </div>
      </div>

      <div className="charts-grid">
        <Card className="chart-card">
          <h2 className="card-title">Appointment Status Distribution</h2>
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : statusData.length === 0 ? (
            <div className="empty-state">
              <p>No appointment data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="chart-card">
          <h2 className="card-title">Appointments - Last 7 Days</h2>
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointments" fill="#3b82f6" name="Total" />
                <Bar dataKey="confirmed" fill="#10b981" name="Confirmed" />
                <Bar dataKey="completed" fill="#6366f1" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="chart-card">
          <h2 className="card-title">Weekly Trend (Last 4 Weeks)</h2>
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Appointments"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
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

