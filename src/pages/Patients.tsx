import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { appointmentsService } from '../services/appointmentsService';
import type { Appointment } from '../types';
import './Patients.css';

type PatientRecord = {
  patientName: string;
  patientPhone: string;
  patientEmail: string | undefined;
  appointments: Appointment[];
  lastAppointmentDate: string;
  lastAppointmentTime: string;
};

const normalizePhone = (phone: string) => phone.replace(/\s+/g, '').replace(/-/g, '');

export const Patients = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      loadAppointments();
    } else {
      setAppointments([]);
    }
  }, [currentUser]);

  const loadAppointments = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const list = await appointmentsService.getAppointmentsByDoctor(currentUser.uid);
      setAppointments(list);
    } catch (err: unknown) {
      const msg = 'Failed to load patients: ' + (err instanceof Error ? err.message : 'Unknown error');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const patients: PatientRecord[] = useMemo(() => {
    const byPhone = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      const key = normalizePhone(apt.patientPhone);
      if (!byPhone.has(key)) byPhone.set(key, []);
      byPhone.get(key)!.push(apt);
    }
    const result: PatientRecord[] = [];
    for (const list of byPhone.values()) {
      const sorted = [...list].sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        if (d !== 0) return d;
        return a.startTime.localeCompare(b.startTime);
      });
      const latest = sorted[sorted.length - 1];
      result.push({
        patientName: latest.patientName,
        patientPhone: latest.patientPhone,
        patientEmail: latest.patientEmail || undefined,
        appointments: sorted,
        lastAppointmentDate: latest.date,
        lastAppointmentTime: latest.startTime,
      });
    }
    result.sort((a, b) => a.patientName.localeCompare(b.patientName, undefined, { sensitivity: 'base' }));
    return result;
  }, [appointments]);

  const formatDate = (isoDate: string) => {
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="patients-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">All patients who have booked appointments with you</p>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="patients-alert">
          {error}
        </Alert>
      )}

      <Card className="patients-card">
        <h2 className="card-title">Patient List</h2>
        {loading && !appointments.length ? (
          <div className="loading-state">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <p>No patients yet. Patients will appear here once they book an appointment.</p>
          </div>
        ) : (
          <div className="patients-list">
            {patients.map((patient) => (
              <div key={normalizePhone(patient.patientPhone)} className="patient-item">
                <div className="patient-main">
                  <h3 className="patient-name">{patient.patientName}</h3>
                  <div className="patient-contact">
                    <span className="patient-phone">📞 {patient.patientPhone}</span>
                    {patient.patientEmail && (
                      <span className="patient-email">📧 {patient.patientEmail}</span>
                    )}
                  </div>
                  <div className="patient-meta">
                    <span className="patient-appointment-count">
                      {patient.appointments.length} appointment{patient.appointments.length !== 1 ? 's' : ''}
                    </span>
                    <span className="patient-last-visit">
                      Last visit: {formatDate(patient.lastAppointmentDate)} at {patient.lastAppointmentTime}
                    </span>
                  </div>
                </div>
                <div className="patient-appointments-summary">
                  <span className="patient-summary-label">Appointment history</span>
                  <ul className="patient-appointment-timeline">
                    {patient.appointments.slice().reverse().slice(0, 5).map((apt) => (
                      <li key={apt.id} className="patient-timeline-item">
                        <span className="patient-timeline-date">{formatDate(apt.date)}</span>
                        <span className="patient-timeline-time">{apt.startTime} – {apt.endTime}</span>
                        <span className={`patient-timeline-status patient-timeline-status--${apt.status}`}>
                          {apt.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {patient.appointments.length > 5 && (
                    <p className="patient-more">+ {patient.appointments.length - 5} more</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
