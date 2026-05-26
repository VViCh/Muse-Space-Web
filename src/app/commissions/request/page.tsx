"use client";
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { UserProfileResponse } from '@/app/search/page';

type Step = 'form' | 'waiting_approval' | 'payment' | 'success';

export default function RequestCommission() {
  const { artistId } = useParams();
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('');

  // Form State
  const [commissionType, setCommissionType] = useState('Bust Up');
  const [usageType, setUsageType] = useState('Personal Use');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [fileName, setFileName] = useState('');

  const [artistIdStr] = Array.isArray(artistId) ? artistId : [artistId];
  const decodedArtistName = artistIdStr ? decodeURIComponent(artistIdStr) : '';

  const [artistUser, setArtistUser] = useState<UserProfileResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!decodedArtistName) return;
    const fetchArtist = async () => {
      try {
        const searchRes = await api.get(`/search?query=${encodeURIComponent(decodedArtistName)}`);
        const users: UserProfileResponse[] = searchRes.data?.data?.users || [];
        const user = users.find(u => u.username.toLowerCase() === decodedArtistName.toLowerCase());
        if (user) setArtistUser(user);
      } catch (err) {
        console.error("Failed to find artist", err);
      }
    };
    fetchArtist();
  }, [decodedArtistName]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistUser) {
      setError("Cannot submit: Artist not found in database.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      const priceVal = parseFloat(budget) || 25; // Default if not specified
      
      const payload = {
        artistId: artistUser.userId,
        title: `${commissionType} - ${usageType}`,
        description: description + (fileName ? `\n\nReference File: ${fileName}` : ''),
        price: priceVal,
        deadlineUtc: deadline ? new Date(deadline).toISOString() : null
      };

      const res = await api.post('/commissions', payload);
      if (res.data?.success) {
        setStep('waiting_approval');
      } else {
        setError(res.data?.message || "Failed to create commission.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return;
    setStep('success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto px-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-green-500 dark:text-green-400">check_circle</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 font-['Space_Grotesk']">Request & Payment Sent!</h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">The artist has been notified of your commission request.</p>
        
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 p-6 rounded-2xl mb-8 text-left">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400">info</span> 
            What happens next?
          </h3>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            Once your payment is fully confirmed and the artist completes the artwork, they will deliver the final high-resolution image directly via your <strong>registered email</strong> or provide a <strong>direct download link</strong> in your user dashboard.
          </p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 border border-transparent text-white rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all font-bold flex items-center gap-2"
          >
            <span className="material-symbols-outlined">dashboard</span>
            View Order History
          </button>
          <button 
            onClick={() => router.push('/commissions')}
            className="px-8 py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 border border-transparent dark:border-white/10 text-slate-800 dark:text-white rounded-lg transition-all font-medium"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  if (step === 'waiting_approval') {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-amber-100 dark:bg-amber-500/20 rounded-full mb-6 relative">
            <span className="material-symbols-outlined text-5xl text-amber-500 dark:text-amber-400 absolute">hourglass_empty</span>
            <div className="absolute inset-0 border-4 border-amber-400 dark:border-amber-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 font-['Space_Grotesk']">Waiting for Artist Approval</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Your request has been sent to {decodedArtistName}. They will review it shortly.</p>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm mb-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-white/10 pb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">receipt_long</span>
            Summary of Request
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Commission Type</p>
                <p className="font-bold text-slate-900 dark:text-white">{commissionType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Usage Type</p>
                <p className="font-bold text-slate-900 dark:text-white">{usageType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Budget Range</p>
                <p className="font-bold text-slate-900 dark:text-white">{budget ? `$${budget}` : 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Deadline</p>
                <p className="font-bold text-slate-900 dark:text-white">{deadline || 'Flexible'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Project Description</p>
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{description || "No description provided."}</p>
              </div>
            </div>

            {fileName && (
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Reference Material</p>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-lg w-fit border border-indigo-100 dark:border-indigo-500/20">
                  <span className="material-symbols-outlined text-sm">attachment</span>
                  <span className="text-sm font-medium">{fileName}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 border border-transparent dark:border-white/10 text-slate-800 dark:text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">dashboard</span>
            Go to Dashboard
          </button>
          
          {/* For Demo Purposes */}
          <button 
            onClick={() => router.push('/workspace/ord_456')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 transition-all font-bold flex items-center justify-center gap-2"
            title="Demo tool: go to workspace"
          >
            <span className="material-symbols-outlined text-base">magic_button</span>
            Simulate Artist Accept
          </button>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <button onClick={() => setStep('form')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span> Back to Request
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk']">Select Payment Method</h1>
          <p className="text-slate-600 dark:text-slate-400">Choose how you want to fund this commission request.</p>
        </div>

        <form onSubmit={handlePaymentSubmit} className="space-y-6 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-8">
          <div className="grid grid-cols-1 gap-4">
            <label className={`relative flex cursor-pointer rounded-xl border p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${paymentMethod === 'credit_card' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50'}`}>
              <input type="radio" name="payment" value="credit_card" className="sr-only" onChange={(e) => setPaymentMethod(e.target.value)} />
              <div className="flex items-center gap-4">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${paymentMethod === 'credit_card' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-500'}`}>
                  {paymentMethod === 'credit_card' && <div className="h-3 w-3 rounded-full bg-indigo-500"></div>}
                </div>
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-300">credit_card</span>
                <span className="text-slate-900 dark:text-white font-medium">Credit Card</span>
              </div>
            </label>

            <label className={`relative flex cursor-pointer rounded-xl border p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${paymentMethod === 'digital_wallet' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50'}`}>
              <input type="radio" name="payment" value="digital_wallet" className="sr-only" onChange={(e) => setPaymentMethod(e.target.value)} />
              <div className="flex items-center gap-4">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${paymentMethod === 'digital_wallet' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-500'}`}>
                  {paymentMethod === 'digital_wallet' && <div className="h-3 w-3 rounded-full bg-indigo-500"></div>}
                </div>
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-300">account_balance_wallet</span>
                <span className="text-slate-900 dark:text-white font-medium">Digital Wallet (PayPal, Crypto)</span>
              </div>
            </label>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={!paymentMethod}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
            >
              Confirm & Pay
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors">
        <span className="material-symbols-outlined">arrow_back</span> Back to Profile
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk']">Commission Request (Brief)</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Provide all the details needed for your custom artwork.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Form (Left Column) */}
        <div className="lg:col-span-2">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">error</span>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}
          <form onSubmit={handleFormSubmit} className="space-y-8 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm">
            
            {/* Commission Type Dropdown */}
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-sm">category</span>
                Commission Type
              </label>
              <select 
                value={commissionType}
                onChange={(e) => setCommissionType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="Bust Up">Bust Up (Starting from $25)</option>
                <option value="Half Body">Half Body (Starting from $40)</option>
                <option value="Full Body">Full Body (Starting from $60)</option>
                <option value="Custom Scenario">Custom Scenario / Other</option>
              </select>
            </div>

            {/* Description Box */}
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-sm">description</span>
                Project Description
              </label>
              <textarea 
                required 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6} 
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed" 
                placeholder="Describe the character, pose, outfit, mood, background details, and any specific requirements you have in mind..."
              ></textarea>
            </div>

            {/* Reference Upload */}
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-sm">upload_file</span>
                Reference Images
              </label>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-200 dark:border-white/10 border-dashed rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:border-indigo-500/50 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-indigo-500 transition-colors mb-2">cloud_upload</span>
                  <p className="mb-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {fileName ? <span className="text-indigo-600 dark:text-indigo-400">{fileName}</span> : <><span className="font-bold">Click to upload</span> or drag and drop</>}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, ZIP (Max 10MB)</p>
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {/* Usage Type (Radio) */}
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-sm">copyright</span>
                Usage Type
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 flex cursor-pointer rounded-xl border p-4 transition-all ${usageType === 'Personal Use' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 hover:border-indigo-300'}`}>
                  <input type="radio" name="usage" value="Personal Use" className="sr-only" checked={usageType === 'Personal Use'} onChange={(e) => setUsageType(e.target.value)} />
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${usageType === 'Personal Use' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {usageType === 'Personal Use' && <div className="h-2.5 w-2.5 rounded-full bg-indigo-500"></div>}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-900 dark:text-white mb-0.5">Personal Use</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 leading-snug">Avatars, wallpapers, personal printing. Not for profit.</span>
                    </div>
                  </div>
                </label>
                <label className={`flex-1 flex cursor-pointer rounded-xl border p-4 transition-all ${usageType === 'Commercial Use' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 hover:border-indigo-300'}`}>
                  <input type="radio" name="usage" value="Commercial Use" className="sr-only" checked={usageType === 'Commercial Use'} onChange={(e) => setUsageType(e.target.value)} />
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${usageType === 'Commercial Use' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {usageType === 'Commercial Use' && <div className="h-2.5 w-2.5 rounded-full bg-indigo-500"></div>}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-900 dark:text-white mb-0.5">Commercial Use</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 leading-snug">Merch, branding, streams (+50% fee applies).</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget Range */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500 text-sm">payments</span>
                  Budget Range <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input 
                    type="text" 
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-8 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                    placeholder="e.g. 100 - 150" 
                  />
                </div>
              </div>
              
              {/* Deadline */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500 text-sm">event</span>
                  Deadline Request
                </label>
                <input 
                  required
                  type="date" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:[color-scheme:dark]" 
                />
              </div>
            </div>

            <div className="pt-6">
              <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:hover:from-indigo-600 disabled:hover:to-purple-600 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] disabled:hover:scale-100 transition-all flex justify-center items-center gap-2">
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                {!isSubmitting && <span className="material-symbols-outlined text-base">send</span>}
              </button>
            </div>
          </form>
        </div>

        {/* Summary Panel (Right Column) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-['Space_Grotesk'] border-b border-slate-200 dark:border-white/10 pb-4">
              Order Summary
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                {decodedArtistName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-0.5">Commissioning</p>
                <p className="font-bold text-slate-900 dark:text-white">{decodedArtistName}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-600 dark:text-slate-400">Selected Package</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white text-right">{commissionType}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-600 dark:text-slate-400">Usage Rights</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white text-right">{usageType}</span>
              </div>
              {deadline && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Target Deadline</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white text-right">{deadline}</span>
                </div>
              )}
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-indigo-500 mt-0.5">info</span>
                <div>
                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-1">Estimated Delivery</p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400/80 leading-relaxed">
                    Usually takes 7-14 days after sketch approval. You will not be charged until the artist accepts the request.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

