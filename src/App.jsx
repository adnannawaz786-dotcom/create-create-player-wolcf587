import React from 'react'
import { motion } from 'framer-motion'
import { Upload, Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat } from 'lucide-react'
import { Button } from './components/ui/button'
import { Progress } from './components/ui/progress'
import { Slider } from './components/ui/slider'
import { Card, CardContent } from './components/ui/card'
import { ScrollArea } from './components/ui/scroll-area'
import { Separator } from './components/ui/separator'
import { toast } from 'sonner'

const App = () => {
  const [tracks, setTracks] = React.useState([])
  const [currentTrack, setCurrentTrack] = React.useState(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState([70])
  const [isShuffling, setIsShuffling] = React.useState(false)
  const [repeatMode, setRepeatMode] = React.useState('none')
  const [audioData, setAudioData] = React.useState(new Array(32).fill(0))
  
  const audioRef = React.useRef(null)
  const fileInputRef = React.useRef(null)
  const audioContextRef = React.useRef(null)
  const analyserRef = React.useRef(null)
  const dataArrayRef = React.useRef(null)
  const animationRef = React.useRef(null)

  React.useEffect(() => {
    const savedTracks = localStorage.getItem('mp3-player-tracks')
    if (savedTracks) {
      setTracks(JSON.parse(savedTracks))
    }
  }, [])

  React.useEffect(() => {
    if (tracks.length > 0) {
      localStorage.setItem('mp3-player-tracks', JSON.stringify(tracks))
    }
  }, [tracks])

  const initializeAudioContext = () => {
    if (!audioContextRef.current && audioRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        analyserRef.current = audioContextRef.current.createAnalyser()
        const source = audioContextRef.current.createMediaElementSource(audioRef.current)
        source.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
        analyserRef.current.fftSize = 64
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)
      } catch (error) {
        console.error('Audio context initialization failed:', error)
      }
    }
  }

  const updateVisualizerData = () => {
    if (analyserRef.current && dataArrayRef.current && isPlaying) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current)
      const normalizedData = Array.from(dataArrayRef.current).map(value => value / 255)
      setAudioData(normalizedData)
      animationRef.current = requestAnimationFrame(updateVisualizerData)
    }
  }

  React.useEffect(() => {
    if (isPlaying) {
      initializeAudioContext()
      updateVisualizerData()
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    const mp3Files = files.filter(file => file.type === 'audio/mpeg' || file.name.endsWith('.mp3'))
    
    if (mp3Files.length === 0) {
      toast.error('Please select valid MP3 files')
      return
    }

    mp3Files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newTrack = {
          id: Date.now() + Math.random(),
          name: file.name.replace('.mp3', ''),
          url: e.target.result,
          duration: 0
        }
        setTracks(prev => [...prev, newTrack])
        toast.success(`Added ${file.name} to playlist`)
      }
      reader.readAsDataURL(file)
    })
  }

  const playTrack = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause()
    } else {
      setCurrentTrack(track)
      setCurrentTime(0)
      if (audioRef.current) {
        audioRef.current.src = track.url
        audioRef.current.load()
      }
    }
  }

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(error => {
        console.error('Playback failed:', error)
        toast.error('Failed to play track')
      })
      setIsPlaying(true)
    }
  }

  const skipTrack = (direction) => {
    if (tracks.length === 0) return

    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id)
    let nextIndex

    if (direction === 'next') {
      nextIndex = currentIndex + 1 >= tracks.length ? 0 : currentIndex + 1
    } else {
      nextIndex = currentIndex - 1 < 0 ? tracks.length - 1 : currentIndex - 1
    }

    playTrack(tracks[nextIndex])
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (value) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100
    }
  }

  const removeTrack = (trackId) => {
    setTracks(prev => prev.filter(track => track.id !== trackId))
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null)
      setIsPlaying(false)
    }
    toast.success('Track removed from playlist')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0">
        {audioData.map((value, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full bg-white/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1 + value * 2, 1],
              opacity: [0.1, value * 0.5, 0.1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Music Player
          </h1>
          <p className="text-white/70 text-lg">
            Upload and play your favorite MP3 tracks
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Upload Music</h2>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  size="lg"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload MP3 Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,audio/mpeg"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Playlist */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-white mb-3">Playlist</h3>
                  <ScrollArea className="h-64">
                    {tracks.length === 0 ? (
                      <p className="text-white/60 text-center py-8">
                        No tracks uploaded yet
                      </p>
                    ) : (
                      tracks.map((track) => (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-lg mb-2 cursor-pointer transition-all ${
                            currentTrack?.id === track.id
                              ? 'bg-white/20 border border-white/30'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                          onClick={() => playTrack(track)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm truncate">
                              {track.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeTrack(track.id)
                              }}
                              className="text-white/60 hover:text-red-400"
                            >
                              ×
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Player Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-8">
                {/* Visualizer */}
                <div className="mb-8 h-32 flex items-end justify-center space-x-1">
                  {audioData.map((value, index) => (
                    <motion.div
                      key={index}
                      className="bg-gradient-to-t from-purple-500 to-pink-500 w-2 rounded-t"
                      animate={{
                        height: `${Math.max(4, value * 120)}px`,
                      }}
                      transition={{
                        duration: 0.1,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>

                {/* Current Track Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {currentTrack?.name || 'No track selected'}
                  </h3>
                  <div className="flex justify-center items-center space-x-4 text-white/70">
                    <span>{formatTime(currentTime)}</span>
                    <Progress
                      value={duration ? (currentTime / duration) * 100 : 0}
                      className="flex-1 max-w-md"
                    />
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Seek Bar */}
                <div className="mb-6">
                  <Slider
                    value={[duration ? (currentTime / duration) * 100 : 0]}
                    onValueChange={handleSeek}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setIsShuffling(!isShuffling)}
                    className={`text-white hover:bg-white/10 ${
                      isShuffling ? 'bg-white/20' : ''
                    }`}
                  >
                    <Shuffle className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => skipTrack('prev')}
                    className="text-white hover:bg-white/10"
                    disabled={!currentTrack}
                  >
                    <SkipBack className="h-6 w-6" />
                  </Button>

                  <Button
                    size="lg"
                    onClick={togglePlayPause}
                    disabled={!currentTrack}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full w-16 h-16"
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => skipTrack('next')}
                    className="text-white hover:bg-white/10"
                    disabled={!currentTrack}
                  >
                    <SkipForward className="h-6 w-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      const modes = ['none', 'one', 'all']
                      const currentIndex = modes.indexOf(repeatMode)
                      setRepeatMode(modes[(currentIndex + 1) % modes.length])
                    }}
                    className={`text-white hover:bg-white/10 ${
                      repeatMode !== 'none' ? 'bg-white/20' : ''
                    }`}
                  >
                    <Repeat className="h-5 w-5" />
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center justify-center space-x-4">
                  <Volume2 className="h-5 w-5 text-white" />
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-32"
                  />
                  <span className="text-white text-sm w-8">{volume[0]}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          if (repeatMode === 'one') {
            audioRef.current?.play()
          } else if (repeatMode === 'all' || tracks.length > 1) {
            skipTrack('next')
          } else {
            setIsPlaying(false)
          }
        }}
        preload="metadata"
      />
    </div>
  )
}

export default App