/**
 * Firebase Configuration
 * Replace the placeholder values with your actual project credentials 
 * from the Firebase Console (Project Settings > General > Your Apps).
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDzimCdc6EQDeR1QS6Q_lfrdMmmT_pBJ04",
    authDomain: "crown-academy-82fd7.firebaseapp.com",
    projectId: "crown-academy-82fd7",
    storageBucket: "crown-academy-82fd7.firebasestorage.app",
    messagingSenderId: "340967015259",
    appId: "1:340967015259:web:fbef530cea3637b8a9507e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export for use in other files
export { db, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, getDoc };
