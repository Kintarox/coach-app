"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const version = "v1.0.2";
  
  const pathname = usePathname();
  const isFullWidthPage = pathname === '/login' || pathname === '/register' || pathname === '/';
  const positionClass = isFullWidthPage ? 'left-0' : 'left-64';

  return (
    <footer className={`fixed bottom-0 right-0 ${positionClass} z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 py-3 print:hidden text-[#1D1D1F] transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-row justify-between items-center gap-4">
          
          {/* LINKS */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest">
              Coach App
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              © {currentYear}
            </span>
            
            {/* HIER IST DIE ÄNDERUNG: Link um den Badge */}
            <Link href="/changelog" className="hidden sm:flex items-center gap-1.5 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-all cursor-pointer group">
               <span className="w-1 h-1 rounded-full bg-emerald-500 group-hover:animate-ping"></span>
               <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider leading-none">
                 {version}
               </span>
            </Link>

          </div>

          {/* RECHTS */}
          <div className="flex items-center gap-6">
            <FooterLink href="/impressum">Impressum</FooterLink>
            <FooterLink href="/datenschutz">Datenschutz</FooterLink>
            <FooterLink href="/kontakt">Support</FooterLink>
          </div>

        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
    >
      {children}
    </Link>
  );
}