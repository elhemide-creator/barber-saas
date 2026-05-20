'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { LayoutDashboard, Scissors, CalendarDays, LogOut, Globe } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const menuItems = [
    { name: 'Gözdən Keçir', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bərbərlər', href: '/dashboard/barbers', icon: Scissors },
    { name: 'Növbələr', href: '/dashboard/appointments', icon: CalendarDays },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      <aside className="w-64 bg-[#171717] border-r border-white/10 p-6 flex flex-col justify-between backdrop-blur-md">
        <div>
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-wider text-[#D4AF37]">BARBER <span className="text-white">SAAS</span></h2>
            <p className="text-xs text-gray-500 mt-1">MVP v1.0</p>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive 
                      ? 'bg-[#D4AF37] text-black font-bold shadow-md' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 border border-white/5 text-sm text-gray-400">
            <Globe className="w-4 h-4 text-[#D4AF37]" />
            <select className="bg-transparent outline-none cursor-pointer w-full text-xs text-white">
              <option value="az" className="bg-[#171717]">Azərbaycan</option>
              <option value="en" className="bg-[#171717]">English</option>
              <option value="ru" className="bg-[#171717]">Русский</option>
            </select>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-all"
          >
            <LogOut className="w-5 h-5" />
            Çıxış Paneli
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}