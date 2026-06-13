"use client";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';


export default function Settings() {
  const { i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuDWmy5Q4ovxN33Th-UGPn98NuvbII0lCPqmH900zYzCXD2mP6WnfsQYg5CyX8rf4tFNtD3EAcK7_vZu3h2MU_Gzi_YsraaLm89EtjkvWOclLf5f7DaiQ6yFiTF5zMb4P_tGqBFSwGcuJdefW5lWWa40l0ig7vMzrnaymQADnuGMjTvqBGxuaz_Ds9JqY1j1zgLWtXElciJZpSH4VQ1En6cYqRdHG1FU-2qPyfeqf01eITZydAYUO7SFxaTcPpAabjipbkR5ZqVqdRs');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bio, setBio] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Commissions State
  const [isAcceptingCommissions, setIsAcceptingCommissions] = useState(false);
  const [isTogglingCommissions, setIsTogglingCommissions] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfilePhoto(url);
      setProfilePhotoFile(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBannerUrl(url);
      setBannerFile(file);
    }
  };

  // Artist Payment Settings State
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });

  // Fetch Profile & Payment Settings on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Fetch Payment Settings
      axios.get('/api/artist/settings')
        .then(res => {
          if (res.data) {
            setPaymentData({
              bankName: res.data.bankName || '',
              accountNumber: res.data.accountNumber || '',
              accountHolder: res.data.accountHolder || ''
            });
          }
        })
        .catch(err => console.error("Failed to fetch artist payment settings", err));

      // Fetch User Profile
      import('@/lib/api').then(({ default: api }) => {
        api.get(`/users/${user.id}/profile`)
          .then(res => {
            if (res.data?.isSuccess && res.data.data) {
              setIsAcceptingCommissions(res.data.data.isAcceptingCommissions || false);
              setBio(res.data.data.bio || '');
              if (res.data.data.avatarUrl) {
                setProfilePhoto(res.data.data.avatarUrl);
              }
              if (res.data.data.bannerUrl) {
                setBannerUrl(res.data.data.bannerUrl);
              }
            }
          })
          .catch(err => console.error("Failed to fetch profile", err));
      });
    }
  }, [isAuthenticated, user]);

  const isPaymentDataValid = paymentData.bankName.trim() !== '' && paymentData.accountNumber.trim() !== '' && paymentData.accountHolder.trim() !== '';

  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const handleToggleCommissions = async () => {
    setIsTogglingCommissions(true);
    setMessage(null);
    try {
      const { default: api } = await import('@/lib/api');
      const res = await api.put('/users/profile/commissions-status', {
        isAcceptingCommissions: !isAcceptingCommissions
      });
      if (res.data?.isSuccess) {
        setIsAcceptingCommissions(!isAcceptingCommissions);
        setMessage({type: 'success', text: res.data.message || 'Status updated'});
      } else {
        setMessage({type: 'error', text: res.data?.message || 'Failed to update status'});
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.errors?.validation?.[0] || err.response?.data?.message || 'Failed to update status';
      setMessage({type: 'error', text: errorMessage});
    } finally {
      setIsTogglingCommissions(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setMessage(null);
    try {
      const { default: api } = await import('@/lib/api');
      
      let avatarUrlToSave = profilePhoto;
      let bannerUrlToSave = bannerUrl;
      
      // Upload avatar if it's a new file
      if (profilePhotoFile) {
        const formData = new FormData();
        formData.append('file', profilePhotoFile);
        const uploadRes = await api.post('/users/profile/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        if (uploadRes.data?.isSuccess) {
          avatarUrlToSave = uploadRes.data.data;
          setProfilePhoto(avatarUrlToSave);
          setProfilePhotoFile(null);
        } else {
          setMessage({type: 'error', text: 'Failed to upload avatar image'});
          setIsSavingProfile(false);
          return;
        }
      }

      // Upload banner if it's a new file
      if (bannerFile) {
        const formData = new FormData();
        formData.append('file', bannerFile);
        const uploadRes = await api.post('/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        if (uploadRes.data?.isSuccess) {
          bannerUrlToSave = uploadRes.data.data.url;
          setBannerUrl(bannerUrlToSave);
          setBannerFile(null);
        } else {
          setMessage({type: 'error', text: 'Failed to upload banner image'});
          setIsSavingProfile(false);
          return;
        }
      }

      const res = await api.put('/users/profile', {
        bio: bio,
        avatarUrl: avatarUrlToSave,
        bannerUrl: bannerUrlToSave
      });
      if (res.data?.isSuccess) {
        setMessage({type: 'success', text: 'Profile saved successfully!'});
      } else {
        setMessage({type: 'error', text: res.data?.message || 'Failed to save profile'});
      }
    } catch (err: any) {
      setMessage({type: 'error', text: err.response?.data?.message || 'Failed to save profile'});
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePayment = async () => {
    if (!isPaymentDataValid) return;
    setIsLoadingPayment(true);
    setMessage(null);
    try {
      await axios.post('/api/artist/settings', paymentData);
      setMessage({type: 'success', text: 'Settings Saved Successfully'});
      setIsEditingPayment(false);
    } catch (error) {
      console.error("Failed to save artist payment settings", error);
      setMessage({type: 'error', text: 'Failed to save settings. Please try again.'});
    } finally {
      setIsLoadingPayment(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-white/10 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] mb-2">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your preferences and profile.</p>
        </div>
      </div>

      {message && (
        <div className={`mb-8 p-4 border rounded-xl flex items-center gap-3 animate-[fadeIn_0.3s_ease-out] ${message.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'}`}>
          <span className="material-symbols-outlined">{message.type === 'error' ? 'error' : 'check_circle'}</span>
          <p className="flex-1 mt-0.5 font-medium">{message.text}</p>
        </div>
      )}

      <div className="space-y-8">
        
        {/* General Settings (Visible to Everyone) */}
        <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">language</span>
            Language Options
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Language</label>
            <select 
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="w-full max-w-md bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
              <option value="zh">中文</option>
              <option value="ja">日本語 (Japanese)</option>
            </select>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose the primary language for your interface.</p>
          </div>
        </section>

        {/* Authenticated Settings (Visible Only to Logged In Users) */}
        {isAuthenticated && (
          <div className="space-y-8">
            <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">account_circle</span>
              Edit Profile
            </h2>
            
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden shrink-0">
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">Upload a new photo to change your avatar.</p>
                  
                  <div className="flex gap-4">
                    <label className="cursor-pointer px-6 py-3 bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none  text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">upload</span>
                      Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    
                    <button 
                      onClick={() => {
                        setProfilePhoto('');
                        setProfilePhotoFile(null);
                      }}
                      className="px-6 py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-transparent dark:border-white/10 rounded-xl font-bold transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                ></textarea>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Brief description for your profile.</p>
              </div>
            </div>
          </section>

          {/* Commission Status */}
          <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">storefront</span>
              Commission Status
            </h2>
            
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-white/5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Accept Commissions</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Allow users to request and pay for custom artworks. You must have at least 5 artworks posted to enable this.
                </p>
              </div>
              <button 
                onClick={handleToggleCommissions}
                disabled={isTogglingCommissions}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${isAcceptingCommissions ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'} disabled:opacity-50`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAcceptingCommissions ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
          </section>

          {/* Artist Payment Settings */}
          <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm animate-[fadeIn_0.3s_ease-out]">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">account_balance</span>
              {i18n.language === 'id' ? 'Pengaturan Pembayaran Artist' : 'Artist Payment Settings'}
            </h2>
            
            {!isEditingPayment ? (
              <div className="relative bg-slate-800 dark:bg-slate-900 border border-[#D4AF37]/30 rounded-xl p-6 shadow-xl transition-all duration-500 max-w-2xl">
                <button 
                  onClick={() => setIsEditingPayment(true)}
                  className="absolute top-4 right-4 text-[#D4AF37] hover:text-[#f4d068] transition-colors p-2 hover:bg-white/5 rounded-full"
                  title="Edit Settings"
                >
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
                <div className="space-y-6">
                  <div>
                    <span className="block text-xs font-bold text-[#D4AF37]/80 uppercase tracking-[0.15em] mb-1">
                      {i18n.language === 'id' ? 'Nama Bank' : 'Bank Name'}
                    </span>
                    <span className="text-xl text-slate-200">{paymentData.bankName || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#D4AF37]/80 uppercase tracking-[0.15em] mb-1">
                      {i18n.language === 'id' ? 'Nomor Rekening' : 'Account Number'}
                    </span>
                    <span className="text-xl text-slate-200 tracking-wider">{paymentData.accountNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#D4AF37]/80 uppercase tracking-[0.15em] mb-1">
                      {i18n.language === 'id' ? 'Nama Pemilik Rekening' : 'Account Holder Name'}
                    </span>
                    <span className="text-xl text-slate-200">{paymentData.accountHolder || '-'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 dark:bg-slate-900 border border-[#D4AF37]/60 rounded-xl p-6 shadow-2xl transition-all duration-500 max-w-2xl animate-[fadeIn_0.3s_ease-out]">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-[0.15em] mb-2">
                      {i18n.language === 'id' ? 'Nama Bank' : 'Bank Name'}
                    </label>
                    <input 
                      type="text" 
                      value={paymentData.bankName}
                      onChange={(e) => setPaymentData({...paymentData, bankName: e.target.value})}
                      placeholder={i18n.language === 'id' ? 'Contoh: BCA, Mandiri, BNI' : 'e.g., Chase, Bank of America'}
                      className={`w-full bg-slate-950/50 border ${paymentData.bankName.trim() === '' ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500' : 'border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]'} rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-[0.15em] mb-2">
                      {i18n.language === 'id' ? 'Nomor Rekening' : 'Account Number'}
                    </label>
                    <input 
                      type="text" 
                      value={paymentData.accountNumber}
                      onChange={(e) => setPaymentData({...paymentData, accountNumber: e.target.value})}
                      placeholder={i18n.language === 'id' ? 'Masukkan nomor rekening' : 'Enter account number'}
                      className={`w-full bg-slate-950/50 border ${paymentData.accountNumber.trim() === '' ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500' : 'border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]'} rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 font-sans tracking-wide`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-[0.15em] mb-2">
                      {i18n.language === 'id' ? 'Nama Pemilik Rekening' : 'Account Holder Name'}
                    </label>
                    <input 
                      type="text" 
                      value={paymentData.accountHolder}
                      onChange={(e) => setPaymentData({...paymentData, accountHolder: e.target.value})}
                      placeholder={i18n.language === 'id' ? 'Sesuai dengan buku tabungan' : 'As it appears on bank statement'}
                      className={`w-full bg-slate-950/50 border ${paymentData.accountHolder.trim() === '' ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500' : 'border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]'} rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Profile Banner</label>
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-full sm:w-64 h-32 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 shadow-sm relative">
                      {bannerUrl ? (
                        <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-4xl">image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                      <label className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-900 dark:text-white rounded-xl font-bold cursor-pointer transition-all text-center shadow-sm">
                        Change Banner
                        <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                      </label>
                      
                      <button 
                        onClick={() => {
                          setBannerUrl('');
                          setBannerFile(null);
                        }}
                        className="px-6 py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-transparent dark:border-white/10 rounded-xl font-bold transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-[#D4AF37]/20">
                  <button 
                    onClick={() => setIsEditingPayment(false)}
                    className="px-6 py-2.5 bg-transparent hover:bg-white/5 text-slate-300 rounded-lg font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePayment}
                    disabled={!isPaymentDataValid || isLoadingPayment}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B38F2E] hover:from-[#f4d068] hover:to-[#D4AF37] text-slate-900 rounded-lg font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:grayscale transition-all flex items-center gap-2"
                  >
                    {isLoadingPayment ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            )}

            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">info</span>
              {i18n.language === 'id' 
                ? 'Informasi ini diperlukan untuk menerima pembayaran komisi. Kami menjaga kerahasiaan data Anda.' 
                : 'This information is required to receive commission payments. Your data is kept secure.'}
            </p>
          </section>
          </div>
        )}

        {/* Save Changes Button */}
        <div className="flex justify-end pt-6">
          <button 
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="px-8 py-3 bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none  text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50">
            {isSavingProfile ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  );
}

