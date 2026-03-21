export const FullscreenManager = {
  isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  },

  async requestFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req && !this.isFullscreen()) {
      try {
        await req.call(el);
      } catch (e) {
        // User denied or unsupported
      }
    }
  },

  exitFullscreen() {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit && this.isFullscreen()) {
      try {
        exit.call(document);
      } catch (e) {}
    }
  },

  isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && window.innerWidth < 1200);
  },

  tryFullscreen() {
    if (this.isMobile() && !this.isFullscreen()) {
      this.requestFullscreen();
    }
  }
};
