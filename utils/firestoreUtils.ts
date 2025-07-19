import { Timestamp } from 'firebase/firestore';

export function convertFirestoreTimestamp<T extends Record<string, any>>(doc: T): T {
  return {
    ...doc,
    createdAt: doc.createdAt instanceof Timestamp ? doc.createdAt.toDate().toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Timestamp ? doc.updatedAt.toDate().toISOString() : doc.updatedAt,
  };
}
