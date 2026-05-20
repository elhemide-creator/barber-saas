import { redirect } from 'next/navigation'

export default function HomePage() {
  // Sayta daxil olan kimi avtomatik login səhifəsinə yönləndirir
  redirect('/login')
}