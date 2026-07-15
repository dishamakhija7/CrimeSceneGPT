/**
 * src/services/evidenceService.js
 *
 * All Firestore CRUD operations for the evidence collection.
 *
 * Path structure: cases/{caseId}/evidence/{evidenceId}
 *
 * Schema per document:
 *   caseId        string
 *   type          string   (UI category: 'Photos', 'Videos', …)
 *   cloudinaryUrl string   (secure_url from Cloudinary)
 *   publicId      string   (public_id from Cloudinary — needed for future deletion via API)
 *   originalName  string   (original_filename from Cloudinary)
 *   fileSize      number   (bytes)
 *   format        string   (file extension, e.g. 'jpg', 'mp4', 'pdf')
 *   uploadedBy    string   (Firebase Auth UID — never hardcoded)
 *   uploadedAt    string   (ISO 8601 timestamp)
 *   status        string   ('uploaded')
 *   evidenceId    string   (mirror of the Firestore doc ID, written after creation)
 */

import { db } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the Firestore collection reference for evidence inside a case.
 * Falls back to a top-level 'evidence' collection when no caseId is provided
 * (used during the MCQ flow before a caseId is assigned).
 */
const evidenceCol = (caseId) =>
  caseId
    ? collection(db, 'cases', caseId, 'evidence')
    : collection(db, 'evidence');

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Saves Cloudinary upload metadata to Firestore.
 *
 * @param {Object} meta
 * @param {string}  meta.caseId         - Firestore case document ID (may be 'unassigned')
 * @param {string}  meta.type           - UI category name
 * @param {string}  meta.cloudinaryUrl  - secure_url returned by Cloudinary
 * @param {string}  meta.publicId       - public_id returned by Cloudinary
 * @param {string}  meta.originalName   - original_filename from Cloudinary
 * @param {number}  meta.fileSize       - bytes
 * @param {string}  meta.format         - file format string (e.g. 'jpg')
 * @param {string}  meta.uploadedBy     - Firebase Auth UID
 * @returns {Promise<string>} The Firestore document ID
 */
export const saveEvidenceMetadata = async ({
  caseId, // undefined defaults to top-level 'evidence' collection
  type,
  cloudinaryUrl,
  publicId,
  originalName,
  fileSize,
  format,
  uploadedBy,
}) => {
  try {
    const colRef = evidenceCol(caseId);
    const docRef = await addDoc(colRef, {
      caseId: caseId || null,
      type: type || 'Unknown',
      cloudinaryUrl: cloudinaryUrl || '',
      publicId: publicId || '',
      originalName: originalName || 'Untitled',
      fileSize: fileSize || 0,
      format: format || '',
      uploadedBy: uploadedBy || '',
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
    });

    // Write the auto-generated Firestore ID back as evidenceId
    await updateDoc(docRef, { evidenceId: docRef.id });

    return docRef.id;
  } catch (error) {
    console.error('Firestore saveEvidenceMetadata error:', error);
    throw error;
  }
};

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Retrieves all evidence documents for a given case, newest first.
 * When caseId is omitted, reads from the top-level 'evidence' collection.
 *
 * @param {string} [caseId] - Firestore case document ID
 * @returns {Promise<Array>}
 */
export const getEvidenceByCase = async (caseId) => {
  try {
    const q = query(evidenceCol(caseId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
  } catch (error) {
    console.error('Firestore getEvidenceByCase error:', error);
    throw error;
  }
};

export const getEvidenceByUser = async (uid) => {
  try {
    const q = query(
      evidenceCol(),
      where('uploadedBy', '==', uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
  } catch (error) {
    console.error('Firestore getEvidenceByUser error:', error);
    throw error;
  }
};

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * Deletes a single evidence Firestore document.
 *
 * NOTE: Deleting the Cloudinary asset itself requires a server-side signed
 * request (the Cloudinary API secret must never be in the browser). A Cloud
 * Function or backend endpoint should call the Cloudinary Admin API using the
 * stored publicId when permanent deletion is required. This function only
 * removes the Firestore record.
 *
 * @param {string} evidenceId - Firestore document ID
 * @param {string} [caseId]   - Parent case ID (omit for top-level collection)
 */
export const deleteEvidenceMetadata = async (evidenceId, caseId) => {
  try {
    const colRef = evidenceCol(caseId);
    await deleteDoc(doc(colRef, evidenceId));
  } catch (error) {
    console.error('Firestore deleteEvidenceMetadata error:', error);
    throw error;
  }
};
