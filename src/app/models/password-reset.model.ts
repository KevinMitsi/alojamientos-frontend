export interface PasswordResetRequestDTO {
  email: string;
}

export interface PasswordResetDto {
  token: string;
  newPassword: string;
}
