/* ==========================================
   ENTERPRISE CSS LOADING ORDER
   Critical for SSR and preventing FOUC
   
   These imports are in layout.js (server component)
   so they're included in SSR output - NO FOUC!
   ========================================== */

// Next.js Font Optimization - Prevents font flicker
import { Poppins } from 'next/font/google';

// 1. Reset - Normalize browser defaults (FIRST)
import '@/styles/reset.css';

// 2. Tokens - Design system variables (SECOND)
import '@/styles/tokens.css';

// 3. Globals - Base styles, typography, layout (THIRD)
import '@/styles/globals.css';

// 4. Design System - CSS variables and utilities (FOURTH)
import '@/styles/design-system.css';

// 5. Enterprise Responsive - Global responsive framework (FIFTH)
import '@/styles/home-enterprise.css';

// 6. Layout Components - Shared across all pages (SIXTH)
import '@/styles/header.css';
import '@/styles/footer.css';

// 7. Global Responsive Overrides - Applied LAST for global responsiveness (SEVENTH)
import '@/styles/responsive-overrides.css';

// Page-specific CSS moved to their respective page/layout files for better code splitting
// This prevents CSS conflicts and improves production bundle optimization
import ClientErrorBoundary from '@/components/errors/ClientErrorBoundary';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import ScrollToTop from '@/components/ui/ScrollToTop';
import CustomCursor from '@/components/ui/CustomCursor';
import { organizationSchema, websiteSchema } from '@/lib/seo';
import AgentationProvider from '@/components/providers/AgentationProvider';

// Configure Poppins font - SIMPLE FIX for FOUC
const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap', // Show fallback immediately, swap when Poppins loads
  preload: true, // Critical: preload in HTML head
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
  adjustFontFallback: true, // Match metrics to prevent layout shift
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700', '800', '900'], // All weights for consistency
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://startupsindia.in';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Startups India - India's #1 Startup Ecosystem Platform",
    template: '%s | Startups India',
  },
  description:
    "Startups India is India's most comprehensive startup ecosystem platform - incubation programs, startup funding resources, mentorship from top founders, startup events, online courses, and a thriving community for entrepreneurs, investors, and innovators across India.",
  keywords: [
    // Brand
    'startups india', 'startupsindia', 'startupsindia.in',
    // Ecosystem
    'startup india', 'indian startup ecosystem', 'startup ecosystem india',
    'startup hub india', 'startup culture india', 'best startup platform india',
    // Incubation
    'startup incubation india', 'startup incubator india', 'best incubators india',
    'incubation program india', 'pre-incubation india', 'startup incubation centre',
    'iit incubator india', 'government incubator india', 'atal incubation centre',
    'technology business incubator india', 'tbi india',
    // Funding
    'startup funding india', 'startup fundraising india', 'startup funding guide',
    'seed funding india', 'pre-seed funding india', 'series a india',
    'angel funding india', 'venture capital india', 'startup grants india',
    'sisfs grant india', 'startup india seed fund', 'dpiit recognition',
    // Angel & VC
    'angel investors india', 'angel network india', 'indian angel network',
    'vc firms india', 'top vc india', 'early stage investors india',
    // Programs
    'startup programs india', 'startup scheme india', 'startup india initiative',
    'startup india registration', 'startup india scheme benefits',
    'startup india tax benefits', 'startup india scholarship',
    // Entrepreneurship
    'entrepreneurship india', 'how to start startup india', 'entrepreneur india',
    'young entrepreneur india', 'student entrepreneur india', 'first time founder india',
    'serial entrepreneur india', 'startup ideas india', 'startup opportunities india',
    // Mentorship
    'startup mentors india', 'startup mentorship india', 'startup advisor india',
    'startup coach india', 'find mentor startup india', 'business mentor india',
    // Events
    'startup events india', 'startup summit india', 'pitch competition india',
    'startup hackathon india', 'demo day india', 'startup networking india',
    'startup conference india', 'entrepreneur events india',
    // Community
    'startup community india', 'founder community india', 'entrepreneur community india',
    'startup network india', 'startup forum india',
    // Courses
    'startup courses india', 'entrepreneurship course india', 'startup training india',
    'online startup course india', 'startup education india', 'learn startup building',
    // Registration & Legal
    'startup registration india', 'register startup india', 'company registration startup',
    'startup compliance india', 'startup tax benefits india', 'msme startup india',
    // Sectors
    'fintech startups india', 'healthtech india', 'edtech startup india',
    'agritech india', 'cleantech india', 'saas startup india', 'd2c brand india',
    'deeptech india', 'spacetech india', 'foodtech india', 'ev startup india',
    // Student/College
    'student startup india', 'college startup india', 'iit startup', 'iim startup',
    'e-cell india', 'startup competition college', 'campus entrepreneur india',
    // Stories
    'startup success stories india', 'unicorn startup india', 'indian unicorn list',
    'startup founder story india', 'indian entrepreneur story',
    // Cities
    'startup bangalore', 'startup mumbai', 'startup delhi ncr', 'startup hyderabad',
    'startup pune', 'startup chennai', 'startup ahmedabad', 'startup jaipur',
    // Resources
    'startup resources india', 'startup tools india', 'startup checklist india',
    'startup guide india', 'startup knowledge base',
    // Hiring
    'startup jobs india', 'startup hiring india', 'esop startup india',
    'work at startup india', 'startup career india',
  ],
  authors: [{ name: 'Startups India', url: SITE_URL }],
  creator: 'Startups India',
  publisher: 'Startups India',
  category: 'Startup Ecosystem',
  classification: 'Business/Entrepreneurship',
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: "Startups India - India's #1 Startup Ecosystem Platform",
    description:
      "India's most comprehensive startup platform - incubation programs, funding resources, expert mentorship, startup events, and a community of 50,000+ founders.",
    url: SITE_URL,
    siteName: 'Startups India',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: `${SITE_URL}/assets/images/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "Startups India - India's #1 Startup Ecosystem Platform",
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Startups India - India's #1 Startup Ecosystem Platform",
    description:
      "India's most comprehensive startup platform - incubation, funding, mentorship, events, and community.",
    site: '@startupsindia',
    creator: '@startupsindia',
    images: [`${SITE_URL}/assets/images/og-default.jpg`],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  icons: {
    icon: [
      { url: '/Startupsindia-favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/Startupsindia-favicon.png', sizes: '96x96', type: 'image/png' },
      { url: '/Startupsindia-favicon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: [{ url: '/Startupsindia-favicon.png', type: 'image/png' }],
    apple: [{ url: '/Startupsindia-favicon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  other: {
    'geo.region': 'IN',
    'geo.country': 'India',
    'content-language': 'en-IN',
    'og:locale:alternate': 'hi_IN',
    revisit: '3 days',
    rating: 'General',
    language: 'English',
    coverage: 'India',
    distribution: 'Global',
    target: 'Entrepreneurs, Founders, Investors, Students',
    HandheldFriendly: 'True',
    MobileOptimized: '320',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className={poppins.className} suppressHydrationWarning>
        <script
          type="application/ld+json"
          suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }}
        />
        <ClientErrorBoundary>
          <ConditionalLayout>{children}</ConditionalLayout>
          <CustomCursor />
          <ScrollToTop />
          <AgentationProvider />
        </ClientErrorBoundary>
      </body>
    </html>
  );
}
