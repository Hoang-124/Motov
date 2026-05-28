import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Bike } from '../../types';
import { LOCAL_BIKES } from '../../constants/mockData';

export const fetchBikes = createAsyncThunk('bikes/fetchBikes', async () => {
  try {
    const response = await fetch('http://10.0.2.2:5000/api/bikes');
    const data = await response.json();
    if (data && data.length > 0) {
      return data as Bike[];
    }
  } catch (error) {
    console.log("Using offline mock data. Server is offline.");
  }
  return LOCAL_BIKES;
});

interface BikesState {
  bikes: Bike[];
  searchQuery: string;
  selectedType: string;
  loading: boolean;
  error: string | null;
}

const initialState: BikesState = {
  bikes: LOCAL_BIKES,
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

export const { setSearchQuery, setSelectedType } = bikesSlice.actions;
export default bikesSlice.reducer;
