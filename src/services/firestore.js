import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';

/**
 * ==========================================
 * FIRESTORE DATABASE COLLECTIONS
 * ==========================================
 * - users
 * - cases
 * - evidence
 * - reports
 */

// --- Helper Functions for 'users' Collection ---

/**
 * Creates a new user document in Firestore.
 * @param {string} uid - User ID from Firebase Auth
 * @param {string} name - User's full name
 * @param {string} email - User's email address
 */
export const createUserProfile = async (uid, name, email) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid,
      name,
      email,
      createdAt: new Date().toISOString()
    });
    return uid;
  } catch (error) {
    console.error("Error creating user profile in Firestore:", error);
    throw error;
  }
};

// --- Helper Functions for 'cases' Collection ---

const casesCollection = collection(db, 'cases');

/**
 * Creates a new case document in Firestore.
 * @param {string} caseId - The unique identifier for the case (e.g. 'INV-2025-0716').
 * @param {Object} caseData - The case data matching the schema.
 * @returns {Promise<string>} The ID of the created case.
 */
export const createCase = async (caseId, caseData) => {
  try {
    const caseRef = doc(db, 'cases', caseId);
    await setDoc(caseRef, {
      ...caseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return caseId;
  } catch (error) {
    console.error("Error creating case:", error);
    throw error;
  }
};

/**
 * Retrieves all cases for a specific user (by their UID), ordered by creation date descending.
 * @param {string} uid - Firebase Auth UID of the user.
 * @returns {Promise<Array>} Array of case objects belonging to that user.
 */
export const getCasesByUser = async (uid) => {
  try {
    const q = query(casesCollection, where('createdBy', '==', uid), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const cases = [];
    querySnapshot.forEach((docSnap) => {
      cases.push({ id: docSnap.id, ...docSnap.data() });
    });
    return cases;
  } catch (error) {
    // Fallback: if composite index missing, fetch all and filter client-side
    console.warn('getCasesByUser index fallback:', error.message);
    const all = await getCases();
    return all.filter(c => c.createdBy === uid);
  }
};

/**
 * Retrieves all cases from Firestore, ordered by creation date descending.
 * @returns {Promise<Array>} Array of case objects.
 */
export const getCases = async () => {
  try {
    const q = query(casesCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const cases = [];
    querySnapshot.forEach((docSnap) => {
      cases.push({ id: docSnap.id, ...docSnap.data() });
    });
    return cases;
  } catch (error) {
    console.error("Error getting all cases:", error);
    throw error;
  }
};

/**
 * Retrieves a single case by its ID.
 * @param {string} caseId - The ID of the case to retrieve.
 * @returns {Promise<Object>} The case document data.
 */
export const getCaseById = async (caseId) => {
  try {
    const caseRef = doc(db, 'cases', caseId);
    const caseSnap = await getDoc(caseRef);
    if (caseSnap.exists()) {
      return { id: caseSnap.id, ...caseSnap.data() };
    } else {
      throw new Error("Case not found");
    }
  } catch (error) {
    console.error("Error getting case by id:", error);
    throw error;
  }
};

/**
 * Updates an existing case with new data.
 * @param {string} caseId - The ID of the case to update.
 * @param {Object} updatedData - The fields to update.
 * @returns {Promise<boolean>} True if successful.
 */
export const updateCase = async (caseId, updatedData) => {
  try {
    const caseRef = doc(db, 'cases', caseId);
    await updateDoc(caseRef, {
      ...updatedData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating case:", error);
    throw error;
  }
};

/**
 * Deletes a case by its ID.
 * @param {string} caseId - The ID of the case to delete.
 * @returns {Promise<boolean>} True if successful.
 */
export const deleteCase = async (caseId) => {
  try {
    const caseRef = doc(db, 'cases', caseId);
    await deleteDoc(caseRef);
    return true;
  } catch (error) {
    console.error("Error deleting case:", error);
    throw error;
  }
};
