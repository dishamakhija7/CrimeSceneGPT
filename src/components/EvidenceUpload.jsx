import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Camera, Video, Film, Mic, Map, Car, Files, 
  Upload, X, Check, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { saveEvidenceMetadata, getEvidenceByUser, deleteEvidenceMetadata } from '../services/evidenceService';

/** Accepted MIME types per category (Text Statement is handled separately) */
const ACCEPT_MAP = {
  'Photos':       'image/*',
  'Videos':       'video/*',
  'CCTV Footage': 'video/*',
  'Audio':        'audio/*',
  'Sketch/Map':   'image/*,.pdf',
  'Dashcam':      'video/*',
  'Documents':    '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt',
};

/** Whether the picker should allow multiple file selection */
const MULTI_MAP = {
  'Photos':       true,
  'Videos':       true,
  'CCTV Footage': true,
  'Audio':        true,
  'Sketch/Map':   true,
  'Dashcam':      true,
  'Documents':    true,
};

/** Format raw byte count to human-readable string */
const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function EvidenceUpload({ caseId, onContinue, onBack }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progressMap, setProgressMap] = useState({}); // { tempKey: 0-100 }
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  // Text Statement inline modal
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementText, setStatementText] = useState('');
  const [savingStatement, setSavingStatement] = useState(false);
  const fileInputRef = useRef(null);
  const activeCategoryRef = useRef(null);

  const categories = [
    { name: 'Text Statement', icon: <FileText className="w-6 h-6 text-accentTeal" /> },
    { name: 'Photos',         icon: <Camera   className="w-6 h-6 text-accentPurple" /> },
    { name: 'Videos',         icon: <Video    className="w-6 h-6 text-yellow-500" /> },
    { name: 'CCTV Footage',   icon: <Film     className="w-6 h-6 text-red-500" /> },
    { name: 'Audio',          icon: <Mic      className="w-6 h-6 text-green-500" /> },
    { name: 'Sketch/Map',     icon: <Map      className="w-6 h-6 text-blue-400" /> },
    { name: 'Dashcam',        icon: <Car      className="w-6 h-6 text-accentTeal" /> },
    { name: 'Documents',      icon: <Files    className="w-6 h-6 text-gray-400" /> },
  ];

  // ─── Load persisted evidence on mount ────────────────────────────────────
  useEffect(() => {
    const loadEvidence = async () => {
      const user = auth.currentUser;
      if (!user) { setLoadingFiles(false); return; }
      try {
        const docs = await getEvidenceByUser(user.uid);
        const VISUAL_TYPES = ['Photos', 'CCTV Footage', 'Dashcam', 'Videos'];
        const mapped = docs.map((d) => {
          let thumb = '';
          if (VISUAL_TYPES.includes(d.type) && d.cloudinaryUrl) {
            thumb = d.cloudinaryUrl;
            if (['CCTV Footage', 'Dashcam', 'Videos'].includes(d.type)) {
              thumb = thumb.replace(/\.[^/.]+$/, '.jpg');
            }
          }
          return {
            id:        d.id,
            name:      d.originalName || d.fileName || 'Untitled',
            type:      d.type,
            size:      formatSize(d.fileSize),
            publicId:  d.publicId,
            thumbnail: thumb,
            url:       d.cloudinaryUrl,
            statementText: d.statementText || '',
          };
        });
        setUploadedFiles(mapped);
      } catch (err) {
        console.error('Failed to load evidence:', err);
      } finally {
        setLoadingFiles(false);
      }
    };
    loadEvidence();
  }, []);

  // ─── Text Statement: save directly to Firestore (no file) ────────────────
  const handleSaveStatement = async () => {
    const user = auth.currentUser;
    if (!statementText.trim() || !user) return;
    setSavingStatement(true);
    setError(null);
    try {
      const blob = new Blob([statementText], { type: 'text/plain' });
      const tempKey = `${Date.now()}_statement`;
      setProgressMap((prev) => ({ ...prev, [tempKey]: 0 }));

      // Simulate quick progress for UI
      setTimeout(() => setProgressMap((prev) => ({ ...prev, [tempKey]: 50 })), 200);

      const filename = `Statement_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`;

      // Skip Cloudinary for text statements, save directly to Firestore
      const evidenceId = await saveEvidenceMetadata({
        caseId:        caseId || null,
        type:         'Text Statement',
        cloudinaryUrl: '', 
        publicId:      tempKey,
        originalName:  filename,
        fileSize:      blob.size,
        format:        'txt',
        uploadedBy:    user.uid,
        statementText: statementText
      });

      setProgressMap((prev) => ({ ...prev, [tempKey]: 100 }));

      setUploadedFiles((prev) => [
        { id: evidenceId, name: filename, type: 'Text Statement', size: formatSize(blob.size), thumbnail: '', statementText: statementText, url: '' },
        ...prev,
      ]);
      
      setTimeout(() => {
        setProgressMap((prev) => { const n = { ...prev }; delete n[tempKey]; return n; });
        setStatementText('');
        setStatementOpen(false);
      }, 500);
    } catch (err) {
      console.error('Statement save failed:', err);
      setError('Failed to save statement. Please try again.');
    } finally {
      setSavingStatement(false);
    }
  };

  // ─── Trigger hidden file input ────────────────────────────────────────────
  const handleCategoryClick = (categoryName) => {
    if (categoryName === 'Text Statement') {
      setStatementOpen(true);
      return;
    }
    activeCategoryRef.current = categoryName;
    fileInputRef.current.value    = '';
    fileInputRef.current.accept   = ACCEPT_MAP[categoryName] || '*/*';
    fileInputRef.current.multiple = MULTI_MAP[categoryName]  ?? true;
    fileInputRef.current.click();
  };

  // ─── Handle file picker selection → Cloudinary upload ───────────────────
  const handleFilesSelected = async (e) => {
    const files    = Array.from(e.target.files);
    const category = activeCategoryRef.current;
    const user     = auth.currentUser;

    if (!files.length || !user) return;
    setError(null);
    setSuccessMsg('');
    setUploading(true);

    const uploadPromises = files.map(async (file, index) => {
      const tempKey = `${Date.now()}_${index}_${file.name}`;
      setProgressMap((prev) => ({ ...prev, [tempKey]: 0 }));

      try {
        // 1. Upload to Cloudinary (XHR with real progress)
        const result = await uploadToCloudinary(
          file,
          (pct) => setProgressMap((prev) => ({ ...prev, [tempKey]: pct }))
        );

        // 2. Save metadata to Firestore under the active case
        // 2. Save metadata to Firestore under the active case
        const evidenceId = await saveEvidenceMetadata({
          caseId:        caseId || null,
          type:          category,
          cloudinaryUrl: result.secure_url,
          publicId:      result.public_id,
          originalName:  result.originalName || file.name,
          fileSize:      result.bytes,
          format:        result.format,
          uploadedBy:    user.uid,
        });

        // 3. Append to local state
        const VISUAL_TYPES = ['Photos', 'CCTV Footage', 'Dashcam', 'Videos'];
        let thumb = '';
        if (VISUAL_TYPES.includes(category) && result.secure_url) {
          thumb = result.secure_url;
          if (['CCTV Footage', 'Dashcam', 'Videos'].includes(category)) {
            // Cloudinary trick: change extension to .jpg to get video thumbnail
            thumb = thumb.replace(/\.[^/.]+$/, '.jpg');
          }
        }

        setUploadedFiles((prev) => [
          {
            id:        evidenceId,
            name:      result.originalName || file.name,
            type:      category,
            size:      formatSize(result.bytes),
            publicId:  result.public_id,
            thumbnail: thumb,
            url:       result.secure_url,
          },
          ...prev,
        ]);
        return true;
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        setError((prevError) => prevError ? `${prevError}\nFailed to upload "${file.name}". ${err.message}` : `Failed to upload "${file.name}". ${err.message}`);
        return false;
      } finally {
        setProgressMap((prev) => { const n = { ...prev }; delete n[tempKey]; return n; });
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(Boolean).length;
    if (successCount > 0) {
      setSuccessMsg(`Successfully uploaded ${successCount} file(s).`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
    
    setUploading(false);
  };

  // ─── Delete single file (Firestore only — Storage deletion needs server) ──
  const handleRemoveFile = async (file, e) => {
    e.stopPropagation();
    setError(null);
    try {
      await deleteEvidenceMetadata(file.id);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      console.error('Delete failed:', err);
      setError(`Failed to delete "${file.name}". Please try again.`);
    }
  };

  // ─── Clear all files ──────────────────────────────────────────────────────
  const handleClearAll = async () => {
    setError(null);
    try {
      await Promise.all(uploadedFiles.map((file) => deleteEvidenceMetadata(file.id)));
      setUploadedFiles([]);
    } catch (err) {
      console.error('Clear all failed:', err);
      setError('Some files could not be deleted. Please try again.');
    }
  };

  const activeUploads = Object.keys(progressMap).length;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setPreviewFile(null)}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setPreviewFile(null)}
                className="absolute -top-12 right-0 text-gray-400 hover:text-white transition"
              >
                <X className="w-8 h-8" />
              </button>
              
              {previewFile.type === 'Text Statement' ? (
                <div className="w-full bg-[#121222] border border-gray-700 rounded-2xl p-6 shadow-2xl text-white whitespace-pre-wrap font-mono text-sm">
                  <h3 className="text-accentTeal mb-4 font-bold uppercase tracking-wider text-lg">{previewFile.name}</h3>
                  {previewFile.statementText || "Text statement loaded successfully."}
                </div>
              ) : ['CCTV Footage', 'Dashcam', 'Videos'].includes(previewFile.type) ? (
                <video src={previewFile.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-lg shadow-2xl bg-black border border-gray-800" />
              ) : previewFile.type === 'Photos' ? (
                <img src={previewFile.url} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-gray-800" />
              ) : (
                <div className="w-full bg-[#121222] border border-gray-700 rounded-2xl p-6 shadow-2xl text-center text-white">
                  <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="font-mono text-lg mb-2">{previewFile.name}</p>
                  <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="text-accentTeal hover:underline text-sm font-mono">
                    Download / View Document
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden universal file input — programmatically triggered */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Text Statement inline modal */}
      {statementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#121222] border border-gray-700 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Text Statement</h3>
              <button onClick={() => { setStatementOpen(false); setStatementText(''); }} className="text-gray-500 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={statementText}
              onChange={(e) => setStatementText(e.target.value)}
              rows={6}
              placeholder="Type witness statement or notes here…"
              className="w-full bg-[#0b0b14] border border-gray-800 focus:border-accentTeal rounded-lg p-3 text-sm text-white placeholder-gray-600 outline-none resize-none font-mono transition"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setStatementOpen(false); setStatementText(''); }}
                className="flex-1 py-2 bg-[#0b0b14] border border-gray-800 text-gray-400 hover:text-white font-mono text-xs uppercase tracking-wider rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatement}
                disabled={!statementText.trim() || savingStatement}
                className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider rounded-lg transition ${
                  statementText.trim() && !savingStatement
                    ? 'bg-accentTeal text-black font-bold'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {savingStatement ? 'Saving…' : 'Save Statement'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Container */}
      <div className="bg-[#121222]/90 border border-gray-800 rounded-2xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-wide">Add Evidence</h2>
          <p className="text-gray-400 text-xs mt-1">Upload any type of evidence. We'll analyze everything.</p>
        </div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 font-mono">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        {/* Success banner */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
          >
            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <p className="text-xs text-green-300 font-mono">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-400 hover:text-green-200">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        {/* Active upload progress bars */}
        {activeUploads > 0 && (
          <div className="mb-4 space-y-2">
            {Object.entries(progressMap).map(([key, pct]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-gray-400 truncate">{key.split('_').slice(2).join('_')}</span>
                  <span className="text-[10px] font-mono text-accentTeal">{pct === 100 ? 'Processing on server...' : `${pct}%`}</span>
                </div>
                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accentTeal rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${pct}%` }}
                    transition={{ ease: 'linear', duration: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload categories grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {categories.map((cat, idx) => {
            const hasUploads = uploadedFiles.some(f => f.type === cat.name);
            return (
              <button
                key={idx}
                onClick={() => handleCategoryClick(cat.name)}
                disabled={uploading}
                className="group relative flex flex-col items-center justify-center p-5 bg-[#0b0b14]/50 border border-gray-850 hover:border-accentPurple rounded-xl text-center transition duration-300 glass-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Plus icon on top-right */}
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#121222] border border-gray-850 flex items-center justify-center text-gray-500 group-hover:text-accentTeal group-hover:border-accentTeal transition">
                  <Upload className="w-2.5 h-2.5" />
                </div>

                <div className="mb-3 p-2 bg-[#121222] border border-gray-800 group-hover:border-accentPurple/40 rounded-lg group-hover:scale-105 transition">
                  {cat.icon}
                </div>

                <span className="text-xs font-medium text-gray-300 group-hover:text-white transition">{cat.name}</span>
                
                {hasUploads && (
                  <span className="absolute bottom-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentTeal opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accentTeal"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Uploaded Strip */}
        <div className="border-t border-gray-850 pt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
              Uploaded ({loadingFiles ? '…' : uploadedFiles.length})
            </span>
            {uploadedFiles.length > 0 && !loadingFiles && (
              <button onClick={handleClearAll} className="text-[10px] text-red-400 hover:underline font-mono">
                Clear All
              </button>
            )}
          </div>

          {/* Horizontal scroll for uploaded previews */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {loadingFiles ? (
              <div className="w-full text-center py-6 text-gray-500 text-xs font-mono">
                Loading evidence…
              </div>
            ) : uploadedFiles.length === 0 ? (
              <div className="w-full text-center py-6 border border-dashed border-gray-850 rounded-xl text-gray-500 text-xs font-mono">
                No files uploaded. Click any category box above to upload.
              </div>
            ) : (
              uploadedFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex-shrink-0 w-24 bg-[#0b0b14] border border-gray-800 rounded-lg p-2 flex flex-col items-center justify-between text-center relative group"
                >
                  <button 
                    onClick={(e) => handleRemoveFile(file, e)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition z-10"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity z-[5] cursor-pointer" onClick={() => setPreviewFile(file)}>
                    <Eye className="w-5 h-5 text-white" />
                  </div>

                  <div className="w-10 h-10 rounded bg-[#121222] border border-gray-800 flex items-center justify-center overflow-hidden mb-1 relative z-0">
                    {file.thumbnail ? (
                      <img src={file.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-5 h-5 text-accentTeal" />
                    )}
                  </div>

                  <div className="w-full">
                    <p className="text-[9px] font-medium text-gray-300 truncate w-full" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[7px] text-gray-500 font-mono mt-0.5">{file.size}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
          <button 
            onClick={onBack}
            className="flex-1 py-3 bg-[#0b0b14] hover:bg-[#0f0f20] border border-gray-800 text-gray-400 hover:text-white font-mono text-xs uppercase tracking-wider font-bold rounded-lg transition"
          >
            Back
          </button>
          <button 
            onClick={onContinue}
            disabled={uploadedFiles.length === 0 || uploading}
            className={`flex-1 py-3 font-mono text-xs uppercase tracking-wider font-bold rounded-lg transition ${
              uploadedFiles.length > 0 && !uploading
                ? 'bg-accentPurple hover:bg-accentPurple/90 text-white shadow-glowPurple border border-accentPurple/50'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-850'
            }`}
          >
            {uploading ? 'Uploading…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
