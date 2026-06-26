import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';
import { OurStory } from './pages/OurStory';
import { HowItWorks } from './pages/HowItWorks';
import { MeetBuckee } from './pages/MeetBuckee';
import { Blog } from './pages/Blog';
import { Directory } from './pages/Directory';
import { EatsAndDrinks } from './pages/EatsAndDrinks';
import { Delivery } from './pages/Delivery';
import { Travels } from './pages/Travels';
import { Transportation } from './pages/Transportation';
import { Attractions } from './pages/Attractions';
import { Affiliates } from './pages/Affiliates';
import { Concierge } from './pages/Concierge';
import { PartnerRestaurants } from './pages/PartnerRestaurants';
import { PartnerAttractions } from './pages/PartnerAttractions';
import { Feedback } from './pages/Feedback';
import { Login } from './pages/Login';
import { TermsAndConditions } from './pages/TermsAndConditions';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'faq', Component: FAQ },
      { path: 'contact', Component: Contact },
      { path: 'our-story', Component: OurStory },
      { path: 'how-it-works', Component: HowItWorks },
      { path: 'meet-buckee', Component: MeetBuckee },
      { path: 'blog', Component: Blog },
      { path: 'directory', Component: Directory },
      { path: 'eats-and-drinks', Component: EatsAndDrinks },
      { path: 'delivery', Component: Delivery },
      { path: 'terms', Component: TermsAndConditions },
      { path: 'travels', Component: Travels },
      { path: 'transportation', Component: Transportation },
      { path: 'attractions', Component: Attractions },
      { path: 'affiliates', Component: Affiliates },
      { path: 'concierge', Component: Concierge },
      { path: 'partner-restaurants', Component: PartnerRestaurants },
      { path: 'partner-attractions', Component: PartnerAttractions },
      { path: 'feedback', Component: Feedback },
      { path: 'login', Component: Login },
    ],
  },
]);
