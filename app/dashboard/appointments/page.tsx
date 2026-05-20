'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Check, X, Calendar, Clock, User, Phone, Scissors, Zap } from 'lucide-react'

interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  service_type: string
  start_time: string
  date: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  barbers: { name: string } | null
}

export default function AppointmentsPage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  // Növbələri bazadan gətiririk (bərbərin adı ilə birlikdə)
  const fetchAppointments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('id, customer_name, customer_phone, service_type, start_time, date, status, barbers(name)')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (data) setAppointments(data as any)
    setLoading(false)
  }

  useEffect(() => {
    fetchAppointments()

    // Realtime: Kimsə yeni növbə götürəndə siyahı avtomatik yenilənsin
    const channel = supabase
      .channel('admin-appointments-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Statusu Yeniləmək Funksiyası (Təsdiqlə / Ləğv et / Tamamla)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Status yenilənərkən xəta: ' + error.message)
    } else {
      // Siyahını lokal olaraq anında yeniləyirik
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: newStatus as any } : app))
    }
  }

  // Filtrləmə məntiqi
  const filteredAppointments = appointments.filter(app => {
    if (filter === 'ALL') return true
    return app.status === filter
  })

  // Status rəngləri
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'CANCELLED': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'COMPLETED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }
  }

  return (
    <div className="space-y-8">
      {/* Üst Başlıq */}
      <div>
        <h1 className="text-3xl font-bold text-white">Növbə İdarəetməsi</h1>
        <p className="text-gray-400 text-sm mt-1">Gələn rezervasiyaları təsdiqləyin və ya statuslarını dəyişin.</p>
      </div>

      {/* Filtr Tabları (Premium Naviqasiya) */}
      <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl w-fit">
        {[
          { key: 'ALL', label: 'Hamısı' },
          { key: 'PENDING', label: 'Gözləyənlər' },
          { key: 'CONFIRMED', label: 'Təsdiqlənənlər' },
          { key: 'COMPLETED', label: 'Tamamlananlar' },
          { key: 'CANCELLED', label: 'Ləğv edilənlər' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              filter === tab.key 
                ? 'bg-[#D4AF37] text-black font-bold shadow-gold-glow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Siyahı */}
      {loading ? (
        <div className="text-[#D4AF37] animate-pulse">Növbələr yüklənir...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-white/10 rounded-2xl bg-glass-gradient">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Bu kateqoriyada heç bir növbə tapılmadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredAppointments.map((app) => (
            <div 
              key={app.id} 
              className="bg-surface border border-white/10 rounded-2xl p-6 bg-glass-gradient shadow-glass flex flex-col justify-between hover:border-white/20 transition-all relative overflow-hidden group"
            >
              {/* Sol tərəfdə rəng xətti */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                app.status === 'CONFIRMED' ? 'bg-green-500' :
                app.status === 'CANCELLED' ? 'bg-red-500' :
                app.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-yellow-500'
              }`} />

              <div className="space-y-4">
                {/* Üst sətir: Müştəri adı və Status */}
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {app.customer_name}
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" /> {app.customer_phone}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(app.status)}`}>
                    {app.status === 'PENDING' ? 'Gözləmədə' :
                     app.status === 'CONFIRMED' ? 'Təsdiqləndi' :
                     app.status === 'CANCELLED' ? 'Ləğv edildi' : 'Tamamlandı'}
                  </span>
                </div>

                {/* Detallar */}
                <div className="grid grid-cols-2 gap-3 bg-black/30 p-3 rounded-xl border border-white/5 pl-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-gray-500">Xidmət</p>
                    <p className="text-white font-medium flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-[#D4AF37]" /> {app.service_type}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Bərbər</p>
                    <p className="text-[#D4AF37] font-medium">@{app.barbers?.name || 'Bilinmir'}</p>
                  </div>
                  <div className="space-y-1 mt-2">
                    <p className="text-gray-500">Tarix</p>
                    <p className="text-white font-medium">{app.date}</p>
                  </div>
                  <div className="space-y-1 mt-2">
                    <p className="text-gray-500">Saat</p>
                    <p className="text-white font-bold font-mono tracking-wider text-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> {app.start_time.slice(0, 5)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hərəkət Düymələri (Aksiyalar) */}
              {app.status === 'PENDING' && (
                <div className="flex gap-2 mt-6 pl-2">
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'CONFIRMED')}
                    className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black font-bold text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Təsdiqlə
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                    className="py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs transition-all flex items-center justify-center"
                  >
                    <X className="w-4 h-4" /> İmtina
                  </button>
                </div>
              )}

              {app.status === 'CONFIRMED' && (
                <div className="flex gap-2 mt-6 pl-2">
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                    className="flex-1 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-black font-bold text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <Zap className="w-4 h-4" /> Müştəri Gəldi (Tamamla)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                    className="py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs transition-all flex items-center justify-center"
                  >
                    Ləğv et
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}