import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/auth.hooks';
import siteAnalyticsTracker from './siteAnalyticsTracker';

export default function SiteAnalyticsBridge() {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    siteAnalyticsTracker.start();
    siteAnalyticsTracker.setUser(user || null);
  }, [loading, user]);

  useEffect(() => {
    if (loading) return;

    siteAnalyticsTracker.updateRoute({
      path: `${location.pathname}${location.search}`,
      title: document.title,
    });
  }, [loading, location.pathname, location.search]);

  return null;
}
