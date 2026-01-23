import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { appointmentsService } from '../services/appointmentsService';
import { slotsService } from '../services/slotsService';
import type { Appointment, TimeSlot } from '../types';
import './Appointments.css';

export const Appointments = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Appointment['status'] | 'all'>('all');
  const [formData, setFormData] = useState({
    slotId: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    notes: '',
  });

  useEffect(() => {
    loadAppointments();
    loadAvailableSlots();
  }, [currentUser, filterStatus]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let allAppointments: Appointment[];
      if (currentUser) {
        allAppointments = await appointmentsService.getAppointmentsByDoctor(currentUser.uid);
      } else {
        allAppointments = await appointmentsService.getAllAppointments();
      }

      if (filterStatus === 'all') {
        setAppointments(allAppointments);
      } else {
        setAppointments(allAppointments.filter((apt) => apt.status === filterStatus));
      }
    } catch (err: any) {
      setError('Failed to load appointments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!currentUser) return;
    try {
      const slots = await slotsService.getAvailableSlots();
      setAvailableSlots(slots.filter((slot) => slot.doctorId === currentUser.uid));
    } catch (err: any) {
      console.error('Failed to load slots:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentUser) {
      setError('You must be logged in to create appointments');
      return;
    }

    const selectedSlot = availableSlots.find((s) => s.id === formData.slotId);
    if (!selectedSlot) {
      setError('Please select a valid time slot');
      return;
    }

    setLoading(true);

    try {
      const appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
        slotId: formData.slotId,
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        patientEmail: formData.patientEmail || undefined,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        doctorId: currentUser.uid,
        doctorName: selectedSlot.doctorName,
        status: 'scheduled',
        notes: formData.notes || undefined,
      };

      await appointmentsService.createAppointment(appointment);
      
      // Mark slot as unavailable
      await slotsService.updateSlot(formData.slotId, { isAvailable: false });

      setSuccess('Appointment created successfully!');
      setFormData({ slotId: '', patientName: '', patientPhone: '', patientEmail: '', notes: '' });
      setShowForm(false);
      await loadAppointments();
      await loadAvailableSlots();
    } catch (err: any) {
      setError('Failed to create appointment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await appointmentsService.updateAppointment(appointmentId, { status: newStatus });
      
      // If cancelled or no-show, make the slot available again
      if (newStatus === 'cancelled' || newStatus === 'no-show') {
        const appointment = appointments.find((apt) => apt.id === appointmentId);
        if (appointment) {
          await slotsService.updateSlot(appointment.slotId, { isAvailable: true });
        }
      }
      
      setSuccess('Appointment status updated!');
      await loadAppointments();
      await loadAvailableSlots();
    } catch (err: any) {
      setError('Failed to update appointment: ' + err.message);
    }
  };

  const handleDelete = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const appointment = appointments.find((apt) => apt.id === appointmentId);
      await appointmentsService.deleteAppointment(appointmentId);
      
      // Make the slot available again
      if (appointment) {
        await slotsService.updateSlot(appointment.slotId, { isAvailable: true });
      }
      
      setSuccess('Appointment deleted successfully!');
      await loadAppointments();
      await loadAvailableSlots();
    } catch (err: any) {
      setError('Failed to delete appointment: ' + err.message);
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'status--scheduled';
      case 'confirmed':
        return 'status--confirmed';
      case 'completed':
        return 'status--completed';
      case 'cancelled':
        return 'status--cancelled';
      case 'no-show':
        return 'status--no-show';
      default:
        return '';
    }
  };

  return (
    <div className="appointments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Manage patient appointments</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Appointment'}
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="appointments-alert">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="appointments-alert">
          {success}
        </Alert>
      )}

      <div className="filter-bar">
        <Button
          variant={filterStatus === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          All
        </Button>
        <Button
          variant={filterStatus === 'scheduled' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('scheduled')}
        >
          Scheduled
        </Button>
        <Button
          variant={filterStatus === 'confirmed' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('confirmed')}
        >
          Confirmed
        </Button>
        <Button
          variant={filterStatus === 'completed' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('completed')}
        >
          Completed
        </Button>
        <Button
          variant={filterStatus === 'cancelled' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('cancelled')}
        >
          Cancelled
        </Button>
      </div>

      {showForm && (
        <Card className="appointment-form-card">
          <h2 className="card-title">Create New Appointment</h2>
          <form onSubmit={handleSubmit} className="appointment-form">
            <div className="input-wrapper">
              <label className="input-label">Select Time Slot *</label>
              <select
                value={formData.slotId}
                onChange={(e) => setFormData({ ...formData, slotId: e.target.value })}
                className="input slot-select"
                required
              >
                <option value="">Select a time slot</option>
                {availableSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {new Date(slot.date).toLocaleDateString()} - {slot.startTime} to {slot.endTime}
                  </option>
                ))}
              </select>
              <span className="input-helper">Choose an available time slot</span>
            </div>

            <div className="form-row">
              <Input
                label="Patient Name"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="Enter patient name"
                required
              />
              <Input
                label="Patient Phone"
                type="tel"
                value={formData.patientPhone}
                onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                placeholder="Enter phone number"
                required
              />
            </div>

            <Input
              label="Patient Email (Optional)"
              type="email"
              value={formData.patientEmail}
              onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
              placeholder="Enter email address"
            />

            <Input
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
            />

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={loading} fullWidth>
                {loading ? 'Creating...' : 'Create Appointment'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="appointments-card">
        <h2 className="card-title">Appointments List</h2>
        {loading && !appointments.length ? (
          <div className="loading-state">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <p>No appointments found. Create your first appointment to get started!</p>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-item">
                <div className="appointment-info">
                  <div className="appointment-header">
                    <h3 className="appointment-patient">{appointment.patientName}</h3>
                    <span className={`appointment-status ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="appointment-details">
                    <div className="detail-item">
                      <span className="detail-label">📅 Date:</span>
                      <span>{new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">⏰ Time:</span>
                      <span>{appointment.startTime} - {appointment.endTime}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">📞 Phone:</span>
                      <span>{appointment.patientPhone}</span>
                    </div>
                    {appointment.patientEmail && (
                      <div className="detail-item">
                        <span className="detail-label">📧 Email:</span>
                        <span>{appointment.patientEmail}</span>
                      </div>
                    )}
                    {appointment.notes && (
                      <div className="detail-item">
                        <span className="detail-label">📝 Notes:</span>
                        <span>{appointment.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="appointment-actions">
                  {appointment.status === 'scheduled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(appointment.id!, 'confirmed')}
                    >
                      Confirm
                    </Button>
                  )}
                  {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(appointment.id!, 'completed')}
                    >
                      Complete
                    </Button>
                  )}
                  {appointment.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(appointment.id!, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(appointment.id!)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

