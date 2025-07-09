// utils/auth.ts
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";

export async function logout() {
  try {
    await signOut(auth);
    alert("로그아웃 되었습니다.");
  } catch (error) {
    console.error("로그아웃 실패:", error);
    alert("로그아웃 중 오류가 발생했습니다.");
  }
}
