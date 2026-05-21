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
  barber_id: string
}

export default function DashboardPage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  
  // Rol və İstifadəçi məlumatları üçün state-lər
  const [userRole, setUserRole] = useState<'ADMIN' | 'BARBER' | null>(null)
  const [profileName, setProfileName] = useState<string>('İstifadəçi')
  const [currentBarberId, setCurrentBarberId] = useState<string | null>(null)

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true)
      
      // 1. Giriş etmiş cari istifadəçini tapırıq
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // 2. users cədvəlindən bu istifadəçinin rolunu və aid olduğu salonu çəkirik
      const { data: userData } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

      const role = userData?.role || 'ADMIN'
      setUserRole(role)

      let barberId: string | null = null
      let displayName = 'Admin'

      // 3. Əgər istifadəçi BƏRBƏRDİRSƏ, onun bərbər ID-sini və adını tapırıq
      if (role === 'BARBER') {
        const { data: barberData } = await supabase
          .from('barbers')
          .select('id, name')
          .eq('user_id', user.id)
          .single()
        
        if (barberData) {
          barberId = barberData.id
          displayName = barberData.name
          setCurrentBarberId(barberId)
        }
      }
      
      setProfileName(displayName)

      // 4. İlkin məlumatları rola görə süzərək gətirən funksiyasını çağırırıq
      await fetchFilteredData(role, barberId, userData?.tenant_id)
      setLoading(false)

      // 5. Realtime Qoşulma ayarı
      const channel = supabase
        .channel('realtime-appointments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
          fetchFilteredData(role, barberId, userData?.tenant_id)
        })
        .subscribe()

      return channel
    }

    let activeChannel: any = null
    initializeDashboard().then((channel) => {
      activeChannel = channel
    })

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel)
      }
    }
  }, [])

  // Rola görə məlumatları süzgəcdən keçirib gətirən köməkçi funksiya
  const fetchFilteredData = async (role: string, barberId: string | null, tenantId: string | null) => {
    let query = supabase
      .from('appointments')
      .select('id, customer_name, customer_phone, service_type, start_time, status, barber_id')

    // Əgər bərbərdirsə, yalnız öz ID-sinə aid olanları gətir
    if (role === 'BARBER' && barberId) {
      query = query.eq('barber_id', barberId)
    } 
    // Əgər adminsə, yalnız öz salonuna (tenant) aid olanları gətir
    else if (role === 'ADMIN' && tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data } = await query.order('created_at', { ascending: false })
    if (data) setAppointments(data)
  }

  // Status rənglərini təyin edən köməkçi funksiya
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20'
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    }
  }

  if (loading) {
    return <div className="min-h-screen text-gray-400 text-sm flex items-center justify-center">Panel yüklənir...</div>
  }

  return (
    <div className="space-y-8">
      {/* Dinamik Başlıq */}
      <div>
        <h1 className="text-3xl font-bold text-white">Xoş Gəldiniz, {profileName}!</h1>
        <p className="text-gray-400 text-sm mt-1">
          {userRole === 'ADMIN' 
            ? 'Salonunuzun canlı statusu və növbə analizləri.' 
            : 'Şəxsi günlük iş qrafikiniz və sizə gələn sifarişlər.'}
        </p>
      </div>

      {/* Statistika Kartları (İstifadəçinin roluna görə dinamik hesablanır) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Günlük Növbələr', value: appointments.length, icon: Calendar, desc: 'Ümumi qeydə alınan' },
          { 
            title: userRole === 'ADMIN' ? 'Aktiv Bərbərlər' : 'Xidmət Sahəsi', 
            value: userRole === 'ADMIN' ? '5' : 'Saç & Saqqal', 
            icon: Users, 
            desc: userRole === 'ADMIN' ? 'Hazırda iş başında' : 'Profil növü' 
          },
          { title: 'Təxmini Gəlir', value: `${appointments.length * 20} AZN`, icon: TrendingUp, desc: 'Növbə sayı x 20 AZN' },
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

      {/* Süzgəcdən Keçmiş Canlı Növbə Cədvəli */}
      <div className="bg-surface border border-white/10 rounded-2xl p-6 bg-glass-gradient shadow-glass">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          {userRole === 'ADMIN' ? 'Canlı Rezervasiya Axışı (Bütün Salon)' : 'Mənə Aid Canlı Rezervasiyalar'}
        </h2>

        {appointments.length === 0 ? (
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
