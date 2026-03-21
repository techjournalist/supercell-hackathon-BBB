export function isMobile() {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 1200);
}

export function isLandscape() {
  if (screen.orientation) {
    return screen.orientation.type.includes('landscape');
  }
  return window.innerWidth > window.innerHeight;
}

export function responsiveScale(baseValue, screenWidth) {
  if (screenWidth >= 1200) return baseValue;
  if (screenWidth >= 900) return baseValue * 0.85;
  return baseValue * 0.75;
}

export function responsiveFontSize(basePx, screenWidth) {
  if (screenWidth >= 1200) return basePx;
  if (screenWidth >= 900) return Math.max(basePx - 1, 7);
  return Math.max(Math.round(basePx * 0.8), 7);
}
