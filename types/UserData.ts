// types/UserData.ts
export type UserData = {
  userId: string;            // Firebase UID
  email?: string;            // 이메일 로그인 시 사용
  phoneNumber?: string;      // 전화번호 로그인 시 사용
  displayName?: string;      // 사용자 이름
  role?: string;              // 권한 (예: 'customer', 'admin')
  createdAt?: any;           // Firestore serverTimestamp
  uids: string[];            // 연결된 모든 Firebase UID 목록
  uniqueNumber:string;
};
