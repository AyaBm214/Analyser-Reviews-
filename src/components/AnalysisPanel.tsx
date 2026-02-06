'use client';

import { Review } from '@/lib/data';
import { useMemo, useState } from 'react';
import { AlertTriangle, TrendingDown, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ReviewAnalyzer } from './ReviewAnalyzer';

interface AnalysisPanelProps {
    reviews: Review[];
    allReviews: Review[];
    filterListing: string;
    setFilterListing: (listing: string) => void;
    filterCategory: string | null;
    setFilterCategory: (category: string | null) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export function AnalysisPanel({
    reviews,
    allReviews,
    filterListing,
    setFilterListing,
    filterCategory,
    setFilterCategory,
    searchTerm,
    setSearchTerm
}: AnalysisPanelProps) {
    // Listing Selection Options derived from all reviews
    const listings = useMemo(() => {
        const unique = Array.from(new Set(allReviews.map(r => r.listingName).filter(Boolean)));
        return ['All Listings', ...unique] as string[];
    }, [allReviews]);

    // Use passed reviews for charts (they are already filtered by listing if selected)
    const negativeReviews = useMemo(() =>
        reviews.filter(r => r.sentiment === 'negative'),
        [reviews]);

    // 1b. Sentiment Stats for Pie Chart
    const sentimentStats = useMemo(() => {
        if (!reviews.length) return [
            { name: 'Positive', value: 0, color: '#22c55e' },
            { name: 'Neutral', value: 0, color: '#eab308' },
            { name: 'Negative', value: 0, color: '#ef4444' },
        ];

        const positive = reviews.filter(r => r.sentiment === 'positive').length;
        const neutral = reviews.filter(r => r.sentiment === 'neutral').length;
        const negative = reversedReviewsCount(reviews, 'negative'); // Helper if needed or direct

        // Re-implementing count simply to be safe since I don't see reversedReviewsCount definition
        const neg = reviews.filter(r => r.sentiment === 'negative').length;

        return [
            { name: 'Positive', value: positive, color: '#22c55e' },
            { name: 'Neutral', value: neutral, color: '#eab308' },
            { name: 'Negative', value: neg, color: '#ef4444' },
        ];
    }, [reviews]);

    function reversedReviewsCount(list: Review[], sentiment: string) {
        return list.filter(r => r.sentiment === sentiment).length;
    }




    // 2. Aggregate tags/issues for Bar Chart
    const issueData = useMemo(() => {
        const counts: Record<string, number> = {};
        negativeReviews.forEach(r => {
            r.tags?.forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .slice(0, 5) // Top 5
            .map(([name, value]) => ({ name, value }));
    }, [negativeReviews]);

    // 3. AI Persistent Issue Detection
    const persistentIssues = useMemo(() => {
        const issuesByListing: Record<string, Record<string, { firstDate: string; lastDate: string; count: number }>> = {};

        // Group by listing and tag
        negativeReviews.forEach(r => {
            const listingName = r.listingName;
            if (!listingName || !r.tags) return;

            if (!issuesByListing[listingName]) {
                issuesByListing[listingName] = {};
            }

            r.tags.forEach(tag => {
                const existing = issuesByListing[listingName][tag];
                if (existing) {
                    existing.count++;
                    if (new Date(r.date) < new Date(existing.firstDate)) existing.firstDate = r.date;
                    if (new Date(r.date) > new Date(existing.lastDate)) existing.lastDate = r.date;
                } else {
                    issuesByListing[listingName][tag] = {
                        firstDate: r.date,
                        lastDate: r.date,
                        count: 1
                    };
                }
            });
        });

        // Filter for "persistent" issues (span > 30 days)
        const persistent: Array<{ listing: string; issue: string; duration: number; count: number }> = [];
        const MONTH_MS = 30 * 24 * 60 * 60 * 1000; // ~30 days

        Object.entries(issuesByListing).forEach(([listing, tags]) => {
            Object.entries(tags).forEach(([tag, data]) => {
                const start = new Date(data.firstDate).getTime();
                const end = new Date(data.lastDate).getTime();
                const duration = end - start;

                // Alert condition: repeated more than once AND spans more than 30 days
                if (data.count > 1 && duration > MONTH_MS) {
                    persistent.push({
                        listing,
                        issue: tag,
                        duration: Math.ceil(duration / (24 * 60 * 60 * 1000)), // days
                        count: data.count
                    });
                }
            });
        });

        return persistent.sort((a, b) => b.duration - a.duration);
    }, [negativeReviews]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Chart Card 1: Sentiment Distribution */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
                <h3 className="text-white font-medium flex items-center gap-2 mb-4">
                    <TrendingDown className="w-4 h-4 text-purple-400" />
                    Sentiment Overview
                </h3>
                <div className="h-40 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sentimentStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {sentimentStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <span className="text-2xl font-bold text-white">{reviews.length}</span>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex justify-between text-xs text-gray-400 px-2">
                    {sentimentStats.map(s => (
                        <div key={s.name} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            <span>{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analysis Card: Listing Health & Top Complaints */}
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Listing Health Analysis
                    </h3>

                    {/* Listing Selector */}
                    <select
                        value={filterListing}
                        onChange={(e) => setFilterListing(e.target.value)}
                        className="bg-black/40 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                        {listings.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>

                {/* Aggregate Review Analyzer */}
                <ReviewAnalyzer
                    reviews={reviews}
                    listingName={filterListing === 'all' ? 'All Listings' : filterListing}
                    selectedCategory={filterCategory}
                    onCategoryChange={setFilterCategory}
                    searchQuery={searchTerm}
                    onSearchChange={setSearchTerm}
                    onListingChange={setFilterListing}
                />
            </div>

            {/* Persistent Alerts */}
            {persistentIssues.length > 0 && (
                <div className="md:col-span-3 bg-red-950/30 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-red-100 flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-lg animate-pulse">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            Critical Recurring Alerts
                            <span className="text-xs font-normal bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/20">
                                AI Detected
                            </span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {persistentIssues.map((alert, idx) => (
                                <div key={`${alert.listing}-${alert.issue}`} className="bg-black/40 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 hover:border-red-500/40 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-white text-sm truncate pr-2" title={alert.listing}>
                                            {alert.listing}
                                        </h4>
                                        <span className="text-xs font-bold text-red-400 bg-red-950/50 px-2 py-1 rounded border border-red-500/10">
                                            {alert.duration} Days
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-3">
                                        Recurring complaint about <span className="text-white font-medium">"{alert.issue}"</span> detected {alert.count} times.
                                    </p>
                                    <button className="w-full py-2 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                                        Notify Owner <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}
