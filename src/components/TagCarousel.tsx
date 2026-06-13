"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

interface Tag {
  id: number;
  name: string;
  usageCount: number;
}

export default function TagCarousel() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || "";
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.get("/tags/popular?limit=20");
        if (response.data?.isSuccess) {
          setTags(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch popular tags", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTags();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTagClick = (tagName: string) => {
    if (isDragging) return; // Prevent click if dragging
    if (currentQuery.toLowerCase() === tagName.toLowerCase()) {
      router.push("/");
    } else {
      router.push(`/?q=${encodeURIComponent(tagName)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden py-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0"></div>
        ))}
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div className="relative group py-4">
      <div
        ref={carouselRef}
        className="flex gap-3 overflow-x-auto hide-scrollbar cursor-grab active:cursor-grabbing snap-x"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <button
          onClick={() => {
            if (!isDragging) router.push("/");
          }}
          className={`px-5 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all shrink-0 snap-start select-none ${
            !currentQuery
              ? "bg-indigo-600 dark:bg-white text-white dark:text-slate-900 shadow-md shadow-indigo-500/20 dark:shadow-none"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          All Discoveries
        </button>
        {tags.map((tag) => {
          const isActive = currentQuery.toLowerCase() === tag.name.toLowerCase();
          return (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.name)}
              className={`px-5 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all shrink-0 snap-start select-none ${
                isActive
                  ? "bg-indigo-600 dark:bg-white text-white dark:text-slate-900 shadow-md shadow-indigo-500/20 dark:shadow-none"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              #{tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
