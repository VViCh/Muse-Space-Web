"use client";
import Link from 'next/link';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Event {
  id: number;
  title: string;
  description: string;
  bannerUrl: string;
  startDateUtc: string;
  isOnline: boolean;
  location: string;
}

export default function EventsExplore() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events');
        if (response.data?.isSuccess) {
          setEvents(response.data.data.items || response.data.data);
        }
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading events...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2 font-['Space_Grotesk']">Explore Events</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Discover upcoming virtual exhibitions, workshops, and artist meetups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.length > 0 ? events.map((event) => (
          <div key={event.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-colors flex flex-col group">
            <div className="h-48 bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center border-b border-slate-200 dark:border-white/10 overflow-hidden shrink-0 relative">
              <div className="absolute inset-0 bg-indigo-900/20 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
              {event.bannerUrl ? (
                <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <span className="material-symbols-outlined text-5xl text-indigo-300 opacity-50">event</span>
              )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                {new Date(event.startDateUtc).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{event.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex items-center gap-1 line-clamp-2">
                <span className="material-symbols-outlined text-[16px]">{event.isOnline ? 'videocam' : 'location_on'}</span> 
                {event.isOnline ? 'Virtual Exhibition' : event.location}
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
        )) : (
          <div className="col-span-full py-20 text-center text-slate-500">
            <p>No upcoming events found.</p>
          </div>
        )}
      </div>
    </div>
  );
}


