import { redirect } from 'next/navigation';

export default function Home() {
  // Wer an die Haustür klopft, wird sofort zum Login geschickt
  redirect('/login');
}