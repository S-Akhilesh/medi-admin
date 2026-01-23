import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { type Appointment } from '../types';

const APPOINTMENTS_COLLECTION = 'appointments';

export const appointmentsService = {
  // Create a new appointment
  createAppointment: async (
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
      ...appointment,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Get all appointments
  getAllAppointments: async (): Promise<Appointment[]> => {
    const q = query(
      collection(db, APPOINTMENTS_COLLECTION),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Appointment[];
  },

  // Get appointments for a specific doctor
  getAppointmentsByDoctor: async (doctorId: string): Promise<Appointment[]> => {
    const q = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where('doctorId', '==', doctorId),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Appointment[];
  },

  // Get appointments for a specific date
  getAppointmentsByDate: async (date: string): Promise<Appointment[]> => {
    const q = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where('date', '==', date),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Appointment[];
  },

  // Get appointments by status
  getAppointmentsByStatus: async (status: Appointment['status']): Promise<Appointment[]> => {
    const q = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where('status', '==', status),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Appointment[];
  },

  // Update an appointment
  updateAppointment: async (
    appointmentId: string,
    updates: Partial<Appointment>
  ): Promise<void> => {
    const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
    await updateDoc(appointmentRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete an appointment
  deleteAppointment: async (appointmentId: string): Promise<void> => {
    await deleteDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId));
  },
};

