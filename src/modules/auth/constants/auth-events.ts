export const AuthEvents = {
  USER_LOGGED_IN: "auth.user.logged_in",
} as const;

export type UserLoggedInEventPayload = {
  userId: string;
  guestToken?: string;
  isNewUser: boolean;
};
