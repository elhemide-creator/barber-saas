'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Plus, Trash2, Edit, Scissors, Clock } from 'lucide-react'

interface Barber {
  id: string
  name: string
  slug: string
  image_url: string | null
}

export default function BarbersPage() {
  const supabase = createClient()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newBarberName, setNewBarberName] = useState('')

  const fetchBarbers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('barbers')
      .select('id, name, slug, image_url')
      .order('created_at', { ascending: false })

    if (data) setBarbers(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchBarbers()
  }, [])

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const generateSlug = (text: string) => {
      return text.toLowerCase()
        .replace(/ə/g, 'e').replace(/ö/g, 'o').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    }

    const slug = generateSlug(newBarberName)

    try {
      // 1. Sənin hesabını və sənə aid olan salonu (tenant_id) tapırıq
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error("Giriş edilməyib!")

      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', authData.user.id).single()

      if (!userData || !userData.tenant_id) {
        throw new Error("Salon (tenant) tapılmadı! Zəhmət olmasa yuxarıdakı SQL kodunu Supabase-də icra edin.")
      }

      // 2. Bərbəri verilənlər bazasına sənin salonunla əlavə edirik
      const { error: insertError } = await supabase.from('barbers').insert([
        { 
          name: newBarberName, 
          slug: slug,
          tenant_id: userData.tenant_id // Əsas məsələ bu idi!
        }
      ])

      if (insertError) throw insertError

      setNewBarberName('')
      setIsModalOpen(false)
      fetchBarbers()
    } catch (err: any) {
      console.error("Bərbər əlavə etmə xətası:", err)
      // Əgər yenə xəta olarsa, səbəbini birbaşa qırmızı qutuda yazdırırıq
      setError(err.message || 'Sistem xətası baş verdi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu bərbəri silmək istədiyinizə əminsiniz?')) return

    const { error } = await supabase.from('barbers').delete().eq('id', id)
    if (!error) {
      setBarbers(barbers.filter(b => b.id !== id))
    } else {
      alert('Silinmə zamanı xəta baş verdi!')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Komanda & Bərbərlər</h1>
          <p className="text-gray-400 text-sm mt-1">Salonunuzdakı peşəkarları buradan idarə edin.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#D4AF37] hover:bg-[#AA8C2C] text-black font-bold py-2.5 px-5 rounded-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Bərbər
        </button>
      </div>

      {loading ? (
        <div className="text-gold animate-pulse">Yüklənir...</div>
      ) : barbers.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-white/10 rounded-2xl bg-glass-gradient">
          <Scissors className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Hələ bərbər əlavə edilməyib</h3>
          <p className="text-gray-400">İlk bərbərinizi əlavə edərək sistemə başlayın.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {barbers.map((barber) => (
            <div key={barber.id} className="bg-surface border border-white/10 rounded-2xl p-6 bg-glass-gradient shadow-glass group hover:border-gold/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-black/50 border border-[#D4AF37]/50 flex items-center justify-center overflow-hidden">
                    {barber.image_url ? (
                      <img src={barber.image_url} alt={barber.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-[#D4AF37]">{barber.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">{barber.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 10:00 - 20:00
                    </p>
                    <p className="text-xs text-blue-400 mt-1 cursor-pointer hover:underline">
                      /barber/{barber.slug}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5">
                <button className="flex-1 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm">
                  <Edit className="w-4 h-4" /> Düzəliş et
                </button>
                <button 
                  onClick={() => handleDelete(barber.id)}
                  className="py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-6">Yeni Bərbər Əlavə Et</h2>
            
            {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

            <form onSubmit={handleAddBarber} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Bərbərin Adı və Soyadı</label>
                <input
                  type="text"
                  value={newBarberName}
                  onChange={(e) => setNewBarberName(e.target.value)}
                  required
                  placeholder="Məs: Həmidli Həmidov"
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#AA8C2C] disabled:opacity-50 text-black font-bold py-3 rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Saxlanılır...' : 'Yadda Saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}