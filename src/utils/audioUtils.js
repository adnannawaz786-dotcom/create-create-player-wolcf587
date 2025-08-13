/**
 * Audio processing and storage utilities for the MP3 player
 * Handles file processing, metadata extraction, local storage operations,
 * and audio analysis for visualizations
 */

// Storage keys for localStorage
const STORAGE_KEYS = {
  TRACKS: 'mp3_player_tracks',
  SETTINGS: 'mp3_player_settings',
  PLAYLISTS: 'mp3_player_playlists',
  CURRENT_TRACK: 'mp3_player_current_track',
  PLAYBACK_STATE: 'mp3_player_playback_state'
};

// Supported audio formats
const SUPPORTED_FORMATS = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/m4a'
];

/**
 * Validates if a file is a supported audio format
 * @param {File} file - The file to validate
 * @returns {boolean} - Whether the file is supported
 */
export const isValidAudioFile = (file) => {
  if (!file) return false;
  
  const isValidType = SUPPORTED_FORMATS.includes(file.type) || 
                     file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i);
  const isValidSize = file.size > 0 && file.size <= 100 * 1024 * 1024; // 100MB limit
  
  return isValidType && isValidSize;
};

/**
 * Extracts metadata from an audio file
 * @param {File} file - The audio file
 * @returns {Promise<Object>} - Metadata object
 */
export const extractMetadata = async (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      const metadata = {
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: audio.duration,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        url: url
      };
      
      URL.revokeObjectURL(url);
      resolve(metadata);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve({
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: 0,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        url: null
      });
    });
    
    audio.src = url;
  });
};

/**
 * Converts a file to base64 for storage
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    
    reader.readAsDataURL(file);
  });
};

/**
 * Creates a blob URL from base64 data
 * @param {string} base64Data - Base64 encoded data
 * @returns {string} - Blob URL
 */
export const base64ToBlob = (base64Data) => {
  try {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/mpeg' });
    
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    return null;
  }
};

/**
 * Processes uploaded audio files
 * @param {FileList} files - Files to process
 * @returns {Promise<Array>} - Array of processed track objects
 */
export const processAudioFiles = async (files) => {
  const processedTracks = [];
  
  for (const file of Array.from(files)) {
    if (!isValidAudioFile(file)) {
      console.warn(`Skipping invalid file: ${file.name}`);
      continue;
    }
    
    try {
      const metadata = await extractMetadata(file);
      const base64Data = await fileToBase64(file);
      
      const track = {
        id: generateTrackId(),
        ...metadata,
        data: base64Data,
        addedAt: new Date().toISOString(),
        playCount: 0,
        favorite: false
      };
      
      processedTracks.push(track);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  }
  
  return processedTracks;
};

/**
 * Generates a unique track ID
 * @returns {string} - Unique ID
 */
export const generateTrackId = () => {
  return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Saves tracks to localStorage
 * @param {Array} tracks - Array of track objects
 * @returns {boolean} - Success status
 */
export const saveTracks = (tracks) => {
  try {
    const existingTracks = getTracks();
    const updatedTracks = [...existingTracks, ...tracks];
    
    localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(updatedTracks));
    return true;
  } catch (error) {
    console.error('Error saving tracks to localStorage:', error);
    return false;
  }
};

/**
 * Retrieves tracks from localStorage
 * @returns {Array} - Array of track objects
 */
export const getTracks = () => {
  try {
    const tracks = localStorage.getItem(STORAGE_KEYS.TRACKS);
    return tracks ? JSON.parse(tracks) : [];
  } catch (error) {
    console.error('Error retrieving tracks from localStorage:', error);
    return [];
  }
};

/**
 * Updates a specific track in localStorage
 * @param {string} trackId - ID of track to update
 * @param {Object} updates - Updates to apply
 * @returns {boolean} - Success status
 */
export const updateTrack = (trackId, updates) => {
  try {
    const tracks = getTracks();
    const trackIndex = tracks.findIndex(track => track.id === trackId);
    
    if (trackIndex === -1) return false;
    
    tracks[trackIndex] = { ...tracks[trackIndex], ...updates };
    localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(tracks));
    
    return true;
  } catch (error) {
    console.error('Error updating track:', error);
    return false;
  }
};

/**
 * Deletes a track from localStorage
 * @param {string} trackId - ID of track to delete
 * @returns {boolean} - Success status
 */
export const deleteTrack = (trackId) => {
  try {
    const tracks = getTracks();
    const filteredTracks = tracks.filter(track => track.id !== trackId);
    
    localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(filteredTracks));
    return true;
  } catch (error) {
    console.error('Error deleting track:', error);
    return false;
  }
};

/**
 * Clears all tracks from localStorage
 * @returns {boolean} - Success status
 */
export const clearAllTracks = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRACKS);
    return true;
  } catch (error) {
    console.error('Error clearing tracks:', error);
    return false;
  }
};

/**
 * Saves current playback state
 * @param {Object} state - Playback state object
 * @returns {boolean} - Success status
 */
export const savePlaybackState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYBACK_STATE, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Error saving playback state:', error);
    return false;
  }
};

/**
 * Retrieves saved playback state
 * @returns {Object|null} - Playback state or null
 */
export const getPlaybackState = () => {
  try {
    const state = localStorage.getItem(STORAGE_KEYS.PLAYBACK_STATE);
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error('Error retrieving playback state:', error);
    return null;
  }
};

/**
 * Formats duration in seconds to MM:SS format
 * @param {number} duration - Duration in seconds
 * @returns {string} - Formatted duration
 */
export const formatDuration = (duration) => {
  if (!duration || isNaN(duration)) return '0:00';
  
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Formats file size in bytes to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Creates an audio context for visualizations
 * @param {HTMLAudioElement} audioElement - Audio element
 * @returns {Object} - Audio context and analyzer
 */
export const createAudioContext = (audioElement) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const analyzer = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioElement);
    
    analyzer.fftSize = 256;
    analyzer.smoothingTimeConstant = 0.8;
    
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
    
    return { audioContext, analyzer, source };
  } catch (error) {
    console.error('Error creating audio context:', error);
    return null;
  }
};

/**
 * Gets frequency data for visualizations
 * @param {AnalyserNode} analyzer - Web Audio API analyzer
 * @returns {Uint8Array} - Frequency data
 */
export const getFrequencyData = (analyzer) => {
  if (!analyzer) return new Uint8Array(0);
  
  const bufferLength = analyzer.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyzer.getByteFrequencyData(dataArray);
  
  return dataArray;
};

/**
 * Calculates storage usage
 * @returns {Object} - Storage usage information
 */
export const getStorageInfo = () => {
  try {
    const tracks = getTracks();
    const totalTracks = tracks.length;
    const totalSize = tracks.reduce((sum, track) => sum + (track.size || 0), 0);
    
    // Estimate localStorage usage (rough calculation)
    const storageUsed = JSON.stringify(tracks).length;
    const storageLimit = 5 * 1024 * 1024; // 5MB typical limit
    const storagePercentage = (storageUsed / storageLimit) * 100;
    
    return {
      totalTracks,
      totalSize: formatFileSize(totalSize),
      storageUsed: formatFileSize(storageUsed),
      storagePercentage: Math.min(storagePercentage, 100)
    };
  } catch (error) {
    console.error('Error calculating storage info:', error);
    return {
      totalTracks: 0,
      totalSize: '0 B',
      storageUsed: '0 B',
      storagePercentage: 0
    };
  }
};