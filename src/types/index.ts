export type TimeSlot = {
  id?: string;
  doctorId: string;
  doctorName: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration: number; // in minutes
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type Appointment = {
  id?: string;
  slotId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  doctorId: string;
  doctorName: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type Doctor = {
  id?: string;
  name: string;
  email: string;
  specialization?: string;
  phone?: string;
}

