export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO string, puedes convertir a Date si lo prefieres
  roles: UserRole[];
  profileImageUrl: string;
  description: string;
  documentsUrl: string[];
  verified: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  HOST = 'HOST'

}


export interface RegisterUserDTO {
  email: string;
  password: string;
  name: string;
  phone: string;
  dateOfBirth: string; // ISO string
}

export interface EditUser {
  name: string;
  phone: string;
  dateOfBirth: string;
  description: string;
}
