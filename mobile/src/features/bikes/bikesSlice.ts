import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Bike } from '../../types';
import { API_BASE_URL } from '../../constants/api';
import { apiFetch } from '../../utils/api';

// Maps a raw vehicle document from /api/vehicles (MongoDB) to the Bike interface.
// Critically, _id (ObjectId string) is mapped to Bike.id so booking API receives a valid ObjectId.
const mapVehicleToBike = (vehicle: any, idx: number): Bike => {
  const CLOUD_NAME = 'dsxbuk4pe';
  const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/bikes`;
  const num = (idx % 24) + 1;

  // Prefer imageUrls stored in the DB; fall back to Cloudinary index-based URLs
  const dbImages: string[] = Array.isArray(vehicle.imageUrls) && vehicle.imageUrls.length > 0
    ? vehicle.imageUrls
    : [
        `${BASE_URL}/${num}_1.jpg.png`,
        `${BASE_URL}/${num}_3.jpg.png`,
        `${BASE_URL}/${num}_4.jpg.png`
      ];

  const rentalPrice: number = typeof vehicle.rentalPrice === 'number' ? vehicle.rentalPrice : 0;
  const priceFormatted = rentalPrice.toLocaleString('vi-VN');

  return {
    id: vehicle._id?.toString() ?? vehicle.id,  // ObjectId string — required by booking API
    name: vehicle.vehicleModel ?? vehicle.name ?? '',
    price: `${priceFormatted}`,
    type: (typeof vehicle.category === 'object' && vehicle.category)
      ? (vehicle.category.name ?? '')
      : (vehicle.category ?? vehicle.type ?? ''),
    specs: Array.isArray(vehicle.features) ? vehicle.features : (vehicle.specs ?? []),
    image: dbImages[0],
    images: dbImages,
    featured: vehicle.featured ?? false,
    ownerEmail: vehicle.ownerId?.email,
    ownerId: vehicle.ownerId?._id ?? (typeof vehicle.ownerId === 'string' ? vehicle.ownerId : undefined),
  };
};

export const fetchBikes = createAsyncThunk('bikes/fetchBikes', async (_, { rejectWithValue }) => {
  try {
    // Use /api/vehicles which returns real MongoDB documents with ObjectId _id fields.
    // The legacy /api/bikes endpoint returns hardcoded slugs which break the booking API.
    const response = await apiFetch('/vehicles');
    const data = await response.json();
    if (data && data.success === true && Array.isArray(data.data)) {
      return data.data.map(mapVehicleToBike);
    }
    return rejectWithValue(data?.error || 'Failed to fetch bikes');
  } catch (error: any) {
    console.log('Error fetching bikes:', error);
    return rejectWithValue(error.message);
  }
});

interface BikesState {
  bikes: Bike[];
  searchQuery: string;
  selectedType: string;
  loading: boolean;
  error: string | null;
}

const initialState: BikesState = {
  bikes: [],
  searchQuery: '',
  selectedType: 'All',
  loading: false,
  error: null,
};

const bikesSlice = createSlice({
  name: 'bikes',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSelectedType(state, action: PayloadAction<string>) {
      state.selectedType = action.payload;
    },
    addBike(state, action: PayloadAction<Bike>) {
      state.bikes = [action.payload, ...state.bikes];
    },
    updateBike(state, action: PayloadAction<Bike>) {
      state.bikes = state.bikes.map(b => b.id === action.payload.id ? action.payload : b);
    },
    deleteBike(state, action: PayloadAction<string>) {
      state.bikes = state.bikes.filter(b => b.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBikes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBikes.fulfilled, (state, action: PayloadAction<Bike[]>) => {
        state.loading = false;
        state.bikes = action.payload;
      })
      .addCase(fetchBikes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch bikes';
      });
  },
});

export const { setSearchQuery, setSelectedType, addBike, updateBike, deleteBike } = bikesSlice.actions;
export default bikesSlice.reducer;
