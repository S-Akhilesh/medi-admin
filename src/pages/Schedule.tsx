import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { appointmentsService } from '../services/appointmentsService';
import { type Appointment } from '../types';
import './Schedule.css';

export const Schedule = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [currentUser, selectedDate]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let allAppointments: Appointment[];
      if (currentUser) {
        allAppointments = await appointmentsService.getAppointmentsByDoctor(currentUser.uid);
      } else {
        allAppointments = await appointmentsService.getAllAppointments();
      }
      
      // Filter by selected date
      const filtered = allAppointments.filter((apt) => apt.date === selectedDate);
      setAppointments(filtered.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const getAppointmentForTime = (time: string) => {
    return appointments.find((apt) => apt.startTime === time);
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'schedule-status--scheduled';
      case 'confirmed':
        return 'schedule-status--confirmed';
      case 'completed':
        return 'schedule-status--completed';
      case 'cancelled':
        return 'schedule-status--cancelled';
      case 'no-show':
        return 'schedule-status--no-show';
      default:
        return '';
    }
  };

  const timeSlots = getTimeSlots();

  return (
    <div className="schedule-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule</h1>
          <p className="page-subtitle">View your daily appointment schedule</p>
        </div>
        <div className="date-selector">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
        </div>
      </div>

      <Card className="schedule-card">
        <div className="schedule-header">
          <h2 className="schedule-date">
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
          <div className="schedule-stats">
            <span className="stat-item">
              Total: <strong>{appointments.length}</strong>
            </span>
            <span className="stat-item">
              Scheduled: <strong>{appointments.filter((a) => a.status === 'scheduled').length}</strong>
            </span>
            <span className="stat-item">
              Confirmed: <strong>{appointments.filter((a) => a.status === 'confirmed').length}</strong>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading schedule...</div>
        ) : (
          <div className="schedule-timeline">
            {timeSlots.map((time) => {
              const appointment = getAppointmentForTime(time);
              return (
                <div key={time} className="schedule-slot">
                  <div className="schedule-time">{time}</div>
                  <div className="schedule-content">
                    {appointment ? (
                      <div className={`schedule-appointment ${getStatusColor(appointment.status)}`}>
                        <div className="appointment-header-schedule">
                          <span className="appointment-patient-name">{appointment.patientName}</span>
                          <span className={`appointment-status-badge ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="appointment-time-schedule">
                          {appointment.startTime} - {appointment.endTime}
                        </div>
                        {appointment.patientPhone && (
                          <div className="appointment-contact">📞 {appointment.patientPhone}</div>
                        )}
                        {appointment.notes && (
                          <div className="appointment-notes">📝 {appointment.notes}</div>
                        )}
                      </div>
                    ) : (
                      <div className="schedule-empty">Available</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

