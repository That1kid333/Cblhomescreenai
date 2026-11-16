import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';

/**
 * Every page except Home loads on demand (SEO audit, Nov 2026).
 *
 * The site used to ship as one 1.4 MB script, so a phone opening the home page
 * downloaded the code for all 24 pages before it could draw anything; Google's
 * phone test put the main image at 13.9 seconds. Home and the not-found page
 * stay in the main bundle so the most visited page draws without a second trip.
 */

const CHUNK_RELOAD_KEY = 'cbl-chunk-reload';

/** Wrap a page import for React Router's `lazy`. If a deploy has replaced the
 *  file this open tab was built against, the import fails; one full reload
 *  picks up the new build instead of showing an error screen. */
function page<M>(load: () => Promise<M>, pick: (m: M) => ComponentType) {
  return async () => {
    try {
      const Component = pick(await load());
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } catch {
        /* storage blocked: nothing to clear */
      }
      return { Component };
    } catch (err) {
      let reloaded = true;
      try {
        reloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
        if (!reloaded) sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      } catch {
        reloaded = true; // can't remember a reload, so don't risk a loop
      }
      if (!reloaded) {
        window.location.reload();
        return new Promise<never>(() => {});
      }
      throw err;
    }
  };
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    // Nothing to show while a page's code arrives on first load; the
    // prerendered HTML has already been read by then.
    HydrateFallback: () => null,
    children: [
      { index: true, Component: Home },
      { path: 'faq', lazy: page(() => import('./pages/FAQ'), (m) => m.FAQ) },
      { path: 'contact', lazy: page(() => import('./pages/Contact'), (m) => m.Contact) },
      { path: 'our-story', lazy: page(() => import('./pages/OurStory'), (m) => m.OurStory) },
      { path: 'how-it-works', lazy: page(() => import('./pages/HowItWorks'), (m) => m.HowItWorks) },
      { path: 'app', lazy: page(() => import('./pages/GetTheApp'), (m) => m.GetTheApp) },
      { path: 'meet-buckee', lazy: page(() => import('./pages/MeetBuckee'), (m) => m.MeetBuckee) },
      { path: 'blog', lazy: page(() => import('./pages/Blog'), (m) => m.Blog) },
      { path: 'blog/:slug', lazy: page(() => import('./pages/BlogPost'), (m) => m.BlogPost) },
      { path: 'directory', lazy: page(() => import('./pages/Directory'), (m) => m.Directory) },
      { path: 'eats-and-drinks', lazy: page(() => import('./pages/EatsAndDrinks'), (m) => m.EatsAndDrinks) },
      { path: 'delivery', lazy: page(() => import('./pages/Delivery'), (m) => m.Delivery) },
      { path: 'arcade', lazy: page(() => import('./pages/Arcade'), (m) => m.Arcade) },
      { path: 'terms', lazy: page(() => import('./pages/TermsAndConditions'), (m) => m.TermsAndConditions) },
      { path: 'travels', lazy: page(() => import('./pages/Travels'), (m) => m.Travels) },
      { path: 'transportation', lazy: page(() => import('./pages/Transportation'), (m) => m.Transportation) },
      { path: 'attractions', lazy: page(() => import('./pages/Attractions'), (m) => m.Attractions) },
      { path: 'affiliates', lazy: page(() => import('./pages/Affiliates'), (m) => m.Affiliates) },
      { path: 'concierge', lazy: page(() => import('./pages/Concierge'), (m) => m.Concierge) },
      { path: 'partner-restaurants', lazy: page(() => import('./pages/PartnerRestaurants'), (m) => m.PartnerRestaurants) },
      { path: 'partner-attractions', lazy: page(() => import('./pages/PartnerAttractions'), (m) => m.PartnerAttractions) },
      { path: 'feedback', lazy: page(() => import('./pages/Feedback'), (m) => m.Feedback) },
      { path: 'login', lazy: page(() => import('./pages/Login'), (m) => m.Login) },
      { path: 'studio', lazy: page(() => import('./pages/Studio'), (m) => m.Studio) },
      // Anything else: the branded not-found page. Keep the list of real routes
      // in netlify.toml in step with this file, or a real page will answer 404.
      { path: '*', Component: NotFound },
    ],
  },
]);
