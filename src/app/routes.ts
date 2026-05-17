import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';
import { OurStory } from './pages/OurStory';
import { HowItWorks } from './pages/HowItWorks';
import { Blog } from './pages/Blog';
import { EatsAndDrinks } from './pages/EatsAndDrinks';
import { Travels } from './pages/Travels';
import { Transportation } from './pages/Transportation';
import { Attractions } from './pages/Attractions';
import { Affiliates } from './pages/Affiliates';

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
      { path: 'blog', Component: Blog },
      { path: 'eats-and-drinks', Component: EatsAndDrinks },
      { path: 'travels', Component: Travels },
      { path: 'transportation', Component: Transportation },
      { path: 'attractions', Component: Attractions },
      { path: 'affiliates', Component: Affiliates },
    ],
  },
]);
