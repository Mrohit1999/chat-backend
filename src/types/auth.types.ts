export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: UserResponse;
}

export interface JwtPayload {
  userId: string;
}
