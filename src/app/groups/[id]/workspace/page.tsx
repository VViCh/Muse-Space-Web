"use client";
import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// Mock data structures
type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  };
};

type Order = {
  id: string;
  artistName: string;
  title: string;
  status: 'Pending' | 'Sketching' | 'Coloring' | 'Revision' | 'Done';
  finalPrice: number;
  deadline: string;
  avatar: string;
  unreadCount: number;
  isPaid: boolean;
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_123',
    artistName: 'Lumina Void',
    title: 'Cyberpunk Character Design',
    status: 'Sketching',
    finalPrice: 120,
    deadline: '2026-05-15',
    avatar: 'L',
    unreadCount: 2,
    isPaid: true
  },
  {
    id: 'ord_456',
    artistName: 'Astro Creativ',
    title: 'Mecha Concept Art',
    status: 'Pending',
    finalPrice: 240,
    deadline: '2026-05-20',
    avatar: 'A',
    unreadCount: 0,
    isPaid: false
  },
  {
    id: 'ord_789',
    artistName: 'Neon Dreamer',
    title: 'Synthwave Album Cover',
    status: 'Done',
    finalPrice: 180,
    deadline: '2026-05-10',
    avatar: 'N',
    unreadCount: 1,
    isPaid: true
  }
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'ord_123': [
    { id: 'm1', senderId: 'artist', senderName: 'Lumina Void', text: 'Hello! I have accepted your commission request.', timestamp: '10:00 AM' },
    { id: 'm2', senderId: 'user', senderName: 'You', text: 'Awesome, looking forward to it!', timestamp: '10:05 AM' },
    { id: 'm3', senderId: 'artist', senderName: 'Lumina Void', text: 'Here is the initial rough sketch. Let me know what you think!', timestamp: '2:30 PM', attachment: { type: 'image', url: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=400&auto=format&fit=crop', name: 'initial_sketch.jpg' } }
  ],
  'ord_456': [
    { id: 'm4', senderId: 'artist', senderName: 'Astro Creativ', text: 'Hi! I can definitely do this. The custom quote is $240. Does that work for you?', timestamp: 'Yesterday' }
  ],
  'ord_789': [
    { id: 'm5', senderId: 'artist', senderName: 'Neon Dreamer', text: 'The final render is complete! I have uploaded the high-resolution files to the delivery page.', timestamp: '10:00 AM' }
  ]
};

export default function Workspace() {
  const params = useParams();
  const rawOrderId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const orderId = rawOrderId;
  const currentOrderId = orderId && orderId !== 'demo' ? orderId : 'ord_123';
  
  const [activeOrder, setActiveOrder] = useState<Order | undefined>(
    MOCK_ORDERS.find(o => o.id === currentOrderId) || MOCK_ORDERS[0]
  );
  
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES[activeOrder?.id || 'ord_123'] || []);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update messages when switching orders
  useEffect(() => {
    if (activeOrder) {
      setMessages(MOCK_MESSAGES[activeOrder.id] || []);
    }
  }, [activeOrder]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeOrder) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      senderName: 'You',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Sketching': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Coloring': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'Revision': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'Done': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (!activeOrder) return <div>Order not found</div>;

  return (
    <div className="h-[calc(100vh-80px)] -mt-8 -mx-4 sm:mx-0 sm:mt-0 flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-[#0B1120] border-t border-slate-200 dark:border-white/5">
      
      {/* LEFT SIDEBAR: Active Orders */}
      <div className="w-full md:w-[20%] border-r border-slate-200 dark:border-white/10 flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10 shrink-0">
        <div className="p-6 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">list_alt</span>
            Active Orders
          </h2>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {MOCK_ORDERS.map(order => (
            <button
              key={order.id}
              onClick={() => setActiveOrder(order)}
              className={`w-full text-left p-4 rounded-2xl transition-all border ${
                activeOrder.id === order.id 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-sm' 
                  : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {order.avatar}
                  </div>
                  {order.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                      {order.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{order.artistName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1">{order.title}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CENTER: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white/30 dark:bg-slate-950/30">
        {/* Chat Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {activeOrder.avatar}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{activeOrder.artistName}</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{activeOrder.title}</p>
            </div>
          </div>
          <div className="md:hidden">
             {/* Mobile toggle button placeholder if needed */}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="text-center">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full">
              Order created on {new Date().toLocaleDateString()}
            </span>
          </div>

          {messages.map(msg => {
            const isUser = msg.senderId === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[85%] lg:max-w-[70%]">
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold text-xs shrink-0 mb-1">
                      {activeOrder.avatar}
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                      isUser 
                        ? 'bg-indigo-600 text-white rounded-br-sm' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-bl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{msg.text}</p>
                      
                      {msg.attachment && msg.attachment.type === 'image' && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-white/10 group relative">
                          <img src={msg.attachment.url} alt={msg.attachment.name} className="w-64 max-w-full h-auto object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-white/10">
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <button type="button" className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors shrink-0">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <div className="flex-1 relative">
              <textarea 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..." 
                className="w-full bg-slate-100 dark:bg-slate-950/50 border border-transparent focus:border-indigo-500/50 rounded-2xl py-3 px-5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none max-h-32 min-h-[52px]"
                rows={1}
              />
            </div>
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all shrink-0"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Order Details */}
      <div className="w-full md:w-[30%] border-l border-slate-200 dark:border-white/10 flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10 shrink-0 overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">info</span>
            Order Details
          </h2>
        </div>

        <div className="p-6 space-y-8">
          {/* Status Tracker */}
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wider">Current Status</p>
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${getStatusColor(activeOrder.status)}`}>
              <span className="material-symbols-outlined">
                {activeOrder.status === 'Pending' ? 'schedule' : 
                 activeOrder.status === 'Sketching' ? 'draw' : 
                 activeOrder.status === 'Coloring' ? 'palette' : 
                 activeOrder.status === 'Revision' ? 'rate_review' : 'check_circle'}
              </span>
              <span className="font-bold text-lg">{activeOrder.status}</span>
            </div>
            
            {/* Minimal Timeline */}
            <div className="mt-4 px-2">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span className={['Pending', 'Sketching', 'Coloring', 'Done'].includes(activeOrder.status) ? 'text-indigo-500' : ''}>Start</span>
                <span className={['Sketching', 'Coloring', 'Done'].includes(activeOrder.status) ? 'text-indigo-500' : ''}>Sketch</span>
                <span className={['Coloring', 'Done'].includes(activeOrder.status) ? 'text-indigo-500' : ''}>Color</span>
                <span className={activeOrder.status === 'Done' ? 'text-indigo-500' : ''}>Done</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
                <div className={`h-full bg-indigo-500 transition-all duration-1000 ${
                  activeOrder.status === 'Pending' ? 'w-[10%]' : 
                  activeOrder.status === 'Sketching' ? 'w-[40%]' : 
                  activeOrder.status === 'Coloring' ? 'w-[75%]' : 
                  activeOrder.status === 'Done' ? 'w-[100%]' : 'w-[50%]'
                }`}></div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wider">Final Price</p>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-slate-900 dark:text-white">${activeOrder.finalPrice}</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${activeOrder.isPaid ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                {activeOrder.isPaid ? 'PAID' : 'UNPAID'}
              </span>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">timer</span>
              Countdown
            </p>
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <p className="font-bold text-slate-900 dark:text-white text-lg">7 Days, 4 Hours</p>
              <p className="text-xs text-slate-500 mt-1">Due on {activeOrder.deadline}</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10">
            {!activeOrder.isPaid ? (
              <Link 
                href={`/payment/${activeOrder.id}`}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span className="material-symbols-outlined">payments</span>
                Pay Now (${activeOrder.finalPrice})
              </Link>
            ) : activeOrder.status === 'Sketching' ? (
              <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
                <span className="material-symbols-outlined">thumb_up</span>
                Approve Sketch
              </button>
            ) : activeOrder.status === 'Done' ? (
              <Link 
                href={`/delivery/${activeOrder.id}`}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span className="material-symbols-outlined">inventory_2</span>
                Review Final Delivery
              </Link>
            ) : (
              <button className="w-full py-4 bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">lock</span>
                No Action Required
              </button>
            )}
            
            {!activeOrder.isPaid && (
              <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[10px]">shield</span>
                Escrow protected until completion
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}






