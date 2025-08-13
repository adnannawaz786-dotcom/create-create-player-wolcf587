import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat,
  Heart,
  MoreHorizontal
} from 'lucide-react';

const AudioPlayer = ({ 
  currentTrack, 
  playlist = [], 
  onTrackChange,
  className = "" 
}) => {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // off, one, all
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize audio context and visualizer
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
          
          const source = audioContextRef.current.createMediaElementSource(audioRef.current);
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }
      } catch (error) {
        console.warn('Audio context initialization failed:', error);
      }
    }
  }, [currentTrack]);

  // Visualizer animation
  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    ctx.clearRect(0, 0, width, height);

    const barWidth = (width / dataArrayRef.current.length) * 2.5;
    let barHeight;
    let x = 0;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.8)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.6)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.4)');

    for (let i = 0; i < dataArrayRef.current.length; i++) {
      barHeight = (dataArrayRef.current[i] / 255) * height * 0.8;

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    animationRef.current = requestAnimationFrame(drawVisualizer);
  };

  // Start/stop visualizer
  useEffect(() => {
    if (isPlaying) {
      drawVisualizer();
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
  }, [isPlaying]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => handleNext();

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  const togglePlay = async () => {
    if (!audioRef.current || !currentTrack) return;

    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const handlePrevious = () => {
    if (!playlist.length || !onTrackChange) return;
    
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    onTrackChange(playlist[previousIndex]);
  };

  const handleNext = () => {
    if (!playlist.length || !onTrackChange) return;

    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    let nextIndex;

    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
    }

    if (repeatMode === 'off' && currentIndex === playlist.length - 1) {
      setIsPlaying(false);
      return;
    }

    onTrackChange(playlist[nextIndex]);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, percent));
    
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  return (
    <motion.div 
      className={`relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background Visualizer */}
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        className="absolute inset-0 w-full h-full rounded-2xl opacity-30 pointer-events-none"
      />

      {/* Audio Element */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          preload="metadata"
          crossOrigin="anonymous"
        />
      )}

      {/* Track Info */}
      <AnimatePresence mode="wait">
        {currentTrack && (
          <motion.div 
            key={currentTrack.id}
            className="flex items-center space-x-4 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center overflow-hidden">
              {currentTrack.artwork ? (
                <img 
                  src={currentTrack.artwork} 
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-xl font-bold">
                  {currentTrack.title.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg truncate">
                {currentTrack.title}
              </h3>
              <p className="text-white/70 text-sm truncate">
                {currentTrack.artist || 'Unknown Artist'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsLiked(!isLiked)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Heart 
                  className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white/70'}`}
                />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-white/70" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="mb-6">
        <div 
          className="w-full h-2 bg-white/20 rounded-full cursor-pointer group"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative transition-all duration-150 group-hover:h-3 group-hover:-mt-0.5"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-white/70 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsShuffled(!isShuffled)}
            className={`p-2 rounded-full transition-colors ${
              isShuffled ? 'bg-purple-500 text-white' : 'hover:bg-white/10 text-white/70'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const modes = ['off', 'all', 'one'];
              const currentIndex = modes.indexOf(repeatMode);
              const nextMode = modes[(currentIndex + 1) % modes.length];
              setRepeatMode(nextMode);
            }}
            className={`p-2 rounded-full transition-colors ${
              repeatMode !== 'off' ? 'bg-purple-500 text-white' : 'hover:bg-white/10 text-white/70'
            }`}
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" />
            )}
          </motion.button>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrevious}
            className="p-2 text-white hover:text-purple-400 transition-colors"
            disabled={!playlist.length}
          >
            <SkipBack className="w-6 h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            disabled={!currentTrack || isLoading}
            className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className="p-2 text-white hover:text-purple-400 transition-colors"
            disabled={!playlist.length}
          >
            <SkipForward className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white/70" />
            ) : (
              <Volume2 className="w-4 h-4 text-white/70" />
            )}
          </motion.button>

          <div 
            className="w-20 h-1 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleVolumeChange}
          >
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-150 group-hover:h-2 group-hover:-mt-0.5"
              style={{ width: `${volumePercent}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AudioPlayer;