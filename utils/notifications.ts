import { db } from '@/firebase/firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { Notification } from '@/types/notification';

export const addNotification = async (
  storeId: string,
  message: string,
  startDate: Date,
  endDate: Date
): Promise<string> => {
  const notificationsRef = collection(db, 'stores', storeId, 'notifications');
  const docRef = await addDoc(notificationsRef, {
    message,
    startDate: Timestamp.fromDate(startDate),
    endDate: Timestamp.fromDate(endDate),
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getNotifications = async (
  storeId: string
): Promise<Notification[]> => {
  const notificationsRef = collection(db, 'stores', storeId, 'notifications');
  const q = query(notificationsRef, orderBy('startDate', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      message: data.message,
      startDate: data.startDate,
      endDate: data.endDate,
    };
  });
};
