import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { slotsService } from '../services/slotsService';
import { type TimeSlot } from '../types';
import './Slots.css';

export const Slots = () => {
  const { currentUser } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    duration: 30,
  });

  useEffect(() => {
    if (currentUser) {
      loadSlots();
    }
  }, [currentUser]);

  const loadSlots = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const doctorSlots = await slotsService.getSlotsByDoctor(currentUser.uid);
      setSlots(doctorSlots);
    } catch (err: any) {
      setError('Failed to load slots: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentUser) {
      setError('You must be logged in to create slots');
      return;
    }

    // Validate time
    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      return;
    }

    setLoading(true);

    try {
      const slot: Omit<TimeSlot, 'id' | 'createdAt' | 'updatedAt'> = {
        doctorId: currentUser.uid,
        doctorName: currentUser.displayName || currentUser.email || 'Doctor',
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: formData.duration,
        isAvailable: true,
      };

      await slotsService.createSlot(slot);
      setSuccess('Time slot created successfully!');
      setFormData({ date: '', startTime: '', endTime: '', duration: 30 });
      setShowForm(false);
      await loadSlots();
    } catch (err: any) {
      setError('Failed to create slot: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;

    try {
      await slotsService.deleteSlot(slotId);
      setSuccess('Slot deleted successfully!');
      await loadSlots();
    } catch (err: any) {
      setError('Failed to delete slot: ' + err.message);
    }
  };

  const handleToggleAvailability = async (slot: TimeSlot) => {
    try {
      await slotsService.updateSlot(slot.id!, {
        isAvailable: !slot.isAvailable,
      });
      await loadSlots();
    } catch (err: any) {
      setError('Failed to update slot: ' + err.message);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="slots-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Time Slots</h1>
          <p className="page-subtitle">Create and manage your available time slots</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Slot'}
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="slots-alert">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="slots-alert">
          {success}
        </Alert>
      )}

      {showForm && (
        <Card className="slot-form-card">
          <h2 className="card-title">Create New Time Slot</h2>
          <form onSubmit={handleSubmit} className="slot-form">
            <div className="form-row">
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                min={today}
              />
              <Input
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                required
                min={15}
                max={240}
                step={15}
              />
            </div>
            <div className="form-row">
              <Input
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={loading} fullWidth>
                {loading ? 'Creating...' : 'Create Slot'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="slots-card">
        <h2 className="card-title">Your Time Slots</h2>
        {loading && !slots.length ? (
          <div className="loading-state">Loading slots...</div>
        ) : slots.length === 0 ? (
          <div className="empty-state">
            <p>No time slots created yet. Create your first slot to get started!</p>
          </div>
        ) : (
          <div className="slots-list">
            {slots.map((slot) => (
              <div key={slot.id} className={`slot-item ${!slot.isAvailable ? 'slot-item--unavailable' : ''}`}>
                <div className="slot-info">
                  <div className="slot-date">
                    <span className="slot-date-label">{new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="slot-time">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  <div className="slot-meta">
                    <span className="slot-duration">{slot.duration} minutes</span>
                    <span className={`slot-status ${slot.isAvailable ? 'slot-status--available' : 'slot-status--unavailable'}`}>
                      {slot.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
                <div className="slot-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAvailability(slot)}
                  >
                    {slot.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(slot.id!)}
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

