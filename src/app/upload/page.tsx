"use client";

import { useState } from 'react';

export default function UploadPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setShowSuccess(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      alert('Please select an artwork file first.');
      return;
    }
    
    // Mock submission
    setShowSuccess(true);
    
    // Reset form
    setImagePreview(null);
    setTitle('');
    setDescription('');
    setTags('');
    
    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto animate-[fadeIn_0.3s_ease-out]">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8 font-['Space_Grotesk']">Upload Artwork</h1>
      
      {showSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <p className="text-emerald-400 font-medium">Artwork submitted successfully!</p>
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
          <label className="block border-2 border-dashed border-slate-300 dark:border-indigo-500/30 rounded-xl overflow-hidden text-center hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer relative group">
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
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all hover:scale-105"
          >
            Submit Artwork
          </button>
        </div>
      </form>
    </div>
  );
}
