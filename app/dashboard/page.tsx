'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react'

interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  service_type: string
  start_time: string
  status: string
}

export default function DashboardPage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  // Məlumatları bazadan çəkirik
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, customer_name, customer_phone, service_type, start_time, status')
        .order('created_at', { ascending: false })

      if (data) setAppointments(data)
      setLoading(false)
    }

    fetchInitialData()

    // Realtime Qoşulma: Yeni bir rezervasiya olanda ekrana anında düşür
    const channel = supabase
      .channel('realtime-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchInitialData() // Hər hansı dəyişiklikdə datanı yenilə
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Status rənglərini təyin edən köməkçi funksiya
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20'
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    }
  }

  return (
    <div className="space-y-8">
      {/* Başlıq */}
      <div>
        <h1 className="text-3xl font-bold text-white">Xoş Gəldiniz, Admin!</h1>
        <p className="text-gray-400 text-sm mt-1">Salonunuzun canlı statusu və növbə analizləri.</p>
      </div>

      {/* Statistika Kartları (MVP Analitika) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Günlük Növbələr', value: appointments.length, icon: Calendar, desc: 'Bu gün gözlənilən' },
          { title: 'Aktiv Bərbərlər', value: '5', icon: Users, desc: 'Hazırda iş başında' },
          { title: 'Təxmini Gəlir', value: '180 AZN', icon: TrendingUp, desc: 'Günlük struktur' },
          { title: 'Gözləmədə Olan', value: appointments.filter(a => a.status === 'PENDING').length, icon: Clock, desc: 'Təsdiq gözləyən' },
        ].map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className="bg-surface border border-white/10 rounded-2xl p-6 bg-glass-gradient shadow-glass">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                  <h3 className="text-3xl font-bold mt-2 text-gold">{card.value}</h3>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">{card.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Canlı Növbə Cədvəli */}
      <div className="bg-surface border border-white/10 rounded-2xl p-6 bg-glass-gradient shadow-glass">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Canlı Rezervasiya Axışı
        </h2>

        {loading ? (
          <p className="text-gray-400 text-sm">Yüklənir...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-400 text-sm">Hələ ki heç bir rezervasiya daxil olmayıb.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-gray-400 uppercase text-xs border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Müştəri</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4">Xidmət</th>
                  <th className="py-3 px-4">Saat</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-medium text-white">{app.customer_name}</td>
                    <td className="py-4 px-4 text-gray-400">{app.customer_phone}</td>
                    <td className="py-4 px-4">{app.service_type}</td>
                    <td className="py-4 px-4 text-gold font-mono">{app.start_time}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusClass(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}