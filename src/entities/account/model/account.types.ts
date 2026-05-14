export interface Account {
  id: string;
  userName: string;
  email: string;
  role: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateAccountPayload {
  userName: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateAccountPayload {
  userName?: string;
  email?: string;
  role?: string;
  status?: string;
}
