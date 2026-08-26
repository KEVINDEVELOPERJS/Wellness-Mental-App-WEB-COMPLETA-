// Animation utilities matching Android AnimacionesHelper functionality

export const animations = {
  // Entry animation for list items with staggered delay
  animateEntry: (element: HTMLElement, index: number, baseDelay: number = 50) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(40px)';
    element.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, index * baseDelay);
  },

  // Pulse animation
  pulse: (element: HTMLElement) => {
    element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(1)' }
    ], {
      duration: 300,
      easing: 'ease-in-out'
    });
  },

  // Shake animation
  shake: (element: HTMLElement) => {
    element.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ], {
      duration: 500,
      easing: 'ease-in-out'
    });
  },

  // Pop-in animation with overshoot
  popIn: (element: HTMLElement, delay: number = 0) => {
    element.style.opacity = '0';
    element.style.transform = 'scale(0.3)';
    element.style.transition = 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    }, delay);
  },

  // Achievement unlock animation
  unlockAchievement: (element: HTMLElement) => {
    element.style.opacity = '0.4';
    element.style.transition = 'all 0.3s ease-out';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1.05)';
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 300);
    }, 0);
  },

  // Animated counter for points
  countUp: (element: HTMLElement, target: number, duration: number = 800, formatter: (n: number) => string) => {
    if (target <= 0) {
      element.textContent = formatter(0);
      return;
    }

    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const current = Math.floor(eased * target);
      
      element.textContent = formatter(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  },

  // Combo HUD animation
  animateComboHUD: (element: HTMLElement, combo: number) => {
    if (combo >= 2) {
      animations.pulse(element);
    }
    if (combo >= 5) {
      animations.shake(element);
    }
  },

  // Game transition animation
  gameTransition: (element: HTMLElement) => {
    element.animate([
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 300,
      easing: 'ease-out'
    });
  },

  // Bounce animation
  bounce: (element: HTMLElement) => {
    element.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(-20px)' },
      { transform: 'translateY(0)' }
    ], {
      duration: 400,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });
  },

  // Spin animation
  spin: (element: HTMLElement) => {
    element.animate([
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ], {
      duration: 600,
      easing: 'ease-in-out'
    });
  },

  // Fade slide up animation
  fadeSlideUp: (element: HTMLElement) => {
    element.animate([
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 300,
      easing: 'ease-out'
    });
  }
};

// Helper for combo-specific animations based on combo count
export const getComboAnimation = (combo: number): keyof typeof animations => {
  if (combo >= 8) return 'shake';
  if (combo >= 5) return 'bounce';
  if (combo >= 3) return 'pulse';
  return 'popIn';
};

// Helper to apply combo-specific styling
export const getComboColor = (combo: number): string => {
  if (combo >= 8) return '#ef4444'; // red-500
  if (combo >= 5) return '#eab308'; // yellow-500
  if (combo >= 3) return '#8b5cf6'; // violet-500
  return '#6366f1'; // indigo-500
};