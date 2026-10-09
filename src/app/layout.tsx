import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZeroTrust Forensics — Digital Forensics Case Management System',
  description: 'Portfolio-grade Zero-Trust Digital Forensics Vault with Cryptographic Chain of Custody & Hash-Linked Audit Ledger',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F19] text-gray-100 antialiased selection:bg-cyan-500 selection:text-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
