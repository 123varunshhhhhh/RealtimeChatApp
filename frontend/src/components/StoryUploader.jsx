// src/components/StoryUploader.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serverUrl } from '../main';
import { motion, AnimatePresence } from 'framer-motion'; // For modal animations

const StoryUploader = ({ onUploadComplete, triggerComponent }) => {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Clean up object URLs when component unmounts or previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError(''); // Reset error message
    setUploadProgress(0); // Reset progress

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(selectedFile.type)) {
      setError('Only images (JPEG, PNG, WEBP) and videos (MP4) are allowed');
      return;
    }

    if (selectedFile.size > maxSize) {
      setError('File size too large (max 50MB)');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setIsModalOpen(true); // Open modal immediately after file selection
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('storyMedia', file); // 'storyMedia' must match your multer field name
      formData.append('caption', caption);

      const response = await axios.post(`${serverUrl}/api/story/upload`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      if (response.status === 201) {
        if (onUploadComplete) onUploadComplete(); // Notify parent of successful upload
        // Reset states after successful upload
        setIsModalOpen(false);
        setCaption('');
        setFile(null);
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
    } catch (err) {
      console.error('Story upload error:', err);
      let errorMessage = 'Upload failed. Please try again.';
      if (err.response) {
        if (err.response.status === 413) {
          errorMessage = 'File too large (max 50MB allowed)';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 401) {
          errorMessage = 'Please log in to upload stories';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (err.request) {
        errorMessage = 'Network error. Check your connection.';
      }
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
    setFile(null);
    setCaption('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setUploadProgress(0);
  };

  return (
    <>
      <input
        type="file"
        id="story-upload-input"
        accept="image/jpeg,image/png,image/webp,video/mp4"
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Trigger component is rendered here. When clicked, it will open the file input. */}
      <label htmlFor="story-upload-input" className="cursor-pointer">
        {triggerComponent}
      </label>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Upload Story</h2>

              {previewUrl && (
                <div className="mb-4 max-h-64 overflow-hidden rounded-lg border border-gray-200">
                  {file.type.startsWith('video') ? (
                    <video controls className="w-full h-auto max-h-60 object-contain">
                      <source src={previewUrl} type={file.type} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-60 object-contain" />
                  )}
                </div>
              )}

              <textarea
                placeholder="Add a caption... (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200"
                maxLength={150}
                rows={2}
              />

              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <p className="text-sm text-center text-gray-500 mt-1">{uploadProgress}%</p>
                </div>
              )}

              {error && (
                <p className="text-red-600 mb-4 text-sm font-medium">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2 px-4 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className={`flex-1 py-2 px-4 text-white rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isUploading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  disabled={isUploading || !file} // Disable if no file selected
                >
                  {isUploading ? 'Uploading...' : 'Share Story'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StoryUploader;