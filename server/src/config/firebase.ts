import admin from 'firebase-admin';

const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const serviceAccountPath = process.env.FIREBASE_KEY_PATH;

let initialized = false;

try {
  if (serviceAccountKeyBase64) {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully using environment service account key.');
    initialized = true;
  } else if (serviceAccountPath) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    });
    console.log('Firebase Admin initialized from path:', serviceAccountPath);
    initialized = true;
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp();
    console.log('Firebase Admin initialized with application default credentials.');
    initialized = true;
  } else {
    console.warn('Firebase configuration missing. Firebase Phone Auth will not function.');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

export const firebaseAdmin = initialized ? admin : null;
export default firebaseAdmin;
