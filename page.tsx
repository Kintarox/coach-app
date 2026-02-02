import { redirect } from 'next/navigation';

export default function Home() {
  // Leitet sofort weiter auf /login
  redirect('/login');
}