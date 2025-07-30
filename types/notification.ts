// types/notification.ts
import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  message: string;
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt?: Timestamp;
}
