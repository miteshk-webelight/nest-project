export const ERROR_MESSAGES = {
  USER_NOT_FOUND: "User not found",
  INVALID_CREDENTIALS: (remainingAttempts: number) => `Invalid credentials. ${remainingAttempts} attempts remaining.`,
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  USER_ALREADY_EXISTS: "User already exists",
  UNAUTHORIZED: "Unauthorized",
  LOGIN_BLOCKED: (loginBlockDuration: number) =>
    `Too many failed attempts. Your account has been blocked for ${loginBlockDuration / 60} minutes.`,
};

export const SUCCESS_MESSAGES = {
  USER_SIGNUP_SUCCESS: "User signup successfully",
  USER_LOGIN_SUCCESS: "User login successfully",
  REFRESH_TOKEN_SUCCESS: "Refresh token successfully",
  USER_LOGOUT_SUCCESS: "User logout successfully",
  RESET_PASSWORD_LINK_SENT: "Reset password link has been sent successfully to your registered email address",
  RESET_PASSWORD_SUCCESS: "Reset password successfully",
};
