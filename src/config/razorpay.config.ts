import { getOsEnv } from "./env.config";

export const razorpayConfig = {
  keyId: getOsEnv("RAZORPAY_KEY_ID"),
  keySecret: getOsEnv("RAZORPAY_KEY_SECRET"),
  webhookSecret: getOsEnv("RAZORPAY_WEBHOOK_SECRET"),
};
