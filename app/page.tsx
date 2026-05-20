import { redirect } from 'next/navigation';

export default function HomePage() {
  // Sayta girəni birbaşa Azərbaycan dilindəki loqin səhifəsinə göndəririk
  redirect('/az/login');
}
