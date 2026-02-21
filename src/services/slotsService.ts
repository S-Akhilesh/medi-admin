import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { type TimeSlot } from '../types';

const SLOTS_COLLECTION = 'slots';

const sortSlots = (slots: TimeSlot[]) => {
  // Sort by date then startTime (both lexicographically sortable formats)
  return [...slots].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
    return a.endTime.localeCompare(b.endTime);
  });
};

const sanitizeSlotUpdates = (updates: Partial<TimeSlot>) => {
  // Prevent accidental writes of derived/immutable fields.
  // Also avoids writing undefined values for optional fields.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...rest } = updates;
  return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) as Record<string, unknown>;
};

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
    // NOTE: Avoid composite-index requirements by not using orderBy here.
    // We sort client-side to keep CRUD working out-of-the-box.
    const q = query(collection(db, SLOTS_COLLECTION), where('doctorId', '==', doctorId));
    const querySnapshot = await getDocs(q);
    const slots = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as TimeSlot[];
    return sortSlots(slots);
  },

  // Get slots for a specific date
  getSlotsByDate: async (date: string): Promise<TimeSlot[]> => {
    // Avoid composite-index requirements; sort client-side.
    const q = query(collection(db, SLOTS_COLLECTION), where('date', '==', date));
    const querySnapshot = await getDocs(q);
    const slots = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as TimeSlot[];
    return sortSlots(slots);
  },

  // Get all available slots
  getAvailableSlots: async (date?: string): Promise<TimeSlot[]> => {
    let q;
    if (date) {
      q = query(
        collection(db, SLOTS_COLLECTION),
        where('date', '==', date),
        where('isAvailable', '==', true)
      );
    } else {
      q = query(
        collection(db, SLOTS_COLLECTION),
        where('isAvailable', '==', true),
      );
    }
    const querySnapshot = await getDocs(q);
    const slots = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as TimeSlot[];
    return sortSlots(slots);
  },

  // Update a slot
  updateSlot: async (slotId: string, updates: Partial<TimeSlot>): Promise<void> => {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    await updateDoc(slotRef, {
      ...sanitizeSlotUpdates(updates),
      updatedAt: Timestamp.now(),
    });
  },

  // Delete a slot
  deleteSlot: async (slotId: string): Promise<void> => {
    await deleteDoc(doc(db, SLOTS_COLLECTION, slotId));
  },
};

