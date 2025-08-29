export interface Message {
  id: string;
  type: 'message' | 'reply';
  message: string;
  storeId: string;
  storeName: string;
  userId: string;
  userNumber: string;
  replyTo?: string;
  createdAt: any;
}