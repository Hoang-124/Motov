import { API_BASE_URL } from '../constants/api';

export const CLOUD_NAME = 'dsxbuk4pe';
export const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/bikes`;
export const DEFAULT_BIKE_IMAGE = `${CLOUDINARY_BASE_URL}/1_3.jpg.png`;

export const getCloudinaryFallbackByModel = (modelName?: string): string => {
  if (!modelName) return DEFAULT_BIKE_IMAGE;
  const name = modelName.toLowerCase();
  if (name.includes('cb300r') || name.includes('honda cb')) return `${CLOUDINARY_BASE_URL}/1_3.jpg.png`;
  if (name.includes('xsr155') || name.includes('yamaha xsr')) return `${CLOUDINARY_BASE_URL}/2_3.jpg.png`;
  if (name.includes('ninja') || name.includes('kawasaki')) return `${CLOUDINARY_BASE_URL}/3_3.jpg.png`;
  if (name.includes('air blade') || name.includes('airblade')) return `${CLOUDINARY_BASE_URL}/4_3.jpg.png`;
  if (name.includes('lead')) return `${CLOUDINARY_BASE_URL}/5_3.jpg.png`;
  if (name.includes('vision')) return `${CLOUDINARY_BASE_URL}/6_3.jpg.png`;
  if (name.includes('sh 150') || name.includes('sh150') || name.includes('sh mode')) return `${CLOUDINARY_BASE_URL}/7_3.jpg.png`;
  if (name.includes('vespa')) return `${CLOUDINARY_BASE_URL}/8_3.jpg.png`;
  if (name.includes('winner') || name.includes('winner x')) return `${CLOUDINARY_BASE_URL}/9_3.jpg.png`;
  if (name.includes('exciter')) return `${CLOUDINARY_BASE_URL}/10_3.jpg.png`;
  if (name.includes('wave')) return `${CLOUDINARY_BASE_URL}/11_3.jpg.png`;
  if (name.includes('sirius')) return `${CLOUDINARY_BASE_URL}/12_3.jpg.png`;
  if (name.includes('nvx')) return `${CLOUDINARY_BASE_URL}/13_3.jpg.png`;
  if (name.includes('grande')) return `${CLOUDINARY_BASE_URL}/14_3.jpg.png`;
  if (name.includes('janus')) return `${CLOUDINARY_BASE_URL}/15_3.jpg.png`;
  if (name.includes('attila') || name.includes('elizabeth') || name.includes('venus') || name.includes('sym')) return `${CLOUDINARY_BASE_URL}/16_3.jpg.png`;

  return DEFAULT_BIKE_IMAGE;
};

export const resolveImageUrl = (url?: string, modelName?: string): string => {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'undefined' || url === 'null') {
    return getCloudinaryFallbackByModel(modelName);
  }

  const cleanUrl = url.trim();

  // If already an absolute URL (Cloudinary, Unsplash, http, https, data URI)
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }

  // Relative path uploaded to backend server (e.g., /uploads/image-123.jpg or uploads/image-123.jpg)
  const serverHost = API_BASE_URL.replace(/\/api\/?$/, '');
  const relativePath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  return `${serverHost}${relativePath}`;
};
