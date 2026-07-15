/**
 * src/services/cloudinary.js
 *
 * All Cloudinary upload operations for CrimeSceneGPT.
 * Uses the unsigned upload preset so NO API secret is exposed to the browser.
 *
 * Cloud Name  : a1noxs3f
 * Upload Preset: crimescenegpt   (must be set to "Unsigned" in Cloudinary dashboard)
 */

const CLOUD_NAME    = 'a1noxs3f';
const UPLOAD_PRESET = 'crimescenegpt';
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

/**
 * Uploads a single browser File to Cloudinary via XHR so we get real progress events.
 *
 * @param {File}     file       - The File object from the browser picker.
 * @param {Function} onProgress - Called with a 0–100 integer as bytes transfer.
 * @returns {Promise<{
 *   secure_url:        string,
 *   public_id:         string,
 *   original_filename: string,
 *   bytes:             number,
 *   format:            string,
 *   created_at:        string,
 * }>}
 */
export const uploadToCloudinary = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    // resource_type=auto is already encoded in the URL (/auto/upload)

    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL, true);

    // Progress tracking
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress(pct);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve({
            secure_url:        result.secure_url,
            public_id:         result.public_id,
            original_filename: result.original_filename ?? file.name,
            bytes:             result.bytes,
            format:            result.format,
            created_at:        result.created_at,
          });
        } catch {
          reject(new Error('Invalid JSON response from Cloudinary.'));
        }
      } else {
        let message = `Cloudinary upload failed (HTTP ${xhr.status}).`;
        try {
          const errBody = JSON.parse(xhr.responseText);
          if (errBody?.error?.message) message = errBody.error.message;
        } catch { /* ignore */ }
        reject(new Error(message));
      }
    });

    xhr.addEventListener('error', () =>
      reject(new Error('Network error during Cloudinary upload.'))
    );
    xhr.addEventListener('abort', () =>
      reject(new Error('Cloudinary upload was aborted.'))
    );

    xhr.send(formData);
  });
};
