import { collection, query, where, orderBy, limit, 
  startAfter, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export async function getCustomerMessages(storeId: string, lastDoc: any, limitCount: number) {
  const q = query(
    collection(db, "stores", storeId, "voiceOfCustomer"),
    where("type", "==", "message"),          // 고객 문의만 가져오기
    orderBy("createdAt", "desc"),
    ...(lastDoc ? [startAfter(lastDoc)] : []),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return { messages, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
}

export async function getReplies(storeId: string, messageId: string) {
  const q = query(
    collection(db, "stores", storeId, "voiceOfCustomer"),
    where("replyTo", "==", messageId),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addReply(storeId: string, questionId: string, message: string, operatorId: string) {
  await addDoc(collection(db, "stores", storeId, "voiceOfCustomer"), {
    type: "reply",
    message,
    storeId,
    storeName: "",          // 필요 시
    userId: operatorId,     // 점주/운영자 ID
    userNumber: "",         // 필요 시
    replyTo: questionId,
    createdAt: serverTimestamp(),
  });
}
