# Next + Tailwind css v4 + Firebase 프로젝트 - 온라인 주문

블로그: https://inetsos.tistory.com/

### 1. 프로젝트 만들기
  
npx create-next-app@latest next-tailwind-firebase-order-app --typescript

√ Would you like to use ESLint? ... No  
√ Would you like to use Tailwind CSS? ... Yes  
√ Would you like your code inside a `src/` directory? ... No  
√ Would you like to use App Router? (recommended) ... Yes  
√ Would you like to use Turbopack for `next dev`? ... Yes  
√ Would you like to customize the import alias (`@/*` by default)? ... Yes  
√ What import alias would you like configured? ... @/*  
Creating a new Next.js app in C:\work_2025\proj-2025\next-tailwind-firebase-cafe-app.  
  
cd next-tailwind-firebase-order-app  

npm install -D tailwindcss@latest postcss autoprefixer

### 2. Firebase 설치 및 초기화

npm install firebase

#### .env.local 환경 파일
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key  
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id  
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket  
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id  
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id  

NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG=true  # 개발 시 true  
  
NEXT_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id  
NEXT_PUBLIC_NAVER_CLIENT_SECRET=your_naver_client_secret  
NEXT_PUBLIC_NAVER_CALLBACK_URL=http://localhost:3000/naver-callback  
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id  
  
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=your_kakao_js_key  
NEXT_PUBLIC_KAKAO_REST_API_KEY=your_kakao_rest_api_key  
  
#### firebase/firebaseConfig.ts
  
```
// firebase/firebaseConfig.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

// ✅ 여기 값을 Firebase 콘솔에서 복사해서 넣으세요
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// 중복 초기화 방지
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string
  }

  interface Self {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string
  }
}

// 전화 번호 인증을 위하여 ...
// ✅ App Check 초기화 (한 번만 실행)
if (typeof window !== 'undefined') {
  // 개발 중 디버깅용 토큰 사용 가능
  if (process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG === 'true') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY! // 콘솔에서 발급받은 site key
    ),
    isTokenAutoRefreshEnabled: true, // 자동 갱신 활성화
  })
}
// --- 전화 번호 인증 끝 ---

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
```
  
### 3. 기본 UI

app/layout.tsx  
app/page.tsx
  
components/Navbar.tsx  
components/Footer.tsx  
components/LoginLink.tsx  

![Nextjs + Tailwind css v4 + Firebase 프로젝트](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FcfvSDz%2FbtsPaK7Qn47%2FAAAAAAAAAAAAAAAAAAAAAIsVvgs-g2YiwGEm23XygIDClfGWLXZ4lOnOa128oRza%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DaYAvAfQ5NcK5fZjtCzdc9d6ACFY%253D)


### 4. 전화번호 인증
  
네비게이션 바에 로그인 버튼을 추가하였습니다.  
로그인 버튼 클릭 하면 전화번호 인증 Dialog가 팝업 됩니다.  
  
인증 Dialog는 Tailwind CSS + Headless UI 조합으로 모달을 구현합니다.  
이를 위하여 Headless UI를 설치합니다.  
  
   npm install @headlessui/react  
  
전화번호 인증은 다음과 같이 동작합니다.  
  
1. 인증 다이얼로그에서 사용자가 전화번호를 입력  
2. 클라이언트(Firebase SDK)가 Google 서버에 전화번호 인증 요청  
3. Firebase가 해당 번호에 OTP(6자리 숫자)를 전송  
4. 사용자는 OTP를 입력  
5. Firebase가 OTP 유효성 검사를 하고 사용자 인증  
  
✅ 보안 처리는?	  
  reCAPTCHA 또는 SafetyNet 등을 통해 abuse(남용) 방지 합니다.  

![Nextjs + Tailwind css v4 + Firebase 프로젝트 - 전화번호 인증](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2Fn1kJo%2FbtsPa0wJAtM%2FAAAAAAAAAAAAAAAAAAAAAKavMYkUdz-LSrlrY1v-yNGtFX69U79DZrGpc1_6UfkK%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3D2E2Qy42yEPF0lwObtku3ylbQ%252BIU%253D)

![Nextjs + Tailwind css v4 + Firebase 프로젝트 - 전화번호 인증 로그인](
https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FJr1uZ%2FbtsPaeJavyR%2FAAAAAAAAAAAAAAAAAAAAAGZV2CSpPbOW8lyvsoaNY5b9onBlkBjwV64-Gr6IfyyR%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DQ6Vp5FvAnFG86N%252B7iwLwBf0Ot4I%253D)


### 5. SNS 인증 - 카카오, 네이버

#### 사용자 정보 상태 관리

로그인한 사용자의 정보를 전역적으로 사용하기 위해 상태 관리를 합니다.

npm install zustand

🧠 Zustand는 React 애플리케이션에서 상태 관리를   
간편하게 할 수 있도록 도와주는 경량 상태 관리 라이브러리예요.   
독일어로 "상태"라는 뜻을 가진 이름답게, 상태를 다루는 데 집중된 도구죠.  

---
  
#### SNS 로그인 - 카카오 로그인, 네이버 로그인
  
'order-app'은 전화번호 인증을 기본으로 합니다.  
전화번호 인증 후 로그인 상태에서 카카오 로그인, 네이버 로그인 연동을 하면  
다음부터 카카오, 네이버로 로그인할 수 있습니다.  
  
처음 전화번호 인증으로 계정이 생성됩니다.  
카카오 로그인 또는 네이버 로그인이 연동되지 않은 상태에서  
카카오 로그인 또는 네이버 로그인을 하면   
'order-app'을 전화번호 인증을 먼저 하도록 합니다.  

 #### firebase functions - 서버리스 백엔드

카카오 로그인 또는 네이버 로그인을 위하여  
백엔드로 firebase functions를 사용합니다.
  
npm install -g firebase-tools  
firebase init functions  
cd functions  
npm install axios  
  

햄버거 아이콘(Menu, X)을 사용하기 위해 아래 명령어로 설치하세요:
npm install lucide-react