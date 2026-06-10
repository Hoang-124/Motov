import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Bike } from '../../types';
import { LOCAL_BIKES } from '../../constants/mockData';
import { API_BASE_URL } from '../../constants/api';

const mapBikesWithCloudinary = (list: Bike[]): Bike[] => {
  const CLOUD_NAME = 'dsxbuk4pe';
  const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/bikes`;

  return list.map((bike, idx) => {
    const num = (idx % 24) + 1;
    return {
      ...bike,
      image: `${BASE_URL}/${num}_3.jpg.png`,
      images: [
        `${BASE_URL}/${num}_1.jpg.png`,
        `${BASE_URL}/${num}_3.jpg.png`,
        `${BASE_URL}/${num}_4.jpg.png`
      ]
    };
  });
};

export const fetchBikes = createAsyncThunk('bikes/fetchBikes', async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/bikes`);
    const data = await response.json();
    if (data && data.length > 0) {
      return mapBikesWithCloudinary(data as Bike[]);
    }
  } catch (error) {
    console.log("Using offline mock data. Server is offline.", error);
  }
  return mapBikesWithCloudinary(LOCAL_BIKES);
});

interface BikesState {
  bikes: Bike[];
  searchQuery: string;
  selectedType: string;
  loading: boolean;
  error: string | null;
}

const initialState: BikesState = {
  bikes: mapBikesWithCloudinary(LOCAL_BIKES),
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
      .addCase(fetchBikes.rejected, (state) => {
        state.loading = false;
        // Fallback to local bikes on failure
        state.bikes = LOCAL_BIKES;
      });
  },
});

export const { setSearchQuery, setSelectedType, addBike, updateBike, deleteBike } = bikesSlice.actions;
export default bikesSlice.reducer;
