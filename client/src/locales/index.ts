import { vi } from './vi';
import { en } from './en';
import { ko } from './ko';

export const translations = { vi, en, ko };
export type Language = 'vi' | 'en' | 'ko';
export type { TranslationKeys } from './vi';
