import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { User } from 'firebase/auth';

const USERS_COLLECTION = 'users';

export type UserDocument = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const mapDocToUserDocument = (data: Record<string, unknown>) => {
  const createdAt = data.createdAt as Timestamp | undefined;
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    uid: data.uid as string,
    email: (data.email as string | null) ?? null,
    displayName: (data.displayName as string | null) ?? null,
    photoURL: (data.photoURL as string | null) ?? null,
    phoneNumber: (data.phoneNumber as string | null) ?? null,
    emailVerified: (data.emailVerified as boolean) ?? false,
    createdAt: createdAt?.toDate?.() as Date | undefined,
    updatedAt: updatedAt?.toDate?.() as Date | undefined,
  };
};

export const usersService = {
  /**
   * Create or update the user document in Firestore with all available auth details.
   * Call after signup or on login so the user record is always in sync.
   */
  setUserDocument: async (user: User): Promise<void> => {
    const ref = doc(db, USERS_COLLECTION, user.uid);
    const snapshot = await getDoc(ref);
    const now = Timestamp.now();
    await setDoc(
      ref,
      {
        uid: user.uid,
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        phoneNumber: user.phoneNumber ?? null,
        emailVerified: user.emailVerified,
        ...(snapshot.exists() ? {} : { createdAt: now }),
        updatedAt: now,
      },
      { merge: true }
    );
  },

  /** Get the user document from Firestore. */
  getUserDocument: async (uid: string): Promise<UserDocument | null> => {
    const ref = doc(db, USERS_COLLECTION, uid);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return mapDocToUserDocument(snapshot.data() as Record<string, unknown>);
  },

  /** Update user profile in Firestore (merge). Use with Auth updateProfile for displayName/photoURL. */
  updateUserDocument: async (
    uid: string,
    data: Partial<Pick<UserDocument, 'displayName' | 'photoURL' | 'phoneNumber'>>
  ): Promise<void> => {
    const ref = doc(db, USERS_COLLECTION, uid);
    const payload: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
    await setDoc(ref, payload, { merge: true });
  },
};
