import { redirect } from 'next/navigation';

export default function Home() {
  // Wer die Seite aufruft, fliegt sofort zum Login
  redirect('/login');
}