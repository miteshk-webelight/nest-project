export const VALIDATION_REGEX = {
  NAME: /^[a-zA-Z\s'-]+$/,
  BUSINESS_NAME: /^[a-zA-Z0-9\s'-]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).+$/,
  SKU: /^[a-zA-Z0-9-_]+$/,
};

export const VALIDATION_MESSAGES = {
  INVALID_NAME: "Only letters, spaces, hyphens and apostrophes are allowed",
  INVALID_BUSINESS_NAME: "Business name can only contain letters, numbers, spaces, hyphens and apostrophes",
  INVALID_PASSWORD:
    "Password must contain at least one uppercase letter, one lowercase letter and one special character",
  INVALID_SKU: "Only letters, numbers, hyphens and underscores are allowed",
};
