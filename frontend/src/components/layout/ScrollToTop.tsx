import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop ensures the browser resets window scroll position to (0, 0)
 * on route changes, preventing pages from inheriting an offset scroll position
 * from previous routes (e.g. navigating to login from scrolled landing page).
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If navigating to an in-page anchor hash (e.g. /#portals), preserve hash behavior
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
