// Vercel serverlərini çökdürən fs və path paketlərini tamamilə ləğv etdik.
// Dilləri (AZ, EN, RU) birbaşa və sürətli şəkildə Next.js daxilində idarə edirik.

export type Locale = 'az' | 'en' | 'ru';

export const languages: Record<Locale, { name: string; flag: string }> = {
  az: { name: 'Azərbaycan', flag: '🇦🇿' },
  en: { name: 'English', flag: '🇬🇧' },
  ru: { name: 'Русский', flag: '🇷🇺' }
};

// Səhifələrdə tərcümə sözlərini gətirmək üçün istifadə olunan əsas funksiya:
export const getDictionary = async (locale: Locale) => {
  try {
    // JSON tərcümə fayllarını qovluq oxumadan, birbaşa Next.js-in dinamik importu ilə çəkirik:
    switch (locale) {
      case 'en':
        return (await import('./en.json')).default;
      case 'ru':
        return (await import('./ru.json')).default;
      case 'az':
      default:
        return (await import('./az.json')).default;
    }
  } catch (error) {
    console.error("Dil faylı yüklənərkən xəta baş verdi, avtomatik AZ seçilir:", error);
    // Hər hansı xəta olarsa, sistem çökməsin deyə AZ dilini qaytarırıq
    return (await import('./az.json')).default;
  }
};
