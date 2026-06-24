import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase client
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
