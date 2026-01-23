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
import { type TimeSlot } from '../types';

const SLOTS_COLLECTION = 'slots';

export const slotsService = {
  // Create a new time slot
  createSlot: async (slot: Omit<TimeSlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, SLOTS_COLLECTION), {
      ...slot,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Get all slots for a specific doctor
  getSlotsByDoctor: async (doctorId: string): Promise<TimeSlot[]> => {
    const q = query(
      collection(db, SLOTS_COLLECTION),
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
    })) as TimeSlot[];
  },

  // Get slots for a specific date
  getSlotsByDate: async (date: string): Promise<TimeSlot[]> => {
    const q = query(
      collection(db, SLOTS_COLLECTION),
      where('date', '==', date),
      orderBy('startTime', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as TimeSlot[];
  },

  // Get all available slots
  getAvailableSlots: async (date?: string): Promise<TimeSlot[]> => {
    let q;
    if (date) {
      q = query(
        collection(db, SLOTS_COLLECTION),
        where('date', '==', date),
        where('isAvailable', '==', true),
        orderBy('startTime', 'asc')
      );
    } else {
      q = query(
        collection(db, SLOTS_COLLECTION),
        where('isAvailable', '==', true),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
      );
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as TimeSlot[];
  },

  // Update a slot
  updateSlot: async (slotId: string, updates: Partial<TimeSlot>): Promise<void> => {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    await updateDoc(slotRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete a slot
  deleteSlot: async (slotId: string): Promise<void> => {
    await deleteDoc(doc(db, SLOTS_COLLECTION, slotId));
  },
};

