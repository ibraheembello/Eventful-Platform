import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineMusicNote, HiOutlineChip, HiOutlineColorSwatch,
  HiOutlineFilm, HiOutlineLightningBolt, HiOutlineAcademicCap,
  HiOutlineBriefcase, HiOutlineCake, HiOutlineHeart,
  HiOutlineDotsHorizontal, HiOutlineViewGrid,
} from 'react-icons/hi';
import api from '../lib/api';

interface CategoryCount {
  category: string;
  count: number;
}

const CATEGORY_CONFIG: Record<string, { icon: ReactNode; gradient: string; bg: string }> = {
  Music: {
    icon: <HiOutlineMusicNote className="w-8 h-8" />,
    gradient: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
  },
  Technology: {
    icon: <HiOutlineChip className="w-8 h-8" />,
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  },
  Art: {
    icon: <HiOutlineColorSwatch className="w-8 h-8" />,
    gradient: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
  },
  Entertainment: {
    icon: <HiOutlineFilm className="w-8 h-8" />,
    gradient: 'from-red-500 to-orange-600',
    bg: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  },
  Sports: {
    icon: <HiOutlineLightningBolt className="w-8 h-8" />,
    gradient: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
  },
  Education: {
    icon: <HiOutlineAcademicCap className="w-8 h-8" />,
    gradient: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
  },
  Business: {
    icon: <HiOutlineBriefcase className="w-8 h-8" />,
    gradient: 'from-slate-500 to-gray-600',
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  },
  'Food & Drink': {
    icon: <HiOutlineCake className="w-8 h-8" />,
    gradient: 'from-amber-500 to-yellow-600',
    bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
  },
  Health: {
    icon: <HiOutlineHeart className="w-8 h-8" />,
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
  },
  Other: {
    icon: <HiOutlineDotsHorizontal className="w-8 h-8" />,
    gradient: 'from-gray-500 to-slate-600',
    bg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  },
};

const DEFAULT_CONFIG = {
  icon: <HiOutlineDotsHorizontal className="w-8 h-8" />,
  gradient: 'from-gray-500 to-slate-600',
  bg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

// All known categories — show even if count is 0
const ALL_CATEGORIES = [
  'Music', 'Technology', 'Art', 'Entertainment', 'Sports',
  'Education', 'Business', 'Food & Drink', 'Health', 'Other',
];

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/events/categories/counts');
        const data: CategoryCount[] = res.data.data;

        // Build a map from API results
        const countMap = new Map<string, number>();
        data.forEach((c) => countMap.set(c.category, c.count));

        // Merge all known categories (show 0-count ones too) + any unknown ones from API
        const merged: CategoryCount[] = ALL_CATEGORIES.map((cat) => ({
          category: cat,
          count: countMap.get(cat) || 0,
        }));

        // Add any categories from API that aren't in ALL_CATEGORIES
        data.forEach((c) => {
          if (!ALL_CATEGORIES.includes(c.category)) {
            merged.push(c);
          }
        });

        // Sort: categories with events first (by count desc), then 0-count alphabetically
        merged.sort((a, b) => {
          if (a.count > 0 && b.count === 0) return -1;
          if (a.count === 0 && b.count > 0) return 1;
          if (a.count !== b.count) return b.count - a.count;
          return a.category.localeCompare(b.category);
        });

        setCategories(merged);
      } catch {
        // If API fails, show all categories with 0 count
        setCategories(ALL_CATEGORIES.map((cat) => ({ category: cat, count: 0 })));
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleClick = (category: string) => {
    navigate(`/events?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium mb-4">
          <HiOutlineViewGrid className="w-4 h-4" />
          Discover Events
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))]">
          Browse Categories
        </h1>
        <p className="mt-3 text-[rgb(var(--text-secondary))] text-lg max-w-2xl mx-auto">
          Explore events by category — find exactly what you're looking for.
        </p>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] p-6 h-44"
            >
              <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4" />
              <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
              <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const config = CATEGORY_CONFIG[cat.category] || DEFAULT_CONFIG;
            return (
              <button
                key={cat.category}
                onClick={() => handleClick(cat.category)}
                className="group relative overflow-hidden rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] p-6 text-left hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {/* Gradient accent on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <div className="relative">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${config.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {config.icon}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">
                    {cat.category}
                  </h3>

                  {/* Count */}
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    {cat.count} {cat.count === 1 ? 'event' : 'events'}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-5 h-5 text-[rgb(var(--text-secondary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Total summary */}
      {!loading && (
        <div className="text-center text-sm text-[rgb(var(--text-secondary))]">
          {categories.reduce((sum, c) => sum + c.count, 0)} total events across {categories.filter((c) => c.count > 0).length} categories
        </div>
      )}
    </div>
  );
}
