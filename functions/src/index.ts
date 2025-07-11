// functions/src/index.ts
import {onCall} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();

// Kakao 로그인 처리
const KAKAO_REST_API_KEY = defineSecret("KAKAO_REST_API_KEY");
const KAKAO_REDIRECT_URI = defineSecret("KAKAO_REDIRECT_URI");

export const kakaoLogin = onCall(
  {
    region: "asia-northeast3",
    secrets: [KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI],
  },
  async (request) => {
    const code = request.data?.code as string;
    if (!code) {
      throw new Error("Kakao auth code is missing.");
    }

    const clientId = process.env.KAKAO_REST_API_KEY!;
    // process.env.KAKAO_REDIRECT_URI! - 대치함
    const redirectUri = request.data?.kakaoRedirectUri;
    logger.info("Kakao redirectUri : ", redirectUri);

    // Kakao OAuth Token 요청
    const tokenRes = await axios.post("https://kauth.kakao.com/oauth/token", new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri, // 🔐 콘솔 등록된 리디렉션 URI
      code,
    }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const tokenData = tokenRes.data;
    if (!tokenData.access_token) {
      throw new Error("Failed to get Kakao access token.");
    }

    // 사용자 정보 요청
    const kakaoRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const kakaoUser = kakaoRes.data;
    const kakaoUid = `kakao:${kakaoUser.id}`;
    const nickname = kakaoUser.properties?.nickname ?? "카카오 사용자";

    const firebaseToken = await admin.auth().createCustomToken(kakaoUid, {
      provider: "KAKAO",
      nickname,
    });

    logger.info("return firebaseToken, uid, nickname: ");
    return {
      firebaseToken,
      kakaoUid,
      nickname,
    };
  }
);

// ✅ Naver 비밀 환경 변수
const NAVER_CLIENT_ID = defineSecret("NAVER_CLIENT_ID");
const NAVER_CLIENT_SECRET = defineSecret("NAVER_CLIENT_SECRET");
const NAVER_CALLBACK_URL = defineSecret("NAVER_CALLBACK_URL");

// Naver 로그인 처리 (Authorization Code 방식)
export const naverLogin = onCall(
  {
    region: "asia-northeast3",
    secrets: [NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, NAVER_CALLBACK_URL],
  },
  async (request) => {
    const code = request.data?.code as string;
    const state = request.data?.state as string;

    if (!code || !state) {
      throw new Error("Missing authorization code or state");
    }

    const clientId = process.env.NAVER_CLIENT_ID!;
    const clientSecret = process.env.NAVER_CLIENT_SECRET!;
    // process.env.NAVER_CALLBACK_URL!; 대치함
    const redirectUri = request.data?.naverRedirectUri;
    logger.info("Naver redirectUri : ", redirectUri);

    let tokenData;
    try {
      const tokenRes = await axios.post(
        "https://nid.naver.com/oauth2.0/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          code,
          state,
          redirect_uri: redirectUri,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      tokenData = tokenRes.data;
    } catch (err) {
      logger.error("Failed to exchange code for access token", err);
      throw new Error("Failed to retrieve access token from Naver");
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error("Access token not found in Naver response");
    }

    let profile;
    try {
      const profileRes = await axios.get("https://openapi.naver.com/v1/nid/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      profile = profileRes.data?.response;
    } catch (err) {
      logger.error("Failed to fetch user info from Naver", err);
      throw new Error("Failed to retrieve user info from Naver");
    }

    const uid = `naver:${profile.id}`;
    const displayName = profile.name ?? "네이버 사용자";

    try {
      await admin.auth().getUser(uid);
      await admin.auth().updateUser(uid, {displayName});
    } catch {
      await admin.auth().createUser({uid, displayName});
    }

    const firebaseToken = await admin.auth().createCustomToken(uid, {
      provider: "NAVER",
      name: displayName,
    });

    logger.info("Naver : return firebaseToken, naverUid, nickname: ");
    return {
      firebaseToken,
      naverUid: uid,
      nickname: displayName,
    };
  }
);

