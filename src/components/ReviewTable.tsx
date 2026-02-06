'use client';

import { useState, useMemo, useEffect } from 'react';
import { Review } from '@/lib/data';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Search, Filter, AlertCircle, CheckCircle, MinusCircle, Star, Home, Share2 } from 'lucide-react';

interface ReviewTableProps {
    reviews: Review[];
    // Lifted state props
    filteredReviews: Review[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterSentiment: 'all' | 'positive' | 'neutral' | 'negative';
    setFilterSentiment: (sentiment: 'all' | 'positive' | 'neutral' | 'negative') => void;
    filterListing: string;
    setFilterListing: (listing: string) => void;
    filterChannel: string;
    setFilterChannel: (channel: string) => void;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
}

export function ReviewTable({
    reviews,
    filteredReviews,
    searchTerm, setSearchTerm,
    filterSentiment, setFilterSentiment,
    filterListing, setFilterListing,
    filterChannel, setFilterChannel,
    startDate, setStartDate,
    endDate, setEndDate
}: ReviewTableProps) {
    // Internal state removed - now controlled by parent

    // Extract unique channels
    const uniqueChannels = useMemo(() => {
        const channels = new Set(reviews.map(r => r.source).filter(Boolean));
        return Array.from(channels).sort();
    }, [reviews]);

    // Extract unique listing names
    const uniqueListings = useMemo(() => {
        const listings = new Set(reviews.map(r => r.listingName).filter(Boolean));
        return Array.from(listings).sort();
    }, [reviews]);


    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 space-y-4 border-b border-white/10 bg-black/20">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Filter className="w-5 h-5 text-purple-400" />
                        Review Database
                    </h2>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search reviews..."
                                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    {/* Sentiment Filter */}
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setFilterSentiment('all')}
                            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", filterSentiment === 'all' ? "bg-purple-500 text-white shadow-lg" : "text-gray-400 hover:text-white")}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterSentiment('negative')}
                            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", filterSentiment === 'negative' ? "bg-red-500 text-white shadow-lg" : "text-gray-400 hover:text-white")}
                        >
                            Negative
                        </button>
                        <button
                            onClick={() => setFilterSentiment('neutral')}
                            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", filterSentiment === 'neutral' ? "bg-yellow-500/80 text-white shadow-lg" : "text-gray-400 hover:text-white")}
                        >
                            Neutral
                        </button>
                        <button
                            onClick={() => setFilterSentiment('positive')}
                            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", filterSentiment === 'positive' ? "bg-green-500 text-white shadow-lg" : "text-gray-400 hover:text-white")}
                        >
                            Positive
                        </button>
                    </div>

                    {/* Listing Filter */}
                    {uniqueListings.length > 0 && (
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                            <Home className="w-3.5 h-3.5 text-gray-400" />
                            <select
                                value={filterListing}
                                onChange={(e) => setFilterListing(e.target.value)}
                                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                            >
                                <option value="all" className="bg-neutral-800">All Listings</option>
                                {uniqueListings.map(listing => (
                                    <option key={listing as string} value={listing as string} className="bg-neutral-800 text-white">
                                        {listing}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Channel Filter */}
                    {uniqueChannels.length > 0 && (
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                            <Share2 className="w-3.5 h-3.5 text-gray-400" />
                            <select
                                value={filterChannel}
                                onChange={(e) => setFilterChannel(e.target.value)}
                                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                            >
                                <option value="all" className="bg-neutral-800">All Channels</option>
                                {uniqueChannels.map(channel => (
                                    <option key={channel as string} value={channel as string} className="bg-neutral-800 text-white">
                                        {channel}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date Filter */}
                    <div className="flex gap-2 items-center text-sm text-gray-400 ml-auto">
                        <span>From</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-white/5 text-gray-100 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                            <th className="p-4">Check-out</th>
                            <th className="p-4">External Listing Name</th>
                            <th className="p-4">Channel</th>
                            <th className="p-4">Guest Name</th>
                            <th className="p-4">Rating</th>
                            <th className="p-4 w-1/3">Overall Review</th>
                            <th className="p-4">Tags</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredReviews.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">
                                    No reviews found matching your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredReviews.map((review) => (
                                <tr
                                    key={review.id}
                                    className={cn(
                                        "hover:bg-white/5 transition-colors group",
                                        review.sentiment === 'negative' ? "bg-red-500/5 hover:bg-red-500/10" : ""
                                    )}
                                >
                                    <td className="p-4 whitespace-nowrap text-gray-400">
                                        {format(parseISO(review.date), 'MMM d, yyyy')}
                                    </td>
                                    <td className="p-4 font-medium text-white max-w-[150px] truncate" title={review.listingName}>
                                        {review.listingName || <span className="text-gray-600 italic">Unknown</span>}
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/10">
                                            {review.source}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-300">
                                        {review.author}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={cn(
                                                        "w-3.5 h-3.5",
                                                        i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2 items-start">
                                            {review.sentiment === 'negative' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                                            {review.sentiment === 'positive' && <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />}
                                            {review.sentiment === 'neutral' && <MinusCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />}
                                            <p className={cn("line-clamp-2 hover:line-clamp-none transition-all", review.sentiment === 'negative' ? "text-red-100" : "text-gray-300")}>
                                                {review.text}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {review.tags?.map(tag => (
                                                <span key={tag} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-black/40 text-gray-400 border border-white/5">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-white/10 bg-black/20 text-xs text-center text-gray-500">
                Showing {filteredReviews.length} of {reviews.length} reviews
            </div>
        </div>
    );
}
