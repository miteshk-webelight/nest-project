export interface UserSessionDto {
  id?: string;
  userId: string;
  refreshTokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface UpdateUserSessionDto {
  refreshTokenHash?: string;
  expiresAt?: Date;
  revokedAt?: Date;
}
