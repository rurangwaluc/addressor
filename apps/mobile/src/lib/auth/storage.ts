import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "addressorAuthToken";
const VERIFICATION_TOKEN_KEY = "addressorVerificationToken";
const EMAIL_OTP_KEY = "addressorEmailOtp";
const PHONE_OTP_KEY = "addressorPhoneOtp";

async function setItem(key: string, value: string) {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function saveAuthToken(token: string) {
  await setItem(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken() {
  return getItem(AUTH_TOKEN_KEY);
}

export async function clearAuthToken() {
  await deleteItem(AUTH_TOKEN_KEY);
}

export async function saveVerificationData(params: {
  verificationToken: string;
  emailOtp?: string;
  phoneOtp?: string;
}) {
  await setItem(VERIFICATION_TOKEN_KEY, params.verificationToken);

  if (params.emailOtp) {
    await setItem(EMAIL_OTP_KEY, params.emailOtp);
  }

  if (params.phoneOtp) {
    await setItem(PHONE_OTP_KEY, params.phoneOtp);
  }
}

export async function getVerificationData() {
  const [verificationToken, emailOtp, phoneOtp] = await Promise.all([
    getItem(VERIFICATION_TOKEN_KEY),
    getItem(EMAIL_OTP_KEY),
    getItem(PHONE_OTP_KEY),
  ]);

  return {
    verificationToken,
    emailOtp,
    phoneOtp,
  };
}