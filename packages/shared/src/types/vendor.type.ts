export interface Vendor {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  category: string;
  rating: number;
  createdAt: Date;
}

export interface VendorPayload {
  id: string;
  email: string;
  role: 'vendor';
}

export interface Location {
  id: string;
  vendorId: string;
  lat: number;
  lng: number;
  city?: string;
  radiusKm: number;
}