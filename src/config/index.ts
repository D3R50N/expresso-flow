import dotenv from "dotenv";

dotenv.config();

interface Config {
  FACEBOOK_APP_ID: string;
  FACEBOOK_APP_SECRET: string;
  FACEBOOK_WEBHOOK_VERIFY: string;
  isDev: boolean;
}

const config: Config = {
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || "",
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || "",
  FACEBOOK_WEBHOOK_VERIFY: process.env.FACEBOOK_WEBHOOK_VERIFY || "",
  isDev: !process.env.NODE_ENV?.toLowerCase().startsWith("prod"),
};

export default config;
