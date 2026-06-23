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
  ownerId?: string;
}

export interface Surcharge {
  surchargeType: string;
  amount: number;
  description: string;
}

export interface TrackingEvent {
  title: string;
  time: string;
  status: string;
  completed: boolean;
}

export interface Booking {
  id: string;
  bookingCode?: string;
  bikeId: string;
  bikeName: string;
  image: string;
  price: string;
  date: string;
  location: string;
  fullName: string;
  phone: string;
  status: string;
  statusLabel?: string;
  createdAt: string;
  
  // New API/Web aligned fields
  pickupDateTime?: string;
  returnDateTime?: string;
  pickupLocation?: {
    address: string;
  };
  returnLocation?: {
    address: string;
  };
  rentalDays?: number;
  totalAmount?: number;
  cancelReason?: string;
  surcharges?: Surcharge[];
  timeline?: TrackingEvent[];
  feedback?: {
    rating: number;
    content: string;
  };
}

export interface OwnerRequest {
  id: string;
  username: string;
  email: string;
  name: string;
  phoneNumber?: string;
  status: string;
  ownerRequestStatus: string;
  createdAt: string;
}
