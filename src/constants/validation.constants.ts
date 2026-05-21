export const VALIDATION_REGEX = {
  NAME: /^[a-zA-Z\s'-]+$/,
  BUSINESS_NAME: /^[a-zA-Z0-9\s'-]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).+$/,
};
