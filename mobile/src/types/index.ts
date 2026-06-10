export interface Bike {
  id: string;
  name: string;
  price: string;
  type: string;
  specs: string[];
  image: string;
  images?: string[];
  featured: boolean;
  ownerEmail?: string;
}

export interface Booking {
  id: string;
  bikeId: string;
  bikeName: string;
  image: string;
  price: string;
  date: string;
  location: string;
  fullName: string;
  phone: string;
  status: string;
  createdAt: string;
}
