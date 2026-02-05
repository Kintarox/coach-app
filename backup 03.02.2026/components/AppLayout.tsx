"use client";

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar'; // Stelle sicher, dass Sidebar.tsx im selben Ordner liegt

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Liste der Seiten, auf denen KEINE Sidebar erscheinen soll
  // Hier prüfen wir auch Unterpfade (z.B. /login/reset oder ähnliches)
  const isPublicPage = pathname === '/login' || pathname === '/register';

  if (isPublicPage) {
    // Layout für Login (Vollbild, keine Sidebar, kein Margin)
    return <main className="w-full min-h-screen bg-white">{children}</main>;
  }

  // Layout für die App (Mit Sidebar)
  return (
    <div className="flex min-h-screen">
      {/* Die Sidebar ist fixed, daher brauchen wir hier keinen Platzhalter, 
          sondern wir nutzen margin-left im Content oder Global */}
      <Sidebar />
      
      {/* WICHTIG: Da wir das ml-64 (Margin Left) bereits in den einzelnen 
         Pages (Dashboard, Training, etc.) manuell hinzugefügt haben, 
         brauchen wir es hier NICHT nochmal auf den Wrapper zu setzen.
         Wir rendern hier nur die children.
      */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}