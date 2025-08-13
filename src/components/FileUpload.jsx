import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Music, X, FileAudio, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isValidAudioFile, formatFileSize, processAudioFiles } from '../utils/audioUtils';

const FileUpload = ({ onFilesUploaded, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  }, []);

  const handleFiles = async (files) => {
    setError(null);
    setSuccess(false);

    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter(file => {
      const isValid = isValidAudioFile(file);
      if (!isValid) {
        setError(`${file.name} is not a supported audio file format`);
      }
      return isValid;
    });

    if (validFiles.length === 0) return;

    setIsProcessing(true);
    setUploadedFiles(validFiles.map(file => ({
      name: file.name,
      size: formatFileSize(file.size),
      status: 'processing'
    })));

    try {
      const processedTracks = await processAudioFiles(validFiles);
      
      setUploadedFiles(prev => 
        prev.map(file => ({
          ...file,
          status: 'completed'
        }))
      );

      setSuccess(true);
      onFilesUploaded?.(processedTracks);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setUploadedFiles([]);
      }, 3000);

    } catch (err) {
      console.error('Error processing files:', err);
      setError('Failed to process audio files. Please try again.');
      setUploadedFiles(prev => 
        prev.map(file => ({
          ...file,
          status: 'error'
        }))
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    if (uploadedFiles.length === 1) {
      setSuccess(false);
    }
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Main Upload Area */}
        <motion.div
          className={`
            relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300
            ${isDragOver 
              ? 'border-blue-400 bg-blue-50/20 backdrop-blur-md' 
              : 'border-gray-300 hover:border-gray-400 bg-white/10 backdrop-blur-md'
            }
            ${isProcessing ? 'pointer-events-none opacity-75' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="p-8 text-center">
            <motion.div
              animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="mb-4"
            >
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto text-blue-500"
                >
                  <Upload className="w-full h-full" />
                </motion.div>
              ) : (
                <Music className="w-16 h-16 mx-auto text-gray-400 mb-2" />
              )}
            </motion.div>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {isProcessing ? 'Processing Files...' : 'Upload Audio Files'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              Drag and drop your MP3, WAV, or M4A files here
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="
                px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 
                text-white rounded-lg font-medium shadow-lg
                hover:from-blue-600 hover:to-purple-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              {isProcessing ? 'Processing...' : 'Browse Files'}
            </motion.button>

            <p className="text-sm text-gray-500 mt-3">
              Supported formats: MP3, WAV, M4A (Max 50MB each)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.m4a"
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Drag Overlay */}
          <AnimatePresence>
            {isDragOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="text-center">
                  <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                  <p className="text-blue-700 font-medium">Drop files here</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-red-50/80 backdrop-blur-md border border-red-200 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-green-50/80 backdrop-blur-md border border-green-200 rounded-lg flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700">Files uploaded successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File List */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-white/10 backdrop-blur-md rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Uploaded Files</h4>
                <button
                  onClick={clearAll}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Clear All
                </button>
              </div>
              
              <div className="max-h-48 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                  >
                    <FileAudio className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{file.size}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === 'processing' && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                        />
                      )}
                      
                      {file.status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      
                      {file.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}

                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FileUpload;