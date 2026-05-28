import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { launchImageLibrary } from "react-native-image-picker";
import { db } from "../data/FirebaseConfig";

const ACCOUNTS_COLLECTION = "accounts";

/**
 * Opens the device image library and returns a base64-encoded photo string
 * suitable for storing directly in Firestore.
 * Images are resized to 400x400 and compressed to stay well under the 1 MB document limit.
 * @returns {Promise<string | null>} Base64 string prefixed with a data URI, or null if cancelled.
 */
export const pickAccountPhoto = () =>
  new Promise((resolve) => {
    launchImageLibrary(
      {
        mediaType: "photo",
        includeBase64: true,
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.7,
      },
      (response) => {
        if (response.didCancel || response.errorCode || !response.assets?.length) {
          resolve(null);
          return;
        }
        const { base64, type } = response.assets[0];
        resolve(`data:${type};base64,${base64}`);
      }
    );
  });

/**
 * Create a new account document in Firestore.
 * @param {{ fullName: string, phoneNumber: string, gender: string, email: string, language: string, photo?: string }} accountData
 * @returns {Promise<string>} The ID of the created document.
 */
export const createAccount = async (accountData) => {
  const { fullName, phoneNumber, gender, email, language, photo = null } = accountData;
  const docRef = await addDoc(collection(db, ACCOUNTS_COLLECTION), {
    fullName,
    phoneNumber,
    gender,
    email,
    language,
    photo,
  });
  return docRef.id;
};

/**
 * Retrieve an account document by its ID.
 * @param {string} accountId
 * @returns {Promise<{ id: string, fullName: string, phoneNumber: string, gender: string, email: string, language: string, photo: string | null } | null>}
 */
export const getAccount = async (accountId) => {
  const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
};

/**
 * Update one or more fields of an existing account.
 * @param {string} accountId
 * @param {Partial<{ fullName: string, phoneNumber: string, gender: string, email: string, language: string, photo: string | null }>} updates
 * @returns {Promise<void>}
 */
export const updateAccount = async (accountId, updates) => {
  const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
  await updateDoc(docRef, updates);
};

/**
 * Delete an account document by its ID.
 * @param {string} accountId
 * @returns {Promise<void>}
 */
export const deleteAccount = async (accountId) => {
  const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
  await deleteDoc(docRef);
};
