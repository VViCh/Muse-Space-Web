"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function UploadPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setShowSuccess(false);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!file) {
      setError('Please select an artwork file first.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('Title', title);
      formData.append('Description', description);
      formData.append('MediaFile', file);
      
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      tagArray.forEach((t, i) => formData.append(`Tags[${i}]`, t));

      const response = await api.post('/artwork', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 || response.status === 201) {
        setShowSuccess(true);
        setFile(null);
        setImagePreview(null);
        setTitle('');
        setDescription('');
        setTags('');
        
        setTimeout(() => {
          setShowSuccess(false);
          router.push('/');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload artwork. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold dark:text-white mb-4">Sign in to upload artwork</h2>
        <button onClick={() => router.push('/login')} className="bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none text-white px-6 py-2 rounded-xl">Sign In</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-[fadeIn_0.3s_ease-out]">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8 font-['Space_Grotesk']">Upload Artwork</h1>
      
      {showSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <p className="text-emerald-400 font-medium">Artwork submitted successfully! Redirecting...</p>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <span className="material-symbols-outlined text-red-400">error</span>
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-8 rounded-2xl shadow-sm transition-colors duration-300">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-400"
            placeholder="e.g. Nebula Dream"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
          <textarea 
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
            placeholder="Describe your creation..."
            required
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tags (comma separated)</label>
          <input 
            type="text" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-400"
            placeholder="space, stars, digital"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Artwork File</label>
          <label className="block border-2 border-dashed border-slate-300 dark:border-indigo-500/30 rounded-xl overflow-hidden text-center hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-white/5 transition-all cursor-pointer relative group">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange} 
            />
            
            {imagePreview ? (
              <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined">edit</span> Change Image
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-12">
                <span className="material-symbols-outlined text-4xl text-indigo-500 mb-4 block group-hover:-translate-y-1 transition-transform">cloud_upload</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">Click to upload or drag and drop</p>
                <p className="text-slate-500 text-sm mt-1">PNG, JPG or GIF (MAX. 10MB)</p>
              </div>
            )}
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting || !file || !title}
            className="bg-indigo-600 dark:bg-white dark:text-slate-900 dark:shadow-none  disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:shadow-none transition-all hover:scale-[1.02] disabled:hover:scale-100 flex items-center gap-2"
          >
            {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : null}
            {isSubmitting ? 'Uploading...' : 'Submit Artwork'}
          </button>
        </div>
      </form>
    </div>
  );
}
