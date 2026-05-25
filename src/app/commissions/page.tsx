"use client";

import Link from 'next/link';

export default function CommissionsPage() {
  const artists = [
    { name: "Lumina Void", status: "Open for Commissions", role: "Digital Illustrator", startingPrice: 25, rating: 4.9, orders: 120 },
    { name: "Astro Creativ", status: "Waitlisted", role: "Concept Artist", startingPrice: 50, rating: 4.8, orders: 85 },
    { name: "Nebula Dreams", status: "Closed", role: "3D Modeler", startingPrice: 40, rating: 4.7, orders: 60 }
  ];

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk']">Commission Artists</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Find the perfect creator for your next project.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.map((artist, i) => (
          <div key={i} className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-all flex flex-col items-center text-center group shadow-sm">
            <div className="w-24 h-24 rounded-full border-2 border-indigo-500/30 dark:border-indigo-500/50 mb-4 overflow-hidden group-hover:scale-105 transition-transform bg-slate-200 dark:bg-slate-800">
              <img src="https://ui-avatars.com/api/?name=Artist&background=6366f1&color=fff" alt={artist.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{artist.name}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{artist.role}</p>
            
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold mb-4 ${
              artist.status === 'Open for Commissions' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/20' : 
              artist.status === 'Waitlisted' ? 'bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/20' : 
              'bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/20'
            }`}>
              {artist.status}
            </div>

            <div className="flex flex-col items-center gap-1 mb-6 text-sm">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Starting from ${artist.startingPrice}</span>
              <span className="text-slate-500 dark:text-slate-400">⭐ {artist.rating} • {artist.orders} orders</span>
            </div>

            <Link 
              href={`/profile/${encodeURIComponent(artist.name)}`}
              className="w-full py-2.5 bg-indigo-600 dark:bg-white/5 hover:bg-indigo-700 dark:hover:bg-indigo-500/20 border border-transparent dark:border-white/10 hover:border-transparent dark:hover:border-indigo-500/50 text-white rounded-lg transition-all font-medium block shadow-[0_0_15px_rgba(79,70,229,0.2)] dark:shadow-none"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
