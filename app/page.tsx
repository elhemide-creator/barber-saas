import { redirect } from 'next/navigation';

export default function HomePage() {
  // Sənin real qovluq strukturuna uyğun olaraq birbaşa /login səhifəsinə yönləndiririk
  redirect('/login');
}
