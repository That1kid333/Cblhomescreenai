import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { trackPageView } from '../lib/analytics';

/** Sends a GA4 page view on first load and on every route change. Renders nothing. */
export function Analytics() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}
