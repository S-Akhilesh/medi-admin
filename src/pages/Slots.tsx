import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { slotsService } from '../services/slotsService';
import { type TimeSlot } from '../types';
import './Slots.css';

type SlotFormData = {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
};

const DEFAULT_FORM_DATA: SlotFormData = {
  date: '',
  startTime: '',
  endTime: '',
  duration: 30,
};

export const Slots = () => {
  const { currentUser } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const isEditing = editingSlotId !== null;
  const [formData, setFormData] = useState<SlotFormData>(DEFAULT_FORM_DATA);

  useEffect(() => {
    if (currentUser) {
      loadSlots();
    } else {
      setSlots([]);
    }
  }, [currentUser]);

  const loadSlots = async () => {
    if (!currentUser) return;
    setListLoading(true);
    try {
      const doctorSlots = await slotsService.getSlotsByDoctor(currentUser.uid);
      setSlots(doctorSlots);
    } catch (err: any) {
      setError('Failed to load slots: ' + err.message);
    } finally {
      setListLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingSlotId(null);
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const openCreateForm = () => {
    setError('');
    setSuccess('');
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (slot: TimeSlot) => {
    setError('');
    setSuccess('');
    setEditingSlotId(slot.id ?? null);
    setFormData({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
    });
    setShowForm(true);
  };

  const formatSlotDateLabel = (isoDate: string) => {
    // Avoid timezone shifting that can happen with `new Date('YYYY-MM-DD')`.
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentUser) {
      setError(`You must be logged in to ${isEditing ? 'update' : 'create'} slots`);
      return;
    }

    if (!formData.date) {
      setError('Please select a date');
      return;
    }

    // Validate time (HH:mm string comparison works lexicographically)
    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      return;
    }

    setSubmitLoading(true);

    try {
      if (isEditing && editingSlotId) {
        await slotsService.updateSlot(editingSlotId, {
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: formData.duration,
        });
        setSuccess('Time slot updated successfully!');
      } else {
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
      }

      closeForm();
      await loadSlots();
    } catch (err: any) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} slot: ` + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;

    try {
      setRowBusyId(slotId);
      await slotsService.deleteSlot(slotId);
      setSuccess('Slot deleted successfully!');
      if (editingSlotId === slotId) {
        closeForm();
      }
      await loadSlots();
    } catch (err: any) {
      setError('Failed to delete slot: ' + err.message);
    } finally {
      setRowBusyId(null);
    }
  };

  const handleToggleAvailability = async (slot: TimeSlot) => {
    try {
      setRowBusyId(slot.id ?? null);
      await slotsService.updateSlot(slot.id!, {
        isAvailable: !slot.isAvailable,
      });
      setSuccess(`Slot marked ${slot.isAvailable ? 'unavailable' : 'available'} successfully!`);
      await loadSlots();
    } catch (err: any) {
      setError('Failed to update slot: ' + err.message);
    } finally {
      setRowBusyId(null);
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
        <Button
          variant="primary"
          onClick={() => {
            if (showForm) closeForm();
            else openCreateForm();
          }}
        >
          {showForm ? 'Close' : '+ Create Slot'}
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
          <h2 className="card-title">{isEditing ? 'Edit Time Slot' : 'Create New Time Slot'}</h2>
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
                onChange={(e) => {
                  const v = Number.parseInt(e.target.value, 10);
                  setFormData({ ...formData, duration: Number.isFinite(v) && v > 0 ? v : 30 });
                }}
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
              <Button type="submit" variant="primary" disabled={submitLoading} fullWidth>
                {submitLoading ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create Slot'}
              </Button>
              {isEditing && (
                <Button type="button" variant="secondary" disabled={submitLoading} fullWidth onClick={closeForm}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      <Card className="slots-card">
        <h2 className="card-title">Your Time Slots</h2>
        {listLoading && !slots.length ? (
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
                    <span className="slot-date-label">{formatSlotDateLabel(slot.date)}</span>
                    <span className="slot-time">
                      {slot.startTime} - {slot.endTime}
                    </span>
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
                    disabled={rowBusyId === slot.id || submitLoading}
                    onClick={() => openEditForm(slot)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={rowBusyId === slot.id || submitLoading}
                    onClick={() => handleToggleAvailability(slot)}
                  >
                    {slot.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={rowBusyId === slot.id || submitLoading}
                    onClick={() => handleDelete(slot.id!)}
                  >
                    {rowBusyId === slot.id ? 'Deleting...' : 'Delete'}
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

