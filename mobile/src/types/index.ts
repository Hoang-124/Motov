export interface Bike {
  id: string;
  name: string;
  price: string;
  type: string;
  specs: string[];
  image: string;
  featured: boolean;
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
