"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface CommentResponse {
  id: number;
  artworkId: number;
  userId: number;
  username: string;
  userProfileImageUrl: string;
  parentCommentId: number | null;
  content: string;
  isEdited: boolean;
  editedAtUtc: string | null;
  likeCount: number;
  createdAtUtc: string;
}

export default function CommentSection({ artworkId }: { artworkId: number }) {
  const { user, showAuthModal } = useAuth();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/artworks/${artworkId}/comments`);
      setComments(res.data?.data?.items || []);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (artworkId) {
      fetchComments();
    }
  }, [artworkId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/artworks/${artworkId}/comments`, { content: newComment });
      if (res.data?.isSuccess) {
        setNewComment("");
        fetchComments();
      } else {
        setError("Failed to post comment.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while posting your comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this comment?")) return;
    
    try {
      const res = await api.delete(`/comments/${commentId}`);
      if (res.data?.isSuccess) {
        setComments(comments.filter(c => c.id !== commentId));
      } else {
        setError("Failed to delete comment.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while deleting your comment.");
    }
  };

  if (isLoading) {
    return <div className="text-slate-500 text-sm mt-8">Loading comments...</div>;
  }

  return (
    <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-6">
      <h3 className="text-xl font-bold dark:text-white mb-6 font-['Space_Grotesk']">Comments ({comments.length})</h3>
      
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0 overflow-hidden">
          {user ? (
            user.username?.charAt(0).toUpperCase()
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          )}
        </div>
        <div className="flex-1 flex flex-col items-end gap-2">
          <textarea
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            rows={2}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => {
              if (!user) {
                showAuthModal();
                return;
              }
              setNewComment(e.target.value);
            }}
            onFocus={(e) => {
              if (!user) {
                showAuthModal();
                e.target.blur();
              }
            }}
          />
          {error && <p className="text-red-400 text-xs w-full">{error}</p>}
          <button
            type={user ? "submit" : "button"}
            disabled={user ? (isSubmitting || !newComment.trim()) : false}
            onClick={() => {
              if (!user) {
                showAuthModal();
              }
            }}
            className="px-6 py-2 bg-indigo-600 hover:brightness-110 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-all"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group relative">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0 overflow-hidden">
              {comment.userProfileImageUrl ? (
                <img src={comment.userProfileImageUrl} alt={comment.username} className="w-full h-full object-cover" />
              ) : (
                (comment.username || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{comment.username || "Unknown User"}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(comment.createdAtUtc).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.content}</p>
            </div>
            
            {user?.id === comment.userId && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="absolute top-0 right-0 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete comment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400 text-sm italic text-center py-4">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
    </div>
  );
}
