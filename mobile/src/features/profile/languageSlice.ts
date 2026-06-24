import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Language } from '../../locales';

interface LanguageState {
  language: Language;
}

const initialState: LanguageState = {
  language: 'vi',
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
