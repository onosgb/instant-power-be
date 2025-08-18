import { RoleEnum, StatusEnum } from 'prisma';

export interface RoleInterface {
  role: 'User' | 'Admin';
}

export interface UserInterface {
  id: string;
  name: string;
  email: string;
  role?: RoleEnum;
  accessToken?: string | null;
  refreshToken?: string | null;
  oauth: boolean;
  oauthProvider?: string | null;
  status: StatusEnum;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanInterface {
  id: string;
  name: string;
  price: number;
  description?: string;
  monthlyRequestLimit: number;
  createdAt: Date;
  updatedAt: Date;
  users?: UserInterface[]; // A plan can have many users
}

export interface Verification {
  id: string;
  userId: string;
  code: string;
  expires: Date;
}
