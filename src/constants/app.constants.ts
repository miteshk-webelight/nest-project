import { appConfig } from "src/config/app.config";

export const swaggerInfo = {
  title: "NEST Boilerplate Api Documentation",
  description: "Boilerplate of NEST project Api Documentation to test and review APIs",
};
export const globalPrefix = "api";
export const allowedOrigins = JSON.parse(appConfig.allowedOrigins);
export const ERROR_MESSAGES = {
  INVALID_EMAIL_ADDRESS: "Invalid email address",
  ATLEAST_ONE_EMAIL_IS_INVALID: "Atleast one of the email addresses is invalid",
  INVALID_SID: "Invalid sid",
};
