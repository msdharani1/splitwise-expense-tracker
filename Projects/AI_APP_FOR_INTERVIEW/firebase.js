import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA_BiB-5jw8IxjPs2BsuhjaXir55rYacnk",
  authDomain: "aiapp-54751.firebaseapp.com",
  projectId: "aiapp-54751",
  storageBucket: "aiapp-54751.appspot.com",
  messagingSenderId: "552976507312",
  appId: "1:552976507312:web:97060a799e854779c1f675",
  measurementId: "G-TP3Q4175V3",
  databaseURL: "https://aiapp-54751-default-rtdb.firebaseio.com/",
};

// Initialize Firebase only if it hasn't been initialized yet
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Use the already initialized app
}

// Initialize auth
const auth = getAuth(app);

// Initialize database
const database = getDatabase(app);

export { auth, database };