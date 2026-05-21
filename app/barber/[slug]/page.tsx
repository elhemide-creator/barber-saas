'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { languages } from '../../../lib/supabase/languages'

// Standart olaraq iş saatları siyahısı
const AVAILABLE_TIMES = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

export default function BarberBookingPage() {
  const params = useParams()
  const slug = params.slug as string
  const lang = 'az' // Standart olaraq Azərbaycan dili (languages faylına uyğun)
  const t = languages[lang]

  const [barber, setBarber] = useState<any>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // 1. URL-dəki slug-a görə bərbərin məlumatlarını Supabase-dən çəkirik
  useEffect(() => {
    async function getBarber() {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        setError('Bərbər tapılmadı.')
      } else {
        setBarber(data)
      }
    }
    getBarber()
  }, [slug]) // Vergül xətası tamamilə düzəldildi

  // 2. Növbəni təsdiqləmə funksiyası (Şəkildəki real bazaya uyğunlaşdırıldı)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTime) {
      alert(t.selectTime)
      return
    }

    setLoading(true)
    setError(null)

    const { error: bookingError } = await supabase
      .from('appointments')
      .insert([
        {
          barber_id: barber.id,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          date: new Date().toISOString().split('T')[0], // 'date' olaraq yeniləndi
          start_time: selectedTime,                     // 'start_time' olaraq yeniləndi
          status: 'PENDING',                            // Böyük hərflə 'PENDING' edildı
          service_type: 'Saç kəsimi'                    // Default olaraq əlavə edildi
        }
      ])

    setLoading(false)

    if (bookingError) {
      setError('Növbə qeydə alınarkən xəta baş verdi: ' + bookingError.message)
    } else {
      setSuccess(true)
    }
  }

  if (error) {
    return <div className="min-h-screen bg-[#0a0a0a] text-red-400 flex items-center justify-center">{error}</div>
  }

  if (!barber) {
    return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Yüklənir...</div>
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#171717] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
        
        {/* Uğurlu Rezervasiya Ekranı */}
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-400 text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">{t.successTitle}</h2>
            <p className="text-gray-400 text-sm mb-6">{t.successDesc}</p>
            <button 
              onClick={() => { setSuccess(false); setName(''); setPhone(''); setSelectedTime('') }}
              className="bg-[#D4AF37] hover:bg-[#AA8C2C] text-black font-bold px-6 py-2 rounded-lg transition-colors"
            >
              {t.newBooking}
            </button>
          </div>
        ) : (
          /* Növbə Götürmə Formu */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-[#D4AF37] mb-1">{barber.name}</h1>
              <p className="text-gray-400 text-sm">{t.title}</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t.placeholderName}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              />

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder={t.placeholderPhone}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>

            {/* Saat Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">{t.selectTime}</label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_TIMES.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 text-sm font-semibold rounded-lg border transition-all ${
                      selectedTime === time
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                        : 'bg-black/20 border-white/10 text-gray-300 hover:border-white/30'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#AA8C2C] disabled:opacity-50 text-black font-bold py-3 rounded-lg transition-colors mt-4"
            >
              {loading ? 'Gözləyin...' : t.submitBtn}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
