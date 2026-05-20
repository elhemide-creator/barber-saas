import { redirect } from 'next/navigation';

export default function HomePage() {
  // Heç bir əlavə paket olmadan birbaşa yönləndirmə edir
  redirect('/login');
}
