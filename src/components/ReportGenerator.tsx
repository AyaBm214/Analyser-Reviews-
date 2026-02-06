import { Review, RATING_CATEGORIES } from '@/lib/data';
import { useMemo, useState } from 'react';
import { FileText, Download, ExternalLink, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReportGeneratorProps {
    reviews: Review[];
}

export function ReportGenerator({ reviews }: ReportGeneratorProps) {
    const [selectedListing, setSelectedListing] = useState<string>('all');
    const [reportType, setReportType] = useState<'none' | 'internal' | 'external'>('none');

    // Get unique listings
    const listings = useMemo(() => {
        const unique = new Set(reviews.map(r => r.listingName).filter(Boolean));
        return Array.from(unique) as string[];
    }, [reviews]);

    // Filter reviews for report
    const reportData = useMemo(() => {
        if (selectedListing === 'all') return reviews;
        return reviews.filter(r => r.listingName === selectedListing);
    }, [reviews, selectedListing]);

    // Stats for report
    const stats = useMemo(() => {
        const total = reportData.length;
        if (total === 0) return null;

        const avgRating = reportData.reduce((acc, r) => acc + r.rating, 0) / total;

        const sentimentCounts = {
            positive: reportData.filter(r => r.sentiment === 'positive').length,
            neutral: reportData.filter(r => r.sentiment === 'neutral').length,
            negative: reportData.filter(r => r.sentiment === 'negative').length,
        };

        const tagCounts: Record<string, number> = {};
        reportData.forEach(r => {
            r.tags?.forEach(t => {
                tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
        });

        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const recentPositive = reportData
            .filter(r => r.sentiment === 'positive')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);

        const recentNegative = reportData
            .filter(r => r.sentiment === 'negative') // Strict negative only
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate Category Ratings
        // Note: This logic duplicates ReviewAnalyzer slightly, can be refactored later if needed.
        const categoryRatings = RATING_CATEGORIES.map(cat => {
            const catReviews = reportData; // use all for base
            // Simple heuristic matching ReviewAnalyzer
            const issuesCount = catReviews.filter(r =>
                r.tags?.some(tag => cat.keywords.some(k => tag.toLowerCase().includes(k))) ||
                cat.keywords.some(k => r.text.toLowerCase().includes(k))
            ).filter(r => r.sentiment === 'negative').length; // Penalty only on negative

            const deduction = Math.min(4, Math.floor((issuesCount / total) * 10 * 0.5));
            const rating = total > 0 ? (issuesCount > 0 && deduction === 0 ? 4.5 : Math.max(1, 5 - deduction)) : 5;

            return { name: cat.name, rating, issuesCount };
        });

        return { total, avgRating, sentimentCounts, topTags, recentPositive, recentNegative, categoryRatings };
    }, [reportData]);

    if (reviews.length === 0) return null;

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Report Generator
            </h2>

            <div className="flex flex-wrap items-center gap-4 mb-6">
                <select
                    value={selectedListing}
                    onChange={(e) => {
                        setSelectedListing(e.target.value);
                        setReportType('none');
                    }}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                    <option value="all">All Listings (Aggregate)</option>
                    {listings.map(l => (
                        <option key={l} value={l}>{l}</option>
                    ))}
                </select>

                <div className="flex gap-2">
                    <button
                        onClick={() => setReportType('internal')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                            reportType === 'internal'
                                ? "bg-red-500/20 border-red-500/50 text-red-200"
                                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        )}
                    >
                        Internal Audit Report
                    </button>
                    <button
                        onClick={() => setReportType('external')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                            reportType === 'external'
                                ? "bg-blue-500/20 border-blue-500/50 text-blue-200"
                                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        )}
                    >
                        Owner Summary
                    </button>
                </div>
            </div>

            {/* Internal Report View */}
            {reportType === 'internal' && stats && (
                <div className="bg-black/40 border border-gray-800 rounded-xl p-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-800 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Internal Performance Audit</h3>
                            <p className="text-gray-400 text-sm">Target: {selectedListing === 'all' ? 'All Listings' : selectedListing}</p>
                            <p className="text-gray-500 text-xs mt-1">Generated: {format(new Date(), 'PPpp')}</p>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex flex-col items-end">
                                <span className={cn(
                                    "text-3xl font-bold",
                                    stats.avgRating >= 4 ? "text-green-400" : stats.avgRating >= 3 ? "text-yellow-400" : "text-red-400"
                                )}>{stats.avgRating.toFixed(1)}</span>
                                <span className="text-xs text-gray-400">Avg Rating</span>
                            </div>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="mb-8">
                        <h4 className="text-white font-medium mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                            Category Performance
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {stats.categoryRatings.map(cat => (
                                <div key={cat.name} className="bg-white/5 border border-white/5 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-400 mb-1">{cat.name}</p>
                                    <div className="flex justify-center gap-0.5 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={cn("w-1.5 h-1.5 rounded-full",
                                                i < Math.round(cat.rating)
                                                    ? (cat.rating < 3 ? "bg-red-500" : "bg-green-500")
                                                    : "bg-gray-700")}
                                            />
                                        ))}
                                    </div>
                                    <p className={cn("text-lg font-bold", cat.rating < 4 ? "text-red-400" : "text-white")}>
                                        {cat.rating.toFixed(1)}
                                    </p>
                                    {cat.issuesCount > 0 && (
                                        <p className="text-[10px] text-red-400 mt-1">{cat.issuesCount} issues</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-4">
                            <p className="text-red-400 text-xs uppercase font-bold mb-2">Negative Vol</p>
                            <p className="text-2xl text-white">{stats.sentimentCounts.negative}</p>
                            <p className="text-xs text-gray-500 mt-1">Immediate attention needed</p>
                        </div>
                        <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-lg p-4">
                            <p className="text-yellow-400 text-xs uppercase font-bold mb-2">Neutral Vol</p>
                            <p className="text-2xl text-white">{stats.sentimentCounts.neutral}</p>
                            <p className="text-xs text-gray-500 mt-1">Growth opportunity</p>
                        </div>
                        <div className="bg-green-950/20 border border-green-500/20 rounded-lg p-4">
                            <p className="text-green-400 text-xs uppercase font-bold mb-2">Positive Vol</p>
                            <p className="text-2xl text-white">{stats.sentimentCounts.positive}</p>
                            <p className="text-xs text-gray-500 mt-1">Maintain standard</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Critical Issues (Recurring Tags)
                        </h4>
                        <div className="space-y-2">
                            {stats.topTags.map((tag, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                                    <span className="text-gray-300 font-medium">{tag.name}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden hidden md:block">
                                            <div
                                                className="h-full bg-red-500/50"
                                                style={{ width: `${Math.min(100, (tag.count / stats.total) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-red-300 font-mono bg-red-500/10 px-2 py-0.5 rounded border border-red-500/10">
                                            {tag.count} mentions
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-medium mb-4">Detailed Negative Feedback Analysis</h4>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {stats.recentNegative.map((r) => (
                                <div key={r.id} className="p-4 bg-red-950/10 border border-red-500/10 rounded-lg text-sm hover:bg-red-950/20 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-2 items-center">
                                            <span className={cn(
                                                "text-xs font-bold px-1.5 py-0.5 rounded",
                                                r.rating <= 2 ? "bg-red-500 text-white" : "bg-yellow-500/20 text-yellow-300"
                                            )}>{r.rating}/5</span>
                                            <span className="text-red-200 font-medium">{r.source}</span>
                                        </div>
                                        <span className="text-gray-500 text-xs">{format(new Date(r.date), 'PP')}</span>
                                    </div>
                                    <p className="text-gray-300 mb-3 italic">"{r.text}"</p>

                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-xs text-gray-500">Categorized as:</span>
                                        {r.tags?.map((t, i) => (
                                            <span key={i} className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/10 uppercase tracking-wide">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* External Report View */}
            {reportType === 'external' && stats && (
                <div className="bg-white text-black rounded-xl p-8 animate-in fade-in slide-in-from-top-4 shadow-xl">
                    <div className="flex justify-between items-start mb-8 border-b-2 border-gray-100 pb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">Performance Overview</h3>
                            <p className="text-gray-500 text-sm">Property: <span className="font-semibold text-gray-900">{selectedListing === 'all' ? 'Portfolio Aggregate' : selectedListing}</span></p>
                        </div>
                        <div className="text-right">
                            <span className="block text-4xl font-bold text-blue-600">{stats.avgRating.toFixed(1)}</span>
                            <div className="flex items-center gap-1 justify-end text-sm text-gray-600 mt-1">
                                <span>{stats.total} total reviews</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Guest Sentiment</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-700">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{Math.round((stats.sentimentCounts.positive / stats.total) * 100)}%</p>
                                        <p className="text-xs text-gray-500">Positive Experience</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                                        <Minus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{Math.round((stats.sentimentCounts.neutral / stats.total) * 100)}%</p>
                                        <p className="text-xs text-gray-500">Neutral Experience</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Actionable Insights</h4>
                            <div className="bg-gray-50 rounded-xl p-4">
                                {stats.topTags.slice(0, 3).map((tag, i) => (
                                    <div key={i} className="flex items-center justify-between mb-3 last:mb-0">
                                        <span className="text-gray-700 font-medium text-sm capitalize">{tag.name}</span>
                                        <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{tag.count} reports</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4">Areas for Improvement (Recent Issues)</h4>
                        <div className="grid grid-cols-1 gap-4">
                            {stats.recentNegative.slice(0, 5).map((r) => (
                                <div key={r.id} className="bg-red-50 border border-red-100 rounded-lg p-4">
                                    <div className="flex gap-1 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={cn("w-4 h-4 rounded-full", i < r.rating ? "bg-red-400" : "bg-gray-200")} />
                                        ))}
                                    </div>
                                    <p className="text-gray-800 italic mb-2">"{r.text}"</p>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500 font-medium">{r.date.split('T')[0]}</span>
                                        <div className="flex gap-1">
                                            {r.tags?.map((t, i) => (
                                                <span key={i} className="text-[10px] bg-white text-red-400 px-1.5 py-0.5 rounded border border-red-100 uppercase">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {stats.recentNegative.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No negative reviews found. Keep up the great work!</p>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 mt-8 flex justify-between items-center text-xs text-gray-400">
                        <span>Generated by Premium Booking Analytics</span>
                        <span>{format(new Date(), 'yyyy-MM-dd')}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
