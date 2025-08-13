import { useState, useEffect, useRef, useCallback } from 'react';
import { createAudioContext, getFrequencyData } from '../utils/audioUtils';

export const useAudioContext = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(0));
  const [isContextReady, setIsContextReady] = useState(false);
  const [error, setError] = useState(null);
  
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Initialize audio context
  const initializeContext = useCallback(async () => {
    try {
      setError(null);
      
      if (audioContext && audioContext.state !== 'closed') {
        return audioContext;
      }

      const context = createAudioContext();
      
      if (!context) {
        throw new Error('Failed to create audio context');
      }

      // Resume context if suspended
      if (context.state === 'suspended') {
        await context.resume();
      }

      // Create analyser node
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;
      analyserNode.minDecibels = -90;
      analyserNode.maxDecibels = -10;

      // Create gain node for volume control
      const gainNode = context.createGain();
      gainNode.gain.value = 1;

      // Connect nodes
      gainNode.connect(analyserNode);
      analyserNode.connect(context.destination);

      setAudioContext(context);
      setAnalyser(analyserNode);
      gainNodeRef.current = gainNode;
      setIsContextReady(true);

      return context;
    } catch (err) {
      console.error('Error initializing audio context:', err);
      setError(err.message);
      setIsContextReady(false);
      return null;
    }
  }, [audioContext]);

  // Connect audio element to context
  const connectAudioElement = useCallback(async (audioElement) => {
    if (!audioElement) return null;

    try {
      let context = audioContext;
      
      if (!context || context.state === 'closed') {
        context = await initializeContext();
      }

      if (!context || !analyser || !gainNodeRef.current) {
        throw new Error('Audio context not ready');
      }

      // Disconnect previous source
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (err) {
          // Ignore disconnect errors
        }
      }

      // Create new media element source
      const source = context.createMediaElementSource(audioElement);
      source.connect(gainNodeRef.current);
      
      sourceRef.current = source;
      
      return source;
    } catch (err) {
      console.error('Error connecting audio element:', err);
      setError(err.message);
      return null;
    }
  }, [audioContext, analyser, initializeContext]);

  // Start frequency data analysis
  const startAnalysis = useCallback(() => {
    if (!analyser || !isContextReady) return;

    const updateFrequencyData = () => {
      if (analyser && audioContext && audioContext.state === 'running') {
        const dataArray = getFrequencyData(analyser);
        setFrequencyData(dataArray);
        animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
      }
    };

    updateFrequencyData();
  }, [analyser, audioContext, isContextReady]);

  // Stop frequency data analysis
  const stopAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setFrequencyData(new Uint8Array(0));
  }, []);

  // Set volume
  const setVolume = useCallback((volume) => {
    if (gainNodeRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      gainNodeRef.current.gain.setValueAtTime(clampedVolume, audioContext?.currentTime || 0);
    }
  }, [audioContext]);

  // Get current volume
  const getVolume = useCallback(() => {
    return gainNodeRef.current?.gain.value || 1;
  }, []);

  // Resume context (for user interaction requirement)
  const resumeContext = useCallback(async () => {
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        setIsContextReady(true);
        setError(null);
      } catch (err) {
        console.error('Error resuming audio context:', err);
        setError(err.message);
      }
    }
  }, [audioContext]);

  // Suspend context
  const suspendContext = useCallback(async () => {
    if (audioContext && audioContext.state === 'running') {
      try {
        await audioContext.suspend();
        stopAnalysis();
      } catch (err) {
        console.error('Error suspending audio context:', err);
      }
    }
  }, [audioContext, stopAnalysis]);

  // Close context
  const closeContext = useCallback(async () => {
    stopAnalysis();
    
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (err) {
        // Ignore disconnect errors
      }
      sourceRef.current = null;
    }

    if (audioContext && audioContext.state !== 'closed') {
      try {
        await audioContext.close();
      } catch (err) {
        console.error('Error closing audio context:', err);
      }
    }

    setAudioContext(null);
    setAnalyser(null);
    setIsContextReady(false);
    gainNodeRef.current = null;
  }, [audioContext, stopAnalysis]);

  // Get audio context state
  const getContextState = useCallback(() => {
    return audioContext?.state || 'closed';
  }, [audioContext]);

  // Get frequency bins for different ranges
  const getFrequencyBins = useCallback(() => {
    if (!frequencyData || frequencyData.length === 0) {
      return { bass: 0, mid: 0, treble: 0 };
    }

    const dataLength = frequencyData.length;
    const bassEnd = Math.floor(dataLength * 0.1);
    const midEnd = Math.floor(dataLength * 0.4);
    
    let bass = 0, mid = 0, treble = 0;
    
    // Calculate average for each frequency range
    for (let i = 0; i < bassEnd; i++) {
      bass += frequencyData[i];
    }
    bass = bass / bassEnd / 255;
    
    for (let i = bassEnd; i < midEnd; i++) {
      mid += frequencyData[i];
    }
    mid = mid / (midEnd - bassEnd) / 255;
    
    for (let i = midEnd; i < dataLength; i++) {
      treble += frequencyData[i];
    }
    treble = treble / (dataLength - midEnd) / 255;
    
    return { bass, mid, treble };
  }, [frequencyData]);

  // Get average frequency level
  const getAverageFrequency = useCallback(() => {
    if (!frequencyData || frequencyData.length === 0) return 0;
    
    const sum = frequencyData.reduce((acc, val) => acc + val, 0);
    return sum / frequencyData.length / 255;
  }, [frequencyData]);

  // Handle context state changes
  useEffect(() => {
    if (!audioContext) return;

    const handleStateChange = () => {
      setIsContextReady(audioContext.state === 'running');
      
      if (audioContext.state === 'running') {
        setError(null);
      }
    };

    audioContext.addEventListener('statechange', handleStateChange);
    
    return () => {
      audioContext.removeEventListener('statechange', handleStateChange);
    };
  }, [audioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeContext();
    };
  }, [closeContext]);

  return {
    // State
    audioContext,
    analyser,
    frequencyData,
    isContextReady,
    error,
    
    // Actions
    initializeContext,
    connectAudioElement,
    startAnalysis,
    stopAnalysis,
    resumeContext,
    suspendContext,
    closeContext,
    
    // Volume control
    setVolume,
    getVolume,
    
    // Utilities
    getContextState,
    getFrequencyBins,
    getAverageFrequency
  };
};

export default useAudioContext;