"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

export default function DeliveryPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/commissions/${orderId}`);
        if (res.data?.isSuccess) {
          setOrderDetails({
            id: res.data.data.id,
            artist: res.data.data.artistUsername,
            service: res.data.data.title,
            artworkUrl: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=1200&auto=format&fit=crop'
          });
          if (res.data.data.status === 5) {
            setIsCompleted(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  const handleCompleteOrder = async () => {
    try {
      const res = await api.patch(`/commissions/${orderId}/status`, { status: 5 }); // 5 = Completed
      if (res.data?.isSuccess) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }
    alert("Thank you for your feedback! The watermark has been removed and files are unlocked.");
    router.push('/dashboard');
  };
  return (
    <div className="min-h-screen bg-[#0B0A10] relative overflow-hidden flex flex-col items-center py-12 px-4 font-['Space_Grotesk'] text-slate-200">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <button onClick={() => router.back()} className="self-start md:ml-12 mb-8 flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors z-10 relative group">
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
        <span className="font-bold tracking-widest uppercase text-sm">Return to Workspace</span>
      </button>

      <div className="w-full max-w-5xl z-10 relative space-y-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500 mb-4 tracking-tight">
            Final Delivery
          </h1>
          <p className="text-slate-400 text-lg">
            Your commission from <span className="text-white font-bold">{orderDetails?.artist || 'the artist'}</span> is ready for review.
          </p>
        </div>

        {orderDetails && (
          <>
          <div className="bg-slate-900/40 backdrop-blur-xl border border-violet-500/20 rounded-3xl p-4 md:p-8 shadow-[0_0_50px_rgba(139,92,246,0.1)] transition-all duration-500">
          <div className="relative rounded-2xl overflow-hidden group border border-white/5 bg-black/50">
            <img 
              src={orderDetails.artworkUrl} 
              alt="Final Delivery Preview" 
              className={`w-full h-auto max-h-[600px] object-contain transition-all duration-1000 ${isCompleted ? 'brightness-100' : 'brightness-75'}`}
            />
            
            {/* Watermark Overlay (Only visible if not completed) */}
            {!isCompleted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] select-none pointer-events-none">
                <div className="transform -rotate-12 opacity-30 pointer-events-none">
                  <h2 className="text-6xl md:text-8xl font-black text-white tracking-widest uppercase outline-text">
                    PREVIEW ONLY
                  </h2>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Below Image */}
          <div className="mt-8 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex-1">
              {!isCompleted ? (
                <div className="bg-violet-500/10 border border-violet-500/20 p-4 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-violet-400">info</span>
                  <p className="text-sm text-violet-200/80 leading-relaxed">
                    Please review the final artwork. If it meets your expectations, complete the order to release funds from escrow and unlock the high-resolution files without watermarks.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                  <p className="text-sm text-emerald-200/80 leading-relaxed">
                    Order completed! Funds have been released to the artist. You can now download your files.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
              {!isCompleted && (
                <button 
                  onClick={handleCompleteOrder}
                  className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">task_alt</span>
                  Complete Order
                </button>
              )}
              
              <button 
                disabled={!isCompleted}
                className={`px-8 py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                  isCompleted 
                    ? 'bg-slate-100 hover:bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-1' 
                    : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <span className="material-symbols-outlined">{isCompleted ? 'download' : 'lock'}</span>
                Download High-Res
              </button>
            </div>
          </div>
        </div>

        {/* Client Feedback Section (Animated visibility) */}
        <div className={`transition-all duration-1000 ease-out overflow-hidden ${isCompleted ? 'opacity-100 max-h-[800px] transform translate-y-0' : 'opacity-0 max-h-0 transform translate-y-10'}`}>
          <div className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400">rate_review</span>
              Client Feedback
            </h2>
            
            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              {/* Star Rating */}
              <div>
                <p className="text-slate-400 mb-3 text-sm font-medium uppercase tracking-wider">Rate the Artist</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <span className={`material-symbols-outlined text-4xl transition-all duration-300 ${
                        star <= (hoverRating || rating) 
                          ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] fill-current icon-filled' 
                          : 'text-slate-600'
                      }`}>
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Testimonial Text Area */}
              <div>
                <p className="text-slate-400 mb-3 text-sm font-medium uppercase tracking-wider">Leave a Testimonial</p>
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="How was your experience working with the artist? Did you love the final result?"
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all resize-none"
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  className="px-8 py-3 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 hover:text-white border border-violet-500/50 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
        )}

      </div>
    </div>
  );
}

