require("dotenv").config();

const config = {
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  FACEBOOK_WEBHOOK_VERIFY: process.env.FACEBOOK_WEBHOOK_VERIFY,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  isDev: ! process.env.NODE_ENV?.toLowerCase().startsWith("prod"),
};

module.exports = config;
