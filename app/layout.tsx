import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Supply Chain Risk Analyzer | CognoDB Graph Intelligence',
  description: 'Graph-native supply chain dependency tracking, multi-hop outage blast radius simulation, and single point of failure (SPOF) risk analysis powered by CognoDB and Cypher.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-slate-100 min-h-screen flex flex-col selection:bg-blue-600 selection:text-white antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

