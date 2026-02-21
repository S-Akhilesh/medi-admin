import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
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

type CalculatedSlot = {
  startTime: string;
  endTime: string;
};

const DEFAULT_FORM_DATA: SlotFormData = {
  date: '',
  startTime: '',
  endTime: '',
  duration: 30,
};

type DateRangeFilter = 'all' | 'today' | 'this_week' | 'next_7' | 'past';
type StatusFilter = 'all' | 'available' | 'unavailable';
type SortOption = 'date-asc' | 'date-desc';

const getDateRangeForFilter = (range: DateRangeFilter): { from: string; to: string } | null => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  if (range === 'all') return null;
  if (range === 'today') return { from: todayStr, to: todayStr };

  if (range === 'this_week') {
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0],
    };
  }

  if (range === 'next_7') {
    const from = new Date(today);
    from.setDate(today.getDate() + 1);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  }

  if (range === 'past') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return { from: '1970-01-01', to: yesterday.toISOString().split('T')[0] };
  }

  return null;
};

// Helper function to convert HH:mm to minutes
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes to HH:mm
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Calculate slots from time range
const calculateSlots = (startTime: string, endTime: string, duration: number): CalculatedSlot[] => {
  if (!startTime || !endTime || duration <= 0) return [];
  
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  if (startMinutes >= endMinutes) return [];
  
  const slots: CalculatedSlot[] = [];
  let currentStart = startMinutes;
  
  while (currentStart + duration <= endMinutes) {
    const currentEnd = currentStart + duration;
    slots.push({
      startTime: minutesToTime(currentStart),
      endTime: minutesToTime(currentEnd),
    });
    currentStart = currentEnd;
  }
  
  return slots;
};

export const Slots = () => {
  const { currentUser } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const isEditing = editingSlotId !== null;
  const [formData, setFormData] = useState<SlotFormData>(DEFAULT_FORM_DATA);

  // Filters
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [durationFilter, setDurationFilter] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');

  // Filter and sort slots
  const filteredSlots = useMemo(() => {
    let result = [...slots];

    const dateRange = getDateRangeForFilter(dateRangeFilter);
    if (dateRange) {
      result = result.filter((s) => s.date >= dateRange.from && s.date <= dateRange.to);
    }

    if (statusFilter === 'available') result = result.filter((s) => s.isAvailable);
    if (statusFilter === 'unavailable') result = result.filter((s) => !s.isAvailable);

    if (durationFilter !== '') {
      result = result.filter((s) => s.duration === durationFilter);
    }

    result.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return sortBy === 'date-asc' ? dateCompare : -dateCompare;
      const timeCompare = a.startTime.localeCompare(b.startTime);
      return sortBy === 'date-asc' ? timeCompare : -timeCompare;
    });

    return result;
  }, [slots, dateRangeFilter, statusFilter, durationFilter, sortBy]);

  const hasActiveFilters =
    dateRangeFilter !== 'all' || statusFilter !== 'all' || durationFilter !== '' || sortBy !== 'date-asc';

  const clearFilters = () => {
    setDateRangeFilter('all');
    setStatusFilter('all');
    setDurationFilter('');
    setSortBy('date-asc');
  };

  // Calculate preview slots based on form data
  const previewSlots = useMemo(() => {
    if (!formData.startTime || !formData.endTime || formData.duration <= 0) {
      return [];
    }
    return calculateSlots(formData.startTime, formData.endTime, formData.duration);
  }, [formData.startTime, formData.endTime, formData.duration]);

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
      const msg = 'Failed to load slots: ' + err.message;
      setError(msg);
      toast.error(msg);
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
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (slot: TimeSlot) => {
    setError('');
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

    if (!currentUser) {
      const msg = `You must be logged in to ${isEditing ? 'update' : 'create'} slots`;
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!formData.date) {
      setError('Please select a date');
      toast.error('Please select a date');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      toast.error('End time must be after start time');
      return;
    }

    if (previewSlots.length === 0) {
      setError('The time range must be at least equal to the slot duration');
      toast.error('The time range must be at least equal to the slot duration');
      return;
    }

    setSubmitLoading(true);

    try {
      if (isEditing && editingSlotId) {
        // For editing, update the single slot (keeping backward compatibility)
        await slotsService.updateSlot(editingSlotId, {
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: formData.duration,
        });
        toast.success('Time slot updated successfully!');
      } else {
        // Create multiple slots based on the time range
        const slotsToCreate = previewSlots.map((slot) => ({
          doctorId: currentUser.uid,
          doctorName: currentUser.displayName || currentUser.email || 'Doctor',
          date: formData.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: formData.duration,
          isAvailable: true,
        }));

        // Create all slots
        const createPromises = slotsToCreate.map((slot) => slotsService.createSlot(slot));
        await Promise.all(createPromises);
        
        toast.success(`Successfully created ${previewSlots.length} time slot${previewSlots.length > 1 ? 's' : ''}!`);
      }

      closeForm();
      await loadSlots();
    } catch (err: any) {
      const msg = `Failed to ${isEditing ? 'update' : 'create'} slot${isEditing ? '' : 's'}: ` + err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;

    try {
      setRowBusyId(slotId);
      await slotsService.deleteSlot(slotId);
      toast.success('Slot deleted successfully!');
      if (editingSlotId === slotId) {
        closeForm();
      }
      await loadSlots();
    } catch (err: any) {
      toast.error('Failed to delete slot: ' + err.message);
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
      toast.success(`Slot marked ${slot.isAvailable ? 'unavailable' : 'available'} successfully!`);
      await loadSlots();
    } catch (err: any) {
      toast.error('Failed to update slot: ' + err.message);
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

      {showForm && (
        <Card className="slot-form-card">
          <div>
            <h2 className="card-title">{isEditing ? 'Edit Time Slot' : 'Create Time Slots'}</h2>
            {!isEditing && (
              <p className="form-description">
                Set a time range and duration to automatically create multiple slots. The system will divide your time range into slots based on the duration you specify.
              </p>
            )}
          </div>
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
                helperText={!isEditing ? "Each slot will be this long. The time range will be divided into slots of this duration." : undefined}
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
            {!isEditing && formData.startTime && formData.endTime && formData.duration > 0 && (
              <div className="slots-preview">
                <div className="slots-preview-header">
                  <h3 className="slots-preview-title">
                    Preview: {previewSlots.length} slot{previewSlots.length !== 1 ? 's' : ''} will be created
                  </h3>
                  {previewSlots.length === 0 && (
                    <p className="slots-preview-warning">
                      The time range must be at least equal to the slot duration
                    </p>
                  )}
                </div>
                {previewSlots.length > 0 && (
                  <div className="slots-preview-list">
                    {previewSlots.map((slot, index) => (
                      <div key={index} className="slots-preview-item">
                        <span className="slots-preview-time">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span className="slots-preview-duration">{formData.duration} min</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={submitLoading || (!isEditing && previewSlots.length === 0)} fullWidth>
                {submitLoading 
                  ? (isEditing ? 'Saving...' : `Creating ${previewSlots.length} slot${previewSlots.length !== 1 ? 's' : ''}...`) 
                  : isEditing 
                    ? 'Save Changes' 
                    : `Create ${previewSlots.length} Slot${previewSlots.length !== 1 ? 's' : ''}`}
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
        <div className="slots-card-header">
          <h2 className="card-title">Your Time Slots</h2>
          {slots.length > 0 && (
            <div className="slots-filters">
              <div className="slots-filter-group">
                <label htmlFor="filter-date" className="slots-filter-label">Date</label>
                <select
                  id="filter-date"
                  className="slots-filter-select"
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value as DateRangeFilter)}
                >
                  <option value="all">All dates</option>
                  <option value="today">Today</option>
                  <option value="this_week">This week</option>
                  <option value="next_7">Next 7 days</option>
                  <option value="past">Past</option>
                </select>
              </div>
              <div className="slots-filter-group">
                <label htmlFor="filter-status" className="slots-filter-label">Status</label>
                <select
                  id="filter-status"
                  className="slots-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="slots-filter-group">
                <label htmlFor="filter-duration" className="slots-filter-label">Duration</label>
                <select
                  id="filter-duration"
                  className="slots-filter-select"
                  value={durationFilter === '' ? 'all' : String(durationFilter)}
                  onChange={(e) => setDurationFilter(e.target.value === 'all' ? '' : Number(e.target.value))}
                >
                  <option value="all">All</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                  <option value="120">120 min</option>
                </select>
              </div>
              <div className="slots-filter-group">
                <label htmlFor="filter-sort" className="slots-filter-label">Sort</label>
                <select
                  id="filter-sort"
                  className="slots-filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="date-asc">Date (earliest first)</option>
                  <option value="date-desc">Date (latest first)</option>
                </select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="slots-filter-clear">
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
        {slots.length > 0 && (
          <p className="slots-result-count">
            Showing {filteredSlots.length} of {slots.length} slot{slots.length !== 1 ? 's' : ''}
          </p>
        )}
        {listLoading && !slots.length ? (
          <div className="loading-state">Loading slots...</div>
        ) : slots.length === 0 ? (
          <div className="empty-state">
            <p>No time slots created yet. Create your first slot to get started!</p>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="empty-state empty-state--filtered">
            <p>No slots match your filters.</p>
            <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
          </div>
        ) : (
          <div className="slots-list">
            {filteredSlots.map((slot) => (
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

