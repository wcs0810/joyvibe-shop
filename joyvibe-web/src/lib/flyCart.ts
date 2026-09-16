/**
 * Add-to-cart fly animation using FLIP technique.
 * Creates a floating mini image that flies from the source element to the header cart icon.
 */
export function flyCart(sourceEl: HTMLElement, imageSrc?: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const cartEl = document.getElementById('header-cart-icon');
  if (!cartEl) return;

  const startRect = sourceEl.getBoundingClientRect();
  const endRect = cartEl.getBoundingClientRect();

  const fly = document.createElement('div');
  fly.className = 'fly-cart';

  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    fly.appendChild(img);
  } else {
    fly.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:28px;';
    fly.textContent = '🛒';
  }

  // Set initial position (FLIP - First)
  fly.style.left = `${startRect.left + startRect.width / 2 - 24}px`;
  fly.style.top = `${startRect.top + startRect.height / 2 - 24}px`;
  fly.style.transform = 'scale(1)';
  fly.style.opacity = '1';
  fly.style.background = '#FF6B47';

  document.body.appendChild(fly);

  // Force reflow before transitioning to final position
  fly.getBoundingClientRect();

  // Set final position (FLIP - Last)
  fly.style.left = `${endRect.left + endRect.width / 2 - 24}px`;
  fly.style.top = `${endRect.top + endRect.height / 2 - 24}px`;
  fly.style.transform = 'scale(0.2)';
  fly.style.opacity = '0.3';

  // After animation, remove and trigger cart badge bounce
  const duration = 800;
  setTimeout(() => {
    fly.remove();

    // Bounce cart badge if present
    const badge = cartEl.querySelector('.cart-badge') as HTMLElement | null;
    if (badge) {
      badge.classList.add('animate-bounce-subtle');
      setTimeout(() => badge.classList.remove('animate-bounce-subtle'), 300);
    }
  }, duration);
}
