'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { Calendar, Clock, User, Phone, Scissors, CheckCircle2, Globe } from 'lucide-react'

// LÜĞƏTİ BİRBAŞA BURAYA ƏLAVƏ ETDİK (Import xətası sıfırlandı!)
type LangType = 'az' | 'en' | 'ru'
const languages = {
  az: {
    title: "Onlayn Növbə Sistemi",
    placeholderName: "Adınız və Soyadınız",
    placeholderPhone: "Telefon nömrəniz",
    selectTime: "Bu gün üçün uygun saatı seçin:",
    submitBtn: "Növbəni Təsdiqlə",
    successTitle: "Rezervasiya Uğurludur!",
    successDesc: "Növbəniz qeydə alındı. Təsdiqlənmə barədə sizə məlumat veriləcək.",
    newBooking: "Yeni Növbə"
  },
  en: {
    title: "Online Booking System",
    placeholderName: "Your Full Name",
    placeholderPhone: "Your Phone Number",
    selectTime: "Choose an available time:",
    submitBtn: "Confirm Appointment",
    successTitle: "Booking Successful!",
    successDesc: "Your appointment has been recorded. You will be notified.",
    newBooking: "New Booking"
  },
  ru: {
    title: "Онлайн Система Очереди",
    placeholderName: "Ваше Имя и Фамилия",
    placeholderPhone: "Номер телефона",
    selectTime: "Выберите доступное время:",
    submitBtn: "Подтвердить Запись",
    successTitle: "Запись Успешна!",
    successDesc: "Ваша запись зарегистрирована. Мы уведомим вас.",
    newBooking: "Новая Запись"
  }
}

interface BarberData {
  id: string
  name: string
  tenant_id: string
}

export default function BarberBookingPage() {
  const params = useParams()
  const barberSlug = params.slug as string
  const supabase = createClient()

  // Dil tənzimləməsi
  const [currentLang, setCurrentLang] = useState<LangType>('az')
  const t = languages[currentLang]

  // State-lər
  const [barber, setBarber] = useState<BarberData | null>(null)
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [serviceType, setServiceType] = useState('Saç kəsimi')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
  const todayDate = new Date().toISOString().split('T')[0]

  const loadPageData = async () => {
    try {
      const { data: barberData, error: bError } = await supabase
        .from('barbers')
        .select('id, name, tenant_id')
        .eq('slug', barberSlug)
        .single()

      if (bError || !barberData) {
        setError('Bərbər tapılmadı!')
        setLoading(false)
        return
      }

      setBarber(barberData)

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('barber_id', barberData.id)
        .eq('date', todayDate)

      if (appointmentsData) {
        setBookedTimes(appointmentsData.map(a => a.start_time.slice(0, 5)))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPageData()

    const channel = supabase
      .channel('public-appointments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, (payload) => {
        if (barber && payload.new.barber_id === barber.id && payload.new.date === todayDate) {
          const newTime = payload.new.start_time.slice(0, 5)
          setBookedTimes(prev => [...prev, newTime])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [barberSlug, barber?.id])

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barber || !selectedTime) return

    setError(null)

    const { error: insertError } = await supabase.from('appointments').insert([
      {
        tenant_id: barber.tenant_id,
        barber_id: barber.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_type: serviceType,
        date: todayDate,
        start_time: selectedTime,
        status: 'PENDING'
      }
    ])

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-[#D4AF37] animate-pulse font-medium text-lg">Yüklənir...</div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#171717] border border-white/10 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#D4AF37] mb-2">{t.successTitle}</h2>
          <p className="text-gray-300 text-sm">{t.successDesc}</p>
          <button onClick={() => window.location.reload()} className="mt-6 text-sm bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg">
            {t.newBooking}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 relative">
      
      {/* Dil Seçici */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#171717] border border-white/10 rounded-xl px-3 py-1.5 text-xs">
        <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
        <select 
          value={currentLang} 
          onChange={(e) => setCurrentLang(e.target.value as LangType)}
          className="bg-transparent outline-none cursor-pointer text-white font-medium"
        >
          <option value="az" className="bg-[#171717]">AZ</option>
          <option value="en" className="bg-[#171717]">EN</option>
          <option value="ru" className="bg-[#171717]">RU</option>
        </select>
      </div>

      <div className="w-full max-w-md bg-[#171717] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-black/40 border border-[#D4AF37]/40 flex items-center justify-center mx-auto mb-3">
            <Scissors className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold text-[#D4AF37]">{t.title}</h1>
          <p className="text-gray-400 text-xs mt-1">Bərbər: <span className="text-white font-medium">{barber?.name}</span></p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg mb-4 text-center">{error}</div>}

        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="relative">
            <User className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
            <input
              type="text"
              required
              placeholder={t.placeholderName}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pl-11 text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="relative">
            <Phone className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
            <input
              type="tel"
              required
              placeholder={t.placeholderPhone}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pl-11 text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="relative">
            <Scissors className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pl-11 text-sm text-white focus:outline-none focus:border-[#D4AF37] appearance-none cursor-pointer"
            >
              <option value="Saç kəsimi" className="bg-[#171717]">Saç kəsimi (10 AZN)</option>
              <option value="Saç və Saqqal" className="bg-[#171717]">Saç və Saqqal (15 AZN)</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mb-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              {t.selectTime}
            </label>
            
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => {
                const isBooked = bookedTimes.includes(time)
                const isSelected = selectedTime === time

                return (
                  <button
                    key={time}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 rounded-lg text-xs font-mono font-medium transition-all border ${
                      isBooked 
                        ? 'bg-red-500/5 border-red-500/10 text-gray-600 line-through' 
                        : isSelected
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold shadow-md'
                          : 'bg-black/20 border-white/5 text-gray-300 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          </div>

          <button type="submit" className="w-full bg-[#D4AF37] hover:bg-[#AA8C2C] text-black font-bold py-3 rounded-lg text-sm transition-colors mt-4">
            {t.submitBtn}
          </button>
        </form>
      </div>
    </div>
  )
}