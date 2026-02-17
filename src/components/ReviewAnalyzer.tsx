'use client';

import { useMemo } from 'react';
import { Star, Quote, Search, Filter, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Review, RATING_CATEGORIES } from '@/lib/data';

interface RatingCategory {
    name: string;
    rating: number; // 1-5
    keywords: string[];
    comment?: string;
}

interface AnalysisResult {
    overallRating: number;
    overallAssessment: string;
    categories: RatingCategory[];
}

interface ReviewAnalyzerProps {
    listingName?: string;
    reviews?: Review[];
    // Interactivity Props
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onListingChange?: (listing: string) => void;
}

export function ReviewAnalyzer({
    listingName,
    reviews,
    selectedCategory,
    onCategoryChange,
    searchQuery,
    onSearchChange,
    onListingChange
}: ReviewAnalyzerProps) {

    // Normalize ratings (handle 10-point scale)
    const normalizedReviews = useMemo(() => {
        if (!reviews) return [];
        return reviews.map(r => ({
            ...r,
            rating: r.rating > 5 ? r.rating / 2 : r.rating
        }));
    }, [reviews]);

    // --- 1. Aggregate Logic ---
    const aggregateResult = useMemo<AnalysisResult | null>(() => {
        if (!normalizedReviews || normalizedReviews.length === 0) return null;

        const count = normalizedReviews.length;
        const avgRating = normalizedReviews.reduce((sum, r) => sum + r.rating, 0) / count;
        const negativeReviews = normalizedReviews.filter(r => r.sentiment === 'negative');

        const getCategoryRating = (keywords: string[]) => {
            const issuesCount = negativeReviews.filter(r =>
                r.tags?.some(tag => keywords.some(k => tag.toLowerCase().includes(k)))
            ).length;

            // Heuristic: Start at 5, deduct 1 for every 10% of reviews having this issue, min 1
            const deduction = Math.min(4, Math.floor((issuesCount / count) * 10 * 0.5));
            if (issuesCount > 0 && deduction === 0) return 4.5;
            return Math.max(1, 5 - deduction);
        };

        const categories: RatingCategory[] = RATING_CATEGORIES.map(cat => ({
            name: cat.name,
            keywords: cat.keywords,
            rating: getCategoryRating(cat.keywords)
        }));

        return {
            overallRating: Number(avgRating.toFixed(1)),
            overallAssessment: `${listingName} has an average rating of ${avgRating.toFixed(1)} from ${count} reviews.`,
            categories
        };
    }, [normalizedReviews, listingName]);

    // --- 2. Drill-down / Filter Logic ---
    const filteredReviews = useMemo(() => {
        if (!normalizedReviews) return [];
        let filtered = normalizedReviews;

        // Filter by Category
        if (selectedCategory && aggregateResult) {
            const category = aggregateResult.categories.find(c => c.name === selectedCategory);
            if (category) {
                filtered = filtered.filter(r => {
                    // Include if it has tags matching keywords OR if text contains keywords (simple check)
                    const hasTag = r.tags?.some(tag => category.keywords.some(k => tag.toLowerCase().includes(k)));
                    const hasText = category.keywords.some(k => r.text.toLowerCase().includes(k));

                    // User Request: Show ONLY negative reviews when drilling down into a category
                    const isGlobalSearch = searchQuery.length > 0; // If searching, maybe loosen strictness? 
                    // But for category drilldown specifically:
                    return (hasTag || hasText) && (r.sentiment === 'negative' || r.sentiment === 'neutral');
                });
            }
        }

        // Filter by Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.text.toLowerCase().includes(lowerQuery) ||
                r.listingName?.toLowerCase().includes(lowerQuery) ||
                r.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }

        return filtered;
    }, [normalizedReviews, selectedCategory, searchQuery, aggregateResult]);

    // --- 3. Top Listings Logic (Only for 'All Listings') ---
    const topListingsForCategory = useMemo(() => {
        if (listingName !== 'All Listings' || !selectedCategory || !normalizedReviews || !aggregateResult) return [];

        const category = aggregateResult.categories.find(c => c.name === selectedCategory);
        if (!category) return [];

        const listingCounts: Record<string, number> = {};

        normalizedReviews.forEach(r => {
            const hasIssue = r.tags?.some(tag => category.keywords.some(k => tag.toLowerCase().includes(k))) ||
                category.keywords.some(k => r.text.toLowerCase().includes(k));

            // Only count negative/neutral feedback for "Top Issues"
            if (hasIssue && r.sentiment !== 'positive' && r.listingName) {
                listingCounts[r.listingName] = (listingCounts[r.listingName] || 0) + 1;
            }
        });

        return Object.entries(listingCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5
    }, [listingName, selectedCategory, normalizedReviews, aggregateResult]);


    if (!normalizedReviews || !aggregateResult) return null;

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Deep Dive Analysis
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        {aggregateResult.overallAssessment}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search reviews..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white text-gray-500"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Category Navigation */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categories</h4>
                    <div className="flex flex-col gap-2">
                        {aggregateResult.categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => onCategoryChange(selectedCategory === cat.name ? null : cat.name)}
                                className={cn(
                                    "flex justify-between items-center p-3 rounded-xl border transition-all text-left group",
                                    selectedCategory === cat.name
                                        ? "bg-purple-500/20 border-purple-500/50"
                                        : "bg-white/5 border-white/5 hover:bg-white/10"
                                )}
                            >
                                <div>
                                    <span className={cn(
                                        "text-sm font-medium block",
                                        selectedCategory === cat.name ? "text-purple-200" : "text-gray-300 group-hover:text-white"
                                    )}>
                                        {cat.name}
                                    </span>
                                </div>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "w-3 h-3",
                                                i < Math.round(cat.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                                            )}
                                        />
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Top Listings Helper (Only in All Listings mode & when category selected) */}
                    {listingName === 'All Listings' && selectedCategory && topListingsForCategory.length > 0 && (
                        <div className="mt-6 bg-red-950/20 border border-red-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <h5 className="text-xs font-bold text-red-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" />
                                Most Complaints
                            </h5>
                            <div className="space-y-2">
                                {topListingsForCategory.map((item, idx) => (
                                    <button
                                        key={item.name}
                                        onClick={() => onListingChange?.(item.name)}
                                        className="w-full flex justify-between items-center group hover:bg-red-500/10 p-1.5 rounded-lg transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-xs text-gray-400 group-hover:text-red-200 transition-colors truncate max-w-[140px]" title={item.name}>
                                                {item.name}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-red-500/0 group-hover:text-red-500 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </div>
                                        <span className="text-xs font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded group-hover:bg-red-500/20">
                                            {item.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Review List / Details */}
                <div className="lg:col-span-2 bg-black/20 rounded-xl border border-white/5 p-4 min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            {selectedCategory ? (
                                <>
                                    <Filter className="w-4 h-4 text-purple-400" />
                                    Filtered by: <span className="text-purple-400">{selectedCategory}</span>
                                </>
                            ) : searchQuery ? (
                                <>
                                    <Search className="w-4 h-4 text-purple-400" />
                                    Search Results
                                </>
                            ) : (
                                <>
                                    <Quote className="w-4 h-4 text-gray-400" />
                                    Recent Reviews
                                </>
                            )}
                        </h4>
                        <span className="text-xs text-gray-500">{filteredReviews.length} reviews found</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[500px]">
                        {filteredReviews.length > 0 ? (
                            filteredReviews.map((review) => (
                                <div key={review.id} className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    "text-xs font-bold px-1.5 py-0.5 rounded",
                                                    review.sentiment === 'positive' ? "bg-green-500/10 text-green-400" :
                                                        review.sentiment === 'negative' ? "bg-red-500/10 text-red-400" :
                                                            "bg-yellow-500/10 text-yellow-400"
                                                )}>
                                                    {review.rating}/5
                                                </span>
                                                <span className="text-xs text-gray-400">{review.date}</span>
                                                {listingName === 'All Listings' && (
                                                    <span className="text-xs text-gray-500 border-l border-white/10 pl-2 ml-1 truncate max-w-[150px]">
                                                        {review.listingName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed mb-3">
                                        "{review.text}"
                                    </p>
                                    {review.tags && review.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {review.tags.map(tag => (
                                                <span key={tag} className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full border",
                                                    selectedCategory && aggregateResult?.categories.find(c => c.name === selectedCategory)?.keywords.some(k => tag.toLowerCase().includes(k))
                                                        ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                                                        : "bg-white/5 border-white/10 text-gray-500"
                                                )}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                                <Search className="w-8 h-8 mb-2" />
                                <p className="text-sm">No reviews match your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
