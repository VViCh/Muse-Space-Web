import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function EventDetails() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const router = useRouter();
  const { isAuthenticated, showAuthModal } = useAuth();
  const [isRsvped, setIsRsvped] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await api.get(`/events/${id}`);
        if (response.data?.isSuccess) {
          const data = response.data.data;
          setEventData(data);
          setAttendeeCount(data.rsvpCount || 0);
          // Determine if RSVPed by checking my-rsvps (since the backend doesn't seem to return it in the single event API if unauthenticated)
          if (isAuthenticated) {
             const rsvpRes = await api.get('/events/my-rsvps');
             if (rsvpRes.data?.isSuccess) {
                const rsvps = rsvpRes.data.data.items || rsvpRes.data.data;
                setIsRsvped(rsvps.some((e: any) => e.id === data.id));
             }
          }
        }
      } catch (err) {
        console.error("Failed to fetch event", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchEventDetails();
  }, [id, isAuthenticated]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    agree: false
  });

  const handleRsvp = () => {
    if (!isAuthenticated) {
      showAuthModal();
      return;
    }
    if (!isRsvped) {
      setShowRegisterModal(true);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.agree) return;
    
    setIsSubmitting(true);
    try {
      await api.post(`/events/${id}/rsvp`);
      setIsRsvped(true);
      setShowRegisterModal(false);
      setShowSuccessModal(true);
      setAttendeeCount(prev => prev + 1);
    } catch (err) {
      console.error("RSVP failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading event details...</div>;
  if (!eventData) return <div className="p-8 text-center text-red-500">Event not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white mb-8 transition-colors font-semibold">
        <span className="material-symbols-outlined">arrow_back</span> Back to Groups
      </button>

      {/* Event Banner */}
      <div className="w-full h-64 md:h-96 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-white/10 mb-8 overflow-hidden relative shadow-sm dark:shadow-none flex items-center justify-center">
        {eventData.bannerUrl ? (
          <img 
            src={eventData.bannerUrl} 
            alt="Event Cover" 
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          <span className="material-symbols-outlined text-9xl text-indigo-300 opacity-20 absolute z-0">event</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 dark:from-[#0c0f0f] dark:via-[#0c0f0f]/40 to-transparent z-10" />
        <div className="absolute bottom-8 left-8 z-20">
          <div className="text-white font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            {new Date(eventData.startDateUtc).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk']">{eventData.title}</h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-sm">{eventData.isOnline ? 'videocam' : 'location_on'}</span>
            {eventData.isOnline ? 'Virtual Exhibition' : eventData.location}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-8 whitespace-pre-wrap">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">About This Event</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              {eventData.description}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Organizer</h2>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border-2 border-indigo-200 dark:border-indigo-500/30 overflow-hidden flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-400">person</span>
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white font-bold">{eventData.organizerUsername || "Organizer"}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl p-6 sticky top-28">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Are you going?</h3>
            <div className="flex -space-x-4 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center relative overflow-hidden shadow-sm">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWmy5Q4ovxN33Th-UGPn98NuvbII0lCPqmH900zYzCXD2mP6WnfsQYg5CyX8rf4tFNtD3EAcK7_vZu3h2MU_Gzi_YsraaLm89EtjkvWOclLf5f7DaiQ6yFiTF5zMb4P_tGqBFSwGcuJdefW5lWWa40l0ig7vMzrnaymQADnuGMjTvqBGxuaz_Ds9JqY1j1zgLWtXElciJZpSH4VQ1En6cYqRdHG1FU-2qPyfeqf01eITZydAYUO7SFxaTcPpAabjipbkR5ZqVqdRs" alt="Attendee" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 z-10 shadow-sm">
                +{attendeeCount}
              </div>
            </div>
            
            <button 
              onClick={handleRsvp}
              disabled={isRsvped}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isRsvped 
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02]'
              }`}>
              <span className="material-symbols-outlined">{isRsvped ? 'how_to_reg' : 'confirmation_number'}</span> 
              {isRsvped ? "Kamu Sudah Terdaftar" : 'RSVP Now'}
            </button>
            <p className="text-center text-slate-500 text-xs mt-4 font-medium">Free for all members</p>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl shadow-slate-900/10 dark:shadow-indigo-900/20 my-8 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk']">RSVP Registration</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg">Galactic Art Showcase {id}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span> OCT 24 • 8:00 PM EST
              </p>
              <div className="mt-3 inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                Free for all members
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  placeholder="Masukkan email aktif"
                  required
                />
              </div>
              
              <div className="flex items-start gap-3 pt-2 pb-2">
                <input 
                  type="checkbox" 
                  id="agree" 
                  checked={formData.agree}
                  onChange={(e) => setFormData({...formData, agree: e.target.checked})}
                  className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  required
                />
                <label htmlFor="agree" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer leading-tight">
                  Saya setuju untuk menghadiri acara ini secara daring/luring sesuai jadwal yang telah ditentukan.
                </label>
              </div>

              <button 
                type="submit"
                disabled={!formData.fullName || !formData.email || !formData.agree || isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 mt-4"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Konfirmasi Pendaftaran</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-slate-900/10 dark:shadow-indigo-900/20">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
                <span className="material-symbols-outlined text-4xl text-emerald-600 dark:text-emerald-400">check_circle</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-4 font-['Space_Grotesk']">Success!</h3>
            <p className="text-slate-600 dark:text-slate-300 text-center mb-8">
              Pendaftaran Anda berhasil! Tiket telah ditambahkan ke dashboard Anda.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push('/dashboard?ticket=true')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2">
                <span className="material-symbols-outlined">local_activity</span> Lihat Tiket Saya
              </button>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl font-bold transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



