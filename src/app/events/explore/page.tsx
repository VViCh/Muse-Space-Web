"use client";
import Link from 'next/link';

const EVENTS = [
  { id: 1, title: 'Galactic Art Showcase', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=60' },
  { id: 2, title: 'Cyberpunk Workshop', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60' },
  { id: 3, title: 'Digital Meetup', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60' },
  { id: 4, title: '3D Artists Forum', img: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&auto=format&fit=crop&q=60' },
  { id: 5, title: 'Abstract Gallery', img: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=500&auto=format&fit=crop&q=60' },
  { id: 6, title: 'Neo-Tokyo Exhibition', img: 'https://images.unsplash.com/photo-1533038590840-1c798782ee83?w=500&auto=format&fit=crop&q=60' },
  { id: 7, title: 'Synthwave Night', img: 'https://images.unsplash.com/photo-1516280440502-5c464c8d10ed?w=500&auto=format&fit=crop&q=60' },
  { id: 8, title: 'AI Art Conference', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60' }
];

export default function EventsExplore() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk']">Explore Events</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Discover upcoming virtual exhibitions, workshops, and artist meetups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {EVENTS.map((event) => (
          <div key={event.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-colors flex flex-col group">
            <div className="h-48 bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center border-b border-slate-200 dark:border-white/10 overflow-hidden shrink-0 relative">
              <div className="absolute inset-0 bg-indigo-900/20 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
              <img src={event.img} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">OCT 24 • 8:00 PM EST</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{event.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">videocam</span> Virtual Exhibition Hall
              </p>
              
              <div className="mt-auto">
                <Link href={`/events/${event.id}`}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors text-center block"
                >
                  RSVP Now
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


