import Phaser from 'phaser';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
    this.videoElement = null;
    this.videoContainer = null;
    this.skipTextElement = null;
    this.hasSkipped = false;
  }
  
  preload() {
    // No preload needed - we'll create DOM video element directly
  }
  
  create() {
    // Hide the Phaser canvas temporarily
    this.game.canvas.style.display = 'none';
    
    // Create video container
    this.videoContainer = document.createElement('div');
    this.videoContainer.style.position = 'fixed';
    this.videoContainer.style.top = '0';
    this.videoContainer.style.left = '0';
    this.videoContainer.style.width = '100vw';
    this.videoContainer.style.height = '100vh';
    this.videoContainer.style.backgroundColor = '#000000';
    this.videoContainer.style.zIndex = '10000';
    this.videoContainer.style.overflow = 'hidden';
    document.body.appendChild(this.videoContainer);
    
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.src = 'https://rosebud.ai/assets/Blades-Beards-Beams-main-intro.mp4?TgYG';
    this.videoElement.style.position = 'absolute';
    this.videoElement.style.top = '50%';
    this.videoElement.style.left = '50%';
    this.videoElement.style.transform = 'translate(-50%, -50%)';
    this.videoElement.style.width = '100%';
    this.videoElement.style.height = '100%';
    this.videoElement.style.objectFit = 'cover';
    this.videoElement.autoplay = true;
    this.videoElement.muted = false; // Try with sound first
    this.videoElement.playsInline = true; // For mobile
    this.videoElement.setAttribute('playsinline', ''); // iOS fix
    this.videoElement.volume = 1.0; // Full volume
    this.videoContainer.appendChild(this.videoElement);
    
    // Create skip text element
    this.skipTextElement = document.createElement('div');
    this.skipTextElement.textContent = 'CLICK TO SKIP';
    this.skipTextElement.style.position = 'absolute';
    this.skipTextElement.style.bottom = '20px';
    this.skipTextElement.style.right = '20px';
    this.skipTextElement.style.color = 'rgba(255, 255, 255, 0.5)';
    this.skipTextElement.style.fontSize = 'clamp(10px, 1.2vw, 14px)';
    this.skipTextElement.style.fontFamily = 'Arial, sans-serif';
    this.skipTextElement.style.letterSpacing = '2px';
    this.skipTextElement.style.textTransform = 'uppercase';
    this.skipTextElement.style.opacity = '0';
    this.skipTextElement.style.transition = 'opacity 0.8s ease';
    this.skipTextElement.style.pointerEvents = 'none';
    this.skipTextElement.style.zIndex = '10001';
    this.videoContainer.appendChild(this.skipTextElement);
    
    // Fade in skip text after 2 seconds
    setTimeout(() => {
      if (this.skipTextElement && !this.hasSkipped) {
        this.skipTextElement.style.opacity = '1';
      }
    }, 2000);
    
    // Play video with sound
    const playPromise = this.videoElement.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.log('Autoplay with sound prevented, trying muted:', err);
        // If autoplay with sound fails, mute and try again
        this.videoElement.muted = true;
        this.videoElement.play().catch(err2 => {
          console.log('Muted autoplay also failed:', err2);
        });
        
        // Show a "click to unmute" message
        const unmuteText = document.createElement('div');
        unmuteText.textContent = 'CLICK FOR SOUND';
        unmuteText.style.position = 'absolute';
        unmuteText.style.bottom = '50px';
        unmuteText.style.right = '20px';
        unmuteText.style.color = 'rgba(255, 255, 255, 0.7)';
        unmuteText.style.fontSize = 'clamp(10px, 1.2vw, 14px)';
        unmuteText.style.fontFamily = 'Arial, sans-serif';
        unmuteText.style.letterSpacing = '2px';
        unmuteText.style.textTransform = 'uppercase';
        unmuteText.style.zIndex = '10001';
        this.videoContainer.appendChild(unmuteText);
        
        // Unmute on first interaction
        const unmuteHandler = () => {
          this.videoElement.muted = false;
          unmuteText.remove();
          this.videoContainer.removeEventListener('click', unmuteHandler);
        };
        this.videoContainer.addEventListener('click', unmuteHandler, { once: true });
      });
    }
    
    // Handle video end
    this.videoElement.addEventListener('ended', () => {
      if (!this.hasSkipped) {
        this.transitionToMenu();
      }
    });
    
    // Handle click/tap to skip
    const skipHandler = () => {
      this.skipVideo();
    };
    this.videoContainer.addEventListener('click', skipHandler);
    this.videoContainer.addEventListener('touchstart', skipHandler);
    
    // Handle keyboard to skip
    const keyHandler = (e) => {
      this.skipVideo();
    };
    document.addEventListener('keydown', keyHandler);
    
    // Store handlers for cleanup
    this.skipHandler = skipHandler;
    this.keyHandler = keyHandler;
  }
  
  skipVideo() {
    if (this.hasSkipped) return;
    this.hasSkipped = true;
    
    // Pause video
    if (this.videoElement) {
      this.videoElement.pause();
    }
    
    this.transitionToMenu();
  }
  
  transitionToMenu() {
    if (this.hasSkipped && this.videoElement && this.videoElement.paused) {
      // Already transitioning
      return;
    }
    this.hasSkipped = true;
    
    // Fade out video container
    if (this.videoContainer) {
      this.videoContainer.style.transition = 'opacity 0.4s ease';
      this.videoContainer.style.opacity = '0';
    }
    
    // After fade, clean up and show menu
    setTimeout(() => {
      // Clean up video
      if (this.videoElement) {
        this.videoElement.pause();
        this.videoElement.src = '';
        this.videoElement.remove();
        this.videoElement = null;
      }
      
      // Clean up container
      if (this.videoContainer) {
        this.videoContainer.remove();
        this.videoContainer = null;
      }
      
      // Remove event listeners
      if (this.skipHandler) {
        document.removeEventListener('click', this.skipHandler);
        document.removeEventListener('touchstart', this.skipHandler);
      }
      if (this.keyHandler) {
        document.removeEventListener('keydown', this.keyHandler);
      }
      
      // Show Phaser canvas again
      this.game.canvas.style.display = 'block';
      
      // Fade in from black and go to menu
      this.cameras.main.fadeIn(500, 0, 0, 0);
      this.scene.start('MenuScene');
    }, 400);
  }
  
  shutdown() {
    // Clean up on scene shutdown
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement.remove();
      this.videoElement = null;
    }
    
    if (this.videoContainer) {
      this.videoContainer.remove();
      this.videoContainer = null;
    }
    
    if (this.skipHandler) {
      document.removeEventListener('click', this.skipHandler);
      document.removeEventListener('touchstart', this.skipHandler);
    }
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
    
    // Make sure canvas is visible
    if (this.game && this.game.canvas) {
      this.game.canvas.style.display = 'block';
    }
  }
}
