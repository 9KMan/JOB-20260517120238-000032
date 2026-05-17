export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  createdAt: Date;
}

export interface CustomerPayload {
  id: string;
  email: string;
  role: 'customer';
}