import { storage } from '../firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

/**
 * Maps a UI category name to the correct Storage folder path.
 */
const FOLDER_MAP = {
  'Photos':         'evidence/images',
  'Videos':         'evidence/videos',
  'CCTV Footage':   'evidence/cctv',
  'Dashcam':        'evidence/dashcam',
  'Audio':          'evidence/audio',
  'Documents':      'evidence/documents',
  'Text Statement': 'evidence/statements',
  'Sketch/Map':     'evidence/sketches',
};

/**
 * Uploads a single File to Firebase Storage under the appropriate folder.
 *
 * @param {File}     file             - The file object from the browser File API.
 * @param {string}   category         - One of the UI category names (e.g. 'Photos').
 * @param {string}   uid              - Current Firebase user UID, used to namespace the path.
 * @param {Function} onProgress       - Called with a 0-100 number as upload progresses.
 * @returns {Promise<{downloadURL: string, storagePath: string}>}
 */
export const uploadFileToStorage = (file, category, uid, onProgress) => {
  return new Promise((resolve, reject) => {
    const folder = FOLDER_MAP[category] ?? 'evidence/misc';
    // Unique path: evidence/images/<uid>/<timestamp>_<filename>
    const storagePath = `${folder}/${uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadURL, storagePath });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Deletes a file from Firebase Storage by its stored path.
 *
 * @param {string} storagePath - The full path string stored when the file was uploaded.
 * @returns {Promise<void>}
 */
export const deleteFileFromStorage = async (storagePath) => {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (error) {
    // If the file doesn't exist, do not crash (e.g. already deleted)
    if (error.code !== 'storage/object-not-found') {
      console.error('Storage delete error:', error);
      throw error;
    }
  }
};
