import {
	addDoc,
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	where,
} from "firebase/firestore";
import { db } from "../data/FirebaseConfig";

const TRIPS_COLLECTION = "trips";

/**
 * Create a new trip document in Firestore.
 * @param {{ accountId: string, pickup: object, destination: object, route: object | null, estimate: object | null, category: string, createdAt: string }} tripData
 * @returns {Promise<string>} The ID of the created document.
 */
export const createTrip = async (tripData) => {
	const docRef = await addDoc(collection(db, TRIPS_COLLECTION), tripData);
	return docRef.id;
};

/**
 * Retrieve a trip document by its ID.
 * @param {string} tripId
 * @returns {Promise<{ id: string } & Record<string, any> | null>}
 */
export const getTripById = async (tripId) => {
	const docRef = doc(db, TRIPS_COLLECTION, tripId);
	const docSnap = await getDoc(docRef);

	if (!docSnap.exists()) return null;

	return { id: docSnap.id, ...docSnap.data() };
};

/**
 * Retrieve all trips for a specific account ID.
 * @param {string} accountId
 * @returns {Promise<Array<{ id: string } & Record<string, any>>>}
 */
export const getTripsByAccountId = async (accountId) => {
	const tripsQuery = query(
		collection(db, TRIPS_COLLECTION),
		where("accountId", "==", accountId)
	);

	const querySnapshot = await getDocs(tripsQuery);

	return querySnapshot.docs.map((docSnapshot) => ({
		id: docSnapshot.id,
		...docSnapshot.data(),
	}));
};
