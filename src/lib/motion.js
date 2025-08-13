// Framer Motion animation variants and configurations for the MP3 player

// Container animations for main sections
export const containerVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Item animations for list items and cards
export const itemVariants = {
  hidden: {
    opacity: 0,
    y: 15,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

// Player control animations
export const playerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  playing: {
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  paused: {
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

// Button hover and tap animations
export const buttonVariants = {
  rest: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

// Play button specific animations
export const playButtonVariants = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  },
  hover: {
    scale: 1.1,
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.9,
    transition: {
      duration: 0.1,
    },
  },
  playing: {
    boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

// Visualizer animations
export const visualizerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
  active: {
    scale: 1.02,
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
};

// Background particle animations
export const particleVariants = {
  animate: {
    y: [-20, -100],
    opacity: [0, 1, 0],
    scale: [0, 1, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeOut",
    },
  },
};

// Floating animation for decorative elements
export const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 5, 0, -5, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Modal and dialog animations
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Backdrop animation for modals
export const backdropVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

// Progress bar animations
export const progressVariants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  animate: (progress) => ({
    scaleX: progress / 100,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

// Waveform bar animations
export const waveformBarVariants = {
  animate: (height) => ({
    scaleY: height,
    transition: {
      duration: 0.1,
      ease: "easeOut",
    },
  }),
};

// Upload area animations
export const uploadVariants = {
  rest: {
    borderColor: "rgba(156, 163, 175, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  hover: {
    borderColor: "rgba(59, 130, 246, 0.5)",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    transition: {
      duration: 0.3,
    },
  },
  dragOver: {
    borderColor: "rgba(34, 197, 94, 0.7)",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    scale: 1.02,
    transition: {
      duration: 0.2,
    },
  },
};

// Track list item animations
export const trackItemVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  hover: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    scale: 1.01,
    transition: {
      duration: 0.2,
    },
  },
  active: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderColor: "rgba(59, 130, 246, 0.5)",
    transition: {
      duration: 0.3,
    },
  },
};

// Notification animations
export const notificationVariants = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.9,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Loading spinner animations
export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Glassmorphism card animations
export const glassCardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    backdropFilter: "blur(0px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    backdropFilter: "blur(20px)",
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
  hover: {
    y: -5,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Stagger animation configuration
export const staggerConfig = {
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Page transition animations
export const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Utility function to create custom spring animations
export const createSpringAnimation = (damping = 20, stiffness = 300) => ({
  type: "spring",
  damping,
  stiffness,
});

// Utility function to create custom easing animations
export const createEaseAnimation = (duration = 0.3, ease = "easeOut") => ({
  duration,
  ease,
});