"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import * as signalR from '@microsoft/signalr';

export default function GroupDetails() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [showRules, setShowRules] = useState(false);
  const [postText, setPostText] = useState('');

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const { isAuthenticated, showAuthModal } = useAuth();

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [groupRes, postsRes] = await Promise.all([
          api.get(`/groups/${id}`),
          api.get(`/groups/${id}/posts`)
        ]);
        if (groupRes.data?.isSuccess) {
          setGroup({
            ...groupRes.data.data,
            members: groupRes.data.data.memberCount || 0,
            tags: ["3D Art", "Digital Painting", "Concept Art"],
            requirements: "Must have at least 1 portfolio upload to post.",
            rules: "1. Be respectful to all members.\n2. Do not spam or self-promote excessively.\n3. Keep critiques constructive.\n4. No AI-generated artwork allowed in the main feed.",
            role: "member"
          });
        }
        if (postsRes.data?.isSuccess) {
          const items = postsRes.data.data.items || postsRes.data.data || [];
          setPosts(items.map((p: any) => ({
            id: p.id,
            author: p.authorUsername || 'User',
            time: new Date(p.createdAtUtc).toLocaleDateString(),
            content: p.content,
            image: undefined,
            likes: 0,
            comments: 0,
            userLiked: false,
            userSaved: false
          })));
        }
      } catch (err) {
        console.error("Failed to load group", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchGroupData();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem('token');
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '/hubs/groupchat') || 'http://localhost:5242/hubs/groupchat', {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => {
        newConnection.invoke('JoinGroup', id.toString());
        
        newConnection.on('ReceiveMessage', (p: any) => {
          const newPost = {
            id: p.id,
            author: p.authorUsername || 'User',
            time: p.createdAtUtc ? new Date(p.createdAtUtc).toLocaleDateString() : 'Just now',
            content: p.content,
            image: undefined,
            likes: 0,
            comments: 0,
            userLiked: false,
            userSaved: false
          };
          setPosts(prev => {
            // Deduplicate if we already added it locally
            if (prev.find(post => post.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        });
      })
      .catch(err => console.error('SignalR Group Chat Connection Error: ', err));

    return () => {
      if (newConnection.state === signalR.HubConnectionState.Connected) {
        newConnection.invoke('LeaveGroup', id.toString())
          .finally(() => newConnection.stop());
      } else {
        newConnection.stop();
      }
    };
  }, [id]);

  const handleJoinGroup = async () => {
    if (!isAuthenticated) {
      showAuthModal();
      return;
    }
    try {
      const res = await api.post(`/groups/${id}/join`);
      if (res.data?.isSuccess) {
        setGroup({ ...group, isMember: true, members: group.members + 1, role: 'member' });
      }
    } catch (err) {
      console.error("Failed to join group", err);
    }
  };

  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<'menu' | 'editInfo' | 'editRules' | 'manageMembers'>('menu');
  const [editGroupData, setEditGroupData] = useState({ ...group });
  const [expandedComments, setExpandedComments] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [activeThread, setActiveThread] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');

  const threadsData = [
    { id: 1, type: 'Announcement', typeColor: 'text-indigo-500', title: 'Monthly Theme: Neon Noir - Submit your artwork here!', content: 'Welcome to this month\'s theme! We want to see your best cyberpunk and neon noir inspired creations. Post your entries in the main feed with the tag #NeonNoir.', author: 'Admin' },
    { id: 2, type: 'Tutorial', typeColor: 'text-emerald-500', title: 'Mastering blender lighting setups (Part 1)', content: 'Lighting is everything in 3D. In this part 1, we will cover the basics of three-point lighting, HDRI usage, and how to balance your light sources for the most cinematic look.', author: 'LightMaster' }
  ];

  const handleOpenSettings = () => {
    setEditGroupData({ ...group });
    setSettingsView('menu');
    setShowSettings(true);
  };
  
  const handleSaveSettings = () => {
    setGroup(editGroupData);
    setSettingsView('menu');
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() && !attachedImage) return;
    
    try {
      const res = await api.post(`/groups/${id}/posts`, { content: postText });
      if (res.data?.isSuccess) {
        const p = res.data.data;
        const newPost = {
          id: p.id,
          author: p.authorUsername || 'You',
          time: p.createdAtUtc ? new Date(p.createdAtUtc).toLocaleDateString() : 'Just now',
          content: p.content,
          image: undefined,
          likes: 0,
          comments: 0,
          userLiked: false,
          userSaved: false
        };
        setPosts([newPost, ...posts]);
        setPostText('');
        setAttachedImage(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePost = (id: number) => {
    setPosts(posts.map(post => post.id === id ? { ...post, userSaved: !post.userSaved } : post));
    setOpenMenuId(null);
  };

  const handleReportPost = (id: number) => {
    setShowReportModal(id);
    setOpenMenuId(null);
  };

  const handleLike = (id: number) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          userLiked: !post.userLiked,
          likes: post.userLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleSimulateAttachImage = () => {
    // Simulate attaching an image
    if (!attachedImage) {
      setAttachedImage("https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w");
    } else {
      setAttachedImage(null);
    }
  };

  const recentImages = [
    "https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w",
    "https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w",
    "https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w",
    "https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w"
  ];

  if (isLoading || !group) {
    return <div className="max-w-6xl mx-auto py-12 text-center text-slate-500">Loading group...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header Section */}
      <div className="relative mb-24">
        <div className="h-64 md:h-80 w-full relative rounded-t-3xl overflow-hidden shadow-sm dark:shadow-none bg-indigo-50 dark:bg-transparent">
          <img src={group.bannerUrl} alt="Group Banner" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20 dark:opacity-50 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/20 dark:from-[#0c0f0f] dark:via-[#0c0f0f]/50 to-transparent"></div>
        </div>
        
        {/* Actions inside banner */}
        <div className="absolute top-6 right-6 flex gap-3 z-10">
          {!group.isMember && group.role !== 'admin' && group.role !== 'creator' ? (
            <button 
              onClick={handleJoinGroup}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-colors"
            >
              Join Group
            </button>
          ) : (
            <button 
              onClick={handleOpenSettings}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition-colors border border-white/10"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          )}
        </div>

        {/* Group Avatar & Info (Overlapping) */}
        <div className="absolute -bottom-16 left-8 flex items-end gap-6 z-20">
          <div className="w-32 h-32 rounded-2xl bg-indigo-100 dark:bg-indigo-600 border-4 border-slate-50 dark:border-[#0c0f0f] shadow-xl flex items-center justify-center overflow-hidden relative group shrink-0">
            <img src={group.avatarUrl} alt="Group Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="pb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] mb-1 drop-shadow-md">
              {group.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">group</span>
              {group.members.toLocaleString()} Members
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Information Box */}
          <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-700 dark:text-slate-300 text-lg mb-6 leading-relaxed">
              {group.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {group.tags.map((tag: string, idx: number) => (
                <span key={idx} onClick={() => alert(`Searching for #${tag}`)} className="px-3 py-1 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-300 dark:hover:bg-white/10 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="space-y-4 border-t border-slate-200 dark:border-white/10 pt-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-500 text-[20px] mt-0.5">verified_user</span>
                <div>
                  <h4 className="text-slate-900 dark:text-white font-bold text-sm">Requirements</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{group.requirements}</p>
                </div>
              </div>
              
              <div>
                <button 
                  onClick={() => setShowRules(!showRules)}
                  className="flex items-center justify-between w-full p-3 bg-slate-100 dark:bg-slate-950/50 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">gavel</span> Group Rules
                  </span>
                  <span className="material-symbols-outlined text-slate-500">
                    {showRules ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                
                {showRules && (
                  <div className="p-4 mt-2 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 text-sm whitespace-pre-line leading-relaxed">
                    {group.rules}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bulletin / Discussion Feed */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-indigo-500 text-2xl">forum</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk']">Discussion Feed</h2>
            </div>
            
            {/* Create Post Input */}
            {group.isMember || group.role === 'admin' || group.role === 'creator' ? (
              <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 mb-8 shadow-sm flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 shrink-0 overflow-hidden">
                   <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWmy5Q4ovxN33Th-UGPn98NuvbII0lCPqmH900zYzCXD2mP6WnfsQYg5CyX8rf4tFNtD3EAcK7_vZu3h2MU_Gzi_YsraaLm89EtjkvWOclLf5f7DaiQ6yFiTF5zMb4P_tGqBFSwGcuJdefW5lWWa40l0ig7vMzrnaymQADnuGMjTvqBGxuaz_Ds9JqY1j1zgLWtXElciJZpSH4VQ1En6cYqRdHG1FU-2qPyfeqf01eITZydAYUO7SFxaTcPpAabjipbkR5ZqVqdRs" alt="User" className="w-full h-full object-cover" />
                </div>
              <div className="flex-1 space-y-3">
                <textarea 
                  id="post-textarea"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Write something to the group..."
                  className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none min-h-[100px] placeholder:text-slate-500"
                ></textarea>
                
                {attachedImage && (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                    <img src={attachedImage} alt="Attached" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setAttachedImage(null)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSimulateAttachImage}
                      className={`w-9 h-9 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors tooltip ${attachedImage ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/20' : 'text-slate-500 dark:text-slate-400'}`} 
                      title="Attach Image"
                    >
                      <span className="material-symbols-outlined text-[20px]">image</span>
                    </button>
                    <button className="w-9 h-9 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors tooltip" title="Attach Link">
                      <span className="material-symbols-outlined text-[20px]">link</span>
                    </button>
                  </div>
                  <button 
                    onClick={handlePostSubmit}
                    disabled={!postText.trim() && !attachedImage}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50 transition-all"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-8 text-center">
                <p className="text-slate-600 dark:text-slate-400 font-medium">Join this group to participate in discussions and post your own updates.</p>
                <button 
                  onClick={handleJoinGroup}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-colors inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">group_add</span> Join Group
                </button>
              </div>
            )}

            {/* Feed Posts */}
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-slate-900 dark:text-white font-bold text-sm">{post.author}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">{post.time}</p>
                    </div>
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                      className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                    {openMenuId === post.id && (
                      <div className="absolute right-0 top-10 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-10 overflow-hidden animate-[fadeIn_0.1s_ease-out]">
                        <button onClick={() => handleReportPost(post.id)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">flag</span> Report Post
                        </button>
                        <button onClick={() => handleSavePost(post.id)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium text-sm transition-colors flex items-center gap-2 ${post.userSaved ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          <span className="material-symbols-outlined text-[18px]" style={post.userSaved ? { fontVariationSettings: "'FILL' 1" } : {}}>bookmark</span> 
                          {post.userSaved ? 'Saved' : 'Save Post'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>
                  
                  {post.image && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 mb-4 bg-slate-950 max-h-[400px]">
                      <img src={post.image} alt="Post attachment" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-6 pt-4 border-t border-slate-200 dark:border-white/10">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors text-sm font-medium ${post.userLiked ? 'text-rose-500' : 'text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]" style={post.userLiked ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                      {post.likes}
                    </button>
                    <button 
                      onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                      className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors text-sm font-medium"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                      {post.comments} Comments
                    </button>
                    <button className="ml-auto flex items-center gap-2 text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors text-sm font-medium">
                      <span className="material-symbols-outlined text-[18px]">share</span>
                      Share
                    </button>
                  </div>
                  
                  {expandedComments === post.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 animate-[fadeIn_0.2s_ease-out]">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 shrink-0"></div>
                        <input 
                          type="text"
                          placeholder="Write a comment..."
                          className="flex-1 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-full px-4 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Featured Threads */}
          <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">star</span>
              Featured Threads
            </h3>
            
            <div className="space-y-4">
              {threadsData.map((thread) => (
                <div key={thread.id} onClick={() => setActiveThread(thread.id)} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                  <span className={`text-[10px] uppercase font-bold ${thread.typeColor} mb-1 block`}>{thread.type}</span>
                  <h4 className="text-slate-900 dark:text-white font-medium text-sm line-clamp-2">{thread.title}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Images Grid */}
          <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500">photo_library</span>
              Recent Media
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              {recentImages.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 cursor-pointer group/img relative">
                  <img src={img} alt="Recent media" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">zoom_in</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowGalleryModal(true)} className="w-full mt-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
              View All Gallery
            </button>
          </div>

        </div>

      </div>

      {/* Group Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                {settingsView !== 'menu' && (
                  <button onClick={() => setSettingsView('menu')} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  {settingsView === 'menu' ? 'Group Settings' : settingsView === 'editInfo' ? 'Edit Info' : settingsView === 'editRules' ? 'Edit Rules' : 'Manage Members'}
                </h3>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {settingsView === 'menu' && (
                <div className="space-y-2 mb-6">
                  <button onClick={() => setSettingsView('editInfo')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left font-medium">
                    <span className="material-symbols-outlined text-[20px]">edit</span> Edit Group Info
                  </button>
                  <button onClick={() => setSettingsView('manageMembers')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left font-medium">
                    <span className="material-symbols-outlined text-[20px]">group</span> Manage Members
                  </button>
                  <button onClick={() => setSettingsView('editRules')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left font-medium">
                    <span className="material-symbols-outlined text-[20px]">gavel</span> Edit Rules
                  </button>
                  <div className="h-px bg-slate-200 dark:bg-white/10 my-2"></div>
                  <button onClick={() => router.push('/groups')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors text-left font-medium">
                    <span className="material-symbols-outlined text-[20px]">logout</span> Leave Group
                  </button>
                </div>
              )}
              
              {settingsView === 'editInfo' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Name</label>
                    <input type="text" value={editGroupData.name} onChange={e => setEditGroupData({...editGroupData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea value={editGroupData.description} onChange={e => setEditGroupData({...editGroupData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none h-24" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Requirements</label>
                    <input type="text" value={editGroupData.requirements} onChange={e => setEditGroupData({...editGroupData, requirements: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (comma separated)</label>
                    <input type="text" value={editGroupData.tags.join(', ')} onChange={e => setEditGroupData({...editGroupData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              )}
              
              {settingsView === 'editRules' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Group Rules</label>
                    <textarea value={editGroupData.rules} onChange={e => setEditGroupData({...editGroupData, rules: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none h-64" />
                  </div>
                </div>
              )}

              {settingsView === 'manageMembers' && (
                <div className="space-y-4 mb-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-bold">Total Members: {group.members.toLocaleString()}</p>
                  {[1, 2, 3].map(m => (
                    <div key={m} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">U{m}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">User {m}</p>
                          <p className="text-xs text-slate-500">Joined 2 days ago</p>
                        </div>
                      </div>
                      {(group.role === 'admin' || group.role === 'creator') && (
                        <button className="text-xs font-bold text-rose-500 hover:text-white px-4 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 rounded-lg transition-colors border border-rose-200 dark:border-rose-500/30">Kick</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {settingsView === 'menu' ? (
              <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-xl font-bold transition-colors mt-2">
                Done
              </button>
            ) : settingsView !== 'manageMembers' ? (
              <button onClick={handleSaveSettings} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors mt-2">
                Save Changes
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Report Post</h3>
            <div className="space-y-3 mb-6">
              {['Spam', 'Inappropriate Content', 'Harassment', 'Other'].map(reason => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">
                  <input type="radio" name="report_reason" value={reason} checked={reportReason === reason} onChange={(e) => setReportReason(e.target.value)} className="text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReportModal(null)} className="flex-1 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-xl font-bold transition-colors">Cancel</button>
              <button onClick={() => { alert('Report submitted!'); setShowReportModal(null); setReportReason(''); }} disabled={!reportReason} className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-colors">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk'] flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500">photo_library</span> Group Gallery
              </h3>
              <button onClick={() => setShowGalleryModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...recentImages, "https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w", "https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w", "https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w", "https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w", "https://res.cloudinary.com/dzjoxcvv7/image/upload/v1/muse-space/w7o3q62z017y6d7y0k4w"].map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 cursor-pointer group relative">
                    <img src={img} alt={`Gallery item ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity scale-50 group-hover:scale-100 duration-300">zoom_in</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thread Modal */}
      {activeThread && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <span className={`text-xs uppercase font-bold ${threadsData.find(t => t.id === activeThread)?.typeColor} mb-2 block`}>
                  {threadsData.find(t => t.id === activeThread)?.type}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  {threadsData.find(t => t.id === activeThread)?.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Posted by {threadsData.find(t => t.id === activeThread)?.author}</p>
              </div>
              <button onClick={() => setActiveThread(null)} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors shrink-0 ml-4">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-5 mb-6 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 leading-relaxed">
                {threadsData.find(t => t.id === activeThread)?.content}
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">forum</span> Discussion
              </h4>
              <div className="space-y-4">
                {[1, 2, 3].map(comment => (
                  <div key={comment} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 shrink-0 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">U{comment}</div>
                    <div className="bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl rounded-tl-none p-4 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">User {comment} <span className="text-xs text-slate-500 font-normal ml-2">2h ago</span></p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">This is a great thread! Thanks for sharing this information. Looking forward to more content like this.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 shrink-0">
              <div className="flex gap-3">
                <input type="text" placeholder="Reply to thread..." className="flex-1 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all">Reply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


