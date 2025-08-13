import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const Visualizer = ({ audioElement, isPlaying, className = '' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [visualizerType, setVisualizerType] = useState('bars');

  const initializeAudioContext = useCallback(async () => {
    if (!audioElement || isInitialized) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = dataArray;
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }, [audioElement, isInitialized]);

  const drawBarsVisualizer = useCallback((canvas, ctx, dataArray, bufferLength) => {
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.8)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)');
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * height * 0.8;
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  }, []);

  const drawWaveVisualizer = useCallback((canvas, ctx, dataArray, bufferLength) => {
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.8)';
    ctx.beginPath();
    
    const sliceWidth = width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
  }, []);

  const drawCircularVisualizer = useCallback((canvas, ctx, dataArray, bufferLength) => {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    
    ctx.clearRect(0, 0, width, height);
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.8)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)');
    
    for (let i = 0; i < bufferLength; i++) {
      const angle = (i / bufferLength) * Math.PI * 2;
      const amplitude = (dataArray[i] / 255) * 100;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + amplitude);
      const y2 = centerY + Math.sin(angle) * (radius + amplitude);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }, []);

  const animate = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !canvasRef.current) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    switch (visualizerType) {
      case 'bars':
        drawBarsVisualizer(canvas, ctx, dataArrayRef.current, analyserRef.current.frequencyBinCount);
        break;
      case 'wave':
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
        drawWaveVisualizer(canvas, ctx, dataArrayRef.current, analyserRef.current.frequencyBinCount);
        break;
      case 'circular':
        drawCircularVisualizer(canvas, ctx, dataArrayRef.current, analyserRef.current.frequencyBinCount);
        break;
      default:
        drawBarsVisualizer(canvas, ctx, dataArrayRef.current, analyserRef.current.frequencyBinCount);
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [visualizerType, drawBarsVisualizer, drawWaveVisualizer, drawCircularVisualizer]);

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }, []);

  useEffect(() => {
    if (audioElement && !isInitialized) {
      initializeAudioContext();
    }
  }, [audioElement, initializeAudioContext, isInitialized]);

  useEffect(() => {
    if (isPlaying && isInitialized) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isInitialized, animate]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <motion.div
      className={`relative w-full h-full overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="absolute top-4 right-4 z-10">
        <motion.select
          value={visualizerType}
          onChange={(e) => setVisualizerType(e.target.value)}
          className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <option value="bars" className="bg-gray-900">Bars</option>
          <option value="wave" className="bg-gray-900">Wave</option>
          <option value="circular" className="bg-gray-900">Circular</option>
        </motion.select>
      </div>
      
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.3))' }}
      />
      
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Play audio to start visualization
          </motion.div>
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
};

export default Visualizer;