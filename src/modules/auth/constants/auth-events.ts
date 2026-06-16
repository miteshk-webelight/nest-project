export const AuthEvents = {
  USER_LOGGED_IN: "auth.user.logged_in",
  USER_SIGNED_UP: "auth.user.signed_up",
} as const;

export type UserLoggedInEventPayload = {
  userId: string;
  guestToken?: string;
  isNewUser: boolean;
};

export type UserSignedUpEventPayload = {
  userId: string;
  email: string;
  firstName: string;
};
