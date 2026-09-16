import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reset scroll position on every route change, while respecting browser
 * back/forward restored positions (ScrollRestoration's manual predecessor).
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Don't hijack in-page anchor/hash scrolling
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, search]);

  return null;
}
