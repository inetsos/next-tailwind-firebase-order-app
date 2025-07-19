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
  
![지역 커뮤니티 시지 라이프 - SNS 로그인 연동](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FbPSAK8%2FbtsPfcp7tJZ%2FAAAAAAAAAAAAAAAAAAAAAP25LAhW-PblswgEQDsXeEhKmq87GDQvUh2X7oD-tvUH%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DkJmUnXdJ1ixZJMieCKI93veRbF4%253D)

![지역 커뮤니티 시지 라이프 - SNS 로그인](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FeaDdzb%2FbtsPd4sKbVO%2FAAAAAAAAAAAAAAAAAAAAAHsQ_dAnMxD3YLIELBAncarOLSRIhl3CxJ2TROmWEUon%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DB3IEmm%252Bx%252B6GfYvaT1urq8WgNwX0%253D)

### 6. 시지 라이프 - 매장 등록
  
매장 등록 정보는 업종, 상호, 소개, 영업시간, 휴무일, 주소, 위도/경도 입니다.  
영업 시간은 요일마다 시간을 다르게 등록할 수 있습니다.  
휴무일은 주1회, 주2회, 월 1회, 월 2회 등 다양한 조건을 설정할 수 있습니다.  
주소는 카카오 주소 API로 검색을 통하여 등록합니다.  
위도, 경도는 네이버 지도를 통하여 지도에서 위치를 선택하여 등록합니다.  
  
![지역 커뮤니티 시지 라이프 - 카카오 주소 API 사용](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FbRCT94%2FbtsPiV9kvGU%2FAAAAAAAAAAAAAAAAAAAAACVaVIS7mp_XquTxJ2EsFN2LSAfLL4lFjrS4mIpg0ln4%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DSuIG4BcS6iMtVkcrWU2tSyDOu4s%253D)

![지역 커뮤니티 시지 라이프 - 네이버 지도를 통하여 매장 위치 입력](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FQIXNk%2FbtsPj6PRL48%2FAAAAAAAAAAAAAAAAAAAAANQP6MJ7HDXlgbsJupe1dsabRTeGzdTlh5PHByB1PaVC%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DeUV2xo24etuerP4mtbuTSyBvIf8%253D)

![지역 커뮤니티 시지 라이프 - 각 요일별 영업 시간 설정](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FbUr4kZ%2FbtsPkEsoEnf%2FAAAAAAAAAAAAAAAAAAAAAPJGIdYH2ePTASoWZyacMzXVR2yVfoama4dzOCW5EA9G%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DI%252BOLz8C6SpJTMxINKR8GiPSj7Vc%253D)

![지역 커뮤니티 시지 라이프 - 매장 휴무일 설정](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2Fmk1AJ%2FbtsPjSZo7EH%2FAAAAAAAAAAAAAAAAAAAAAJEFk19AwUEG4ndwB2oNJvivsH5LxTI2LqsTEW9N7pMP%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DtmoyHatQ68FrGr9WXguUew3s5xg%253D)
  

### 7. 시지 라이프 - 메뉴 카테고리 관리 
  
메뉴에는 다양한 카테고리가 있습니다.  
카테고리를 별도 등록하고  
카테고리에 정렬 순서가 있어  
메뉴를 나타낼 때 먼저 나타나는 카테고리 순서를 조정할 수 있습니다.   
  
카테고리 정렬 순서는 드래그 앤 드롭으로 변경할 수 있습니다. 😊  

![지역 커뮤니티 시지 라이프 - 드래그 앤 드롭으로 카테고리 순서 변경](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FphxFQ%2FbtsPmgltxbD%2FAAAAAAAAAAAAAAAAAAAAAJwXC4tGpbok6R6XDS8eIGmyjozbNJJ2DxNX-4w4NbrI%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DjYHLi29D%252BwXG1DKSnZcXzjoDMO0%253D)

### 8. 시지 라이프 - 온라인 주문 메뉴 관리 

메뉴의 구조를 생각해 봅시다.   
  
특정한 음식 또는 음료에 대한 메뉴가 아니라
많은 종류의 배달 또는 포장 음식, 또는 음료에 대한 것입니다.  
  
같은 메뉴 이름에 여러 규격이 있습니다.  
1인분, 2인분, 대, 중, 소, 레귤러, 라지 등등  
규격에 따라 가격도 다릅니다.   
  
여러가지 옵션 그룹이 있습니다.  
맛 그룹으로 매운맛, 순한맛, 보통맛  
온도 그룹으로 핫, 아이스  
샷추가, 사리 추가, 토핑 추가 등 주 메뉴에 추가되는 옵션들  
필수적으로 선택해야 하는 옵션들과  
선택적으로 선택해야 하는 옵션들이 있습니다.   
  
이와 같은 구조를 가진 메뉴 시스템을 구현합니다.  

![지역 커뮤니티 시지 라이프 - 메뉴 관리](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FGs6A6%2FbtsPm3TUbzn%2FAAAAAAAAAAAAAAAAAAAAAOMzlB1MjcRxJk20geD6LO5fUTgtTI4KuRhNAOvPoCaF%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3D3nOyVnqfDUu%252FhfIoEjVcEqSMxys%253D)

![지역 커뮤니티 시지 라이프 - 메뉴 등록](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FbOyh8M%2FbtsPmg0vjLh%2FAAAAAAAAAAAAAAAAAAAAAJ1JNoeUmJPtx9tioCR5Iur-R5fPUJo91wi09CQ0Orjg%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DZZIv5ricO%252BL3Gp6hehYoJ8gDdJ8%253D)
  
### 9. 시지 라이프 - 등록 메뉴 순서 변경
  
등록된 카테고리의 순서를 변경할 수 있습니다.   
카테고리별로 각 카테고리에 속한 메뉴의 순서를 드래그 앤 드롭으로 변경할 수 있습니다.  
  
![지역 커뮤니티 시지 라이프 - 드래그 앱 드롭으로 메뉴 순서 변경](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2Fb1ARsW%2FbtsPnrmDDsS%2FAAAAAAAAAAAAAAAAAAAAAC8--k2MkuYk9MuT4Xb9xWl2to4WCDhQv1Va6a6R_Gg7%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1753973999%26allow_ip%3D%26allow_referer%3D%26signature%3DuBG2nq6AQZ5R93TXOJ%252BZMEGnPj4%253D)

npm install dayjs
npm install react-to-print@latest


```
next-tailwind-firebase-order-app
├─ .firebaserc
├─ app
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ kakao-callback
│  │  ├─ KakaoCallbackHandler.tsx
│  │  └─ page.tsx
│  ├─ layout.tsx
│  ├─ login
│  │  └─ page.tsx
│  ├─ mypage
│  │  └─ page.tsx
│  ├─ naver-callback
│  │  ├─ NaverCallbackHandler.tsx
│  │  └─ page.tsx
│  ├─ naver-map-view
│  │  ├─ NaverMapViewClient.tsx
│  │  └─ page.tsx
│  ├─ page.tsx
│  ├─ store
│  │  ├─ edit
│  │  │  └─ [storeId]
│  │  │     └─ page.tsx
│  │  ├─ manage
│  │  │  └─ page.tsx
│  │  ├─ register
│  │  │  └─ page.tsx
│  │  └─ [storeId]
│  │     ├─ cart
│  │     │  └─ page.tsx
│  │     ├─ categories
│  │     │  └─ new
│  │     │     └─ page.tsx
│  │     ├─ menus
│  │     │  ├─ new
│  │     │  │  └─ page.tsx
│  │     │  ├─ page.tsx
│  │     │  ├─ sort
│  │     │  │  ├─ MenuSortList.tsx
│  │     │  │  └─ page.tsx
│  │     │  └─ [menuId]
│  │     │     ├─ edit
│  │     │     │  └─ page.tsx
│  │     │     └─ order
│  │     │        └─ page.tsx
│  │     └─ page.tsx
│  └─ store-list
│     └─ page.tsx
├─ components
│  ├─ CartView.tsx
│  ├─ CategoryManager.tsx
│  ├─ ErrorBoundaryClient.tsx
│  ├─ Footer.tsx
│  ├─ GlobalErrorSetup.tsx
│  ├─ GoogleRedirectHandler.tsx
│  ├─ LoginLink.tsx
│  ├─ MenuByCategory.tsx
│  ├─ MenuForm.tsx
│  ├─ MenuList.tsx
│  ├─ modals
│  │  ├─ BusinessHoursModal.tsx
│  │  └─ HolidayRuleModal.tsx
│  ├─ MyPageContent.tsx
│  ├─ Navbar.tsx
│  ├─ OptionGroupForm copy.tsx
│  ├─ OptionGroupForm.tsx
│  ├─ PhoneAuth.tsx
│  ├─ PhoneAuthModal.tsx
│  └─ StoreList.tsx
├─ context
│  └─ CartContext.tsx
├─ firebase
│  └─ firebaseConfig.ts
├─ firebase.json
├─ functions
│  ├─ .eslintrc.js
│  ├─ lib
│  │  ├─ index.js
│  │  └─ index.js.map
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ pglite-debug.log
│  ├─ src
│  │  └─ index.ts
│  ├─ tsconfig.dev.json
│  └─ tsconfig.json
├─ hooks
│  ├─ useAuth.ts
│  ├─ useHandleGoogleRedirectLogin.ts
│  └─ useUserLocation.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ pglite-debug.log
├─ postcss.config.mjs
├─ public
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ icons
│  │  ├─ kakao-logo.png
│  │  └─ naver-logo.png
│  ├─ kakao-login.png
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ stores
│  └─ userStore.ts
├─ tailwind.config.js
├─ tsconfig.json
├─ types
│  ├─ cart.ts
│  ├─ menu.ts
│  ├─ naver.d.ts
│  ├─ order.ts
│  ├─ store.ts
│  └─ UserData.ts
└─ utils
   ├─ auth.ts
   ├─ cartStorage.ts
   ├─ firestoreUtils.ts
   ├─ localCart.ts
   ├─ logger.ts
   ├─ setupGlobalErrorHandler.ts
   └─ socialLogin.ts

```