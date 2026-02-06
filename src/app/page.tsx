'use client';

import { useState } from 'react';
import { Review } from '@/lib/data';
import { ReviewTable } from '@/components/ReviewTable';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { ReportGenerator } from '@/components/ReportGenerator';
import { CSVUploader } from '@/components/CSVUploader';
import { RefreshCw } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const handleDataLoaded = (data: any[]) => {
    const logs: string[] = [];
    logs.push(`Loaded ${data.length} raw rows`);
    if (data.length > 0) logs.push(`Keys row 0: ${Object.keys(data[0]).join(', ')}`);

    // Helper to find a key fuzzy-matching a list of candidates
    const findValue = (item: any, candidates: string[]) => {
      const keys = Object.keys(item);
      for (const candidate of candidates) {
        // 1. Try exact match
        if (item[candidate] !== undefined) return item[candidate];

        // 2. Try case-insensitive keys
        const lowerCandidate = candidate.toLowerCase();
        const matchedKey = keys.find(k =>
          k.toLowerCase() === lowerCandidate ||
          k.toLowerCase().includes(lowerCandidate) ||
          k.replace(/['"]/g, '').trim().toLowerCase() === lowerCandidate
        );
        if (matchedKey && item[matchedKey]) return item[matchedKey];
      }
      return null;
    };

    const formattedData: Review[] = data.map((item, idx) => {
      // 1. Resolve Rating
      const rawRating = findValue(item, ['rating', 'Review power', 'Review score', 'Score', 'Stars']) || 0;
      const rating = Number(rawRating);

      // 2. Resolve Text
      const text = findValue(item, ['text', 'review', 'Overall review', 'content', 'comment', 'feedback', 'body']) || '';

      // 3. Resolve Date
      const rawDate = findValue(item, ['date', 'Date', 'Check-out', 'Check-in', 'Timestamp', 'created_at']);
      let date = new Date().toISOString();

      if (rawDate) {
        // Try standard ISO
        let parsed = new Date(rawDate);
        // Handle DD/MM/YYYY or DD-MM-YYYY (Europe/Excel generic) if standard fails or seems wrong
        if (isNaN(parsed.getTime())) {
          const parts = rawDate.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          if (parts) {
            // assume DD/MM/YYYY
            // new Date(yyyy, mm-1, dd)
            parsed = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]));
          }
        }
        if (!isNaN(parsed.getTime())) {
          date = parsed.toISOString();
        }
      }

      // 4. Resolve Source
      const source = findValue(item, ['source', 'Source', 'Channel', 'Platform', 'Origin']) || 'CSV Upload';

      // 5. Resolve Author
      const author = findValue(item, ['author', 'Author', 'Reviewer Name', 'Guest name', 'User', 'Name']) || 'Anonymous';

      // 6. Resolve Listing Name
      const listingName = findValue(item, ['listingName', 'Listing Name', 'External Listing Name', 'Listing ID', 'Property']) || undefined;

      // 7. Auto-calculate Sentiment if missing
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      const rawSentiment = findValue(item, ['sentiment', 'Sentiment']);

      if (rawSentiment) {
        sentiment = String(rawSentiment).toLowerCase() as any;
      } else {
        // Fallback: If rating is 0 (missing) or ambiguous, check text for sentiment
        const lowerText = text.toLowerCase();

        if (rating === 0) {
          if (lowerText.match(/excellent|amazing|great|awesome|recommend|perfect|love|good|nice|pleasure|smooth|timely|wonderful|guest|super|bien|bon|merci|recommande|plaisir|exceptionnel|sympa|respect|adored|adoré/)) {
            sentiment = 'positive';
            // Optionally auto-correct rating if you dare, but safer to just fix sentiment
          } else if (lowerText.match(/bad|terrible|horrible|dirty|poor|worst|waste|rude|issues|disappointed|déçu|sale|mauvais|horreur|bruit|fuir|jamais|remboursement|poubelle/)) {
            sentiment = 'negative';
          }
        } else {
          // Standard rating-based
          if (rating >= 4) sentiment = 'positive';
          else if (rating === 3) sentiment = 'neutral';
          else if (rating <= 2) sentiment = 'negative';
        }
      }

      // 8. Resolve Tags (Auto-tag if missing)
      let tags: string[] = [];
      const rawTags = findValue(item, ['tags', 'Tags', 'Labels', 'Keywords']);

      if (rawTags) {
        tags = Array.isArray(rawTags) ? rawTags : String(rawTags).split(',').map(t => t.trim());
      } else {
        // Auto-tagging logic based on text
        // Auto-tagging logic based on text (using centralized keywords)
        const lowerText = text.toLowerCase();

        // Import RATING_CATEGORIES logic implicitly by duplicating or if we imported it. 
        // Since we are inside a function, let's use a mapping robustly. 
        // Note: We need to import RATING_CATEGORIES at top of file, assuming I added the import.
        // For now, I will hardcode the extended list here to avoid import errors if not yet imported, 
        // OR I can add the import in a separate step. Better to adhere to "one replace per file".
        // I will use a robust hardcoded map here that matches data.ts to ensure it works immediately.

        const keyMap: Record<string, string[]> = {
          'Cleanliness': ['clean', 'dirt', 'hygiene', 'dust', 'mold', 'mess', 'stain', 'smell', 'hair', 'bug', 'insect', 'rat', 'mouse', 'propre', 'sale', 'poussière', 'tache', 'odeur', 'poil', 'ménage', 'nettoyage'],
          'Accuracy': ['accuracy', 'description', 'photo', 'misleading', 'listing', 'fake', 'lie', 'précision', 'trompeur', 'faux'],
          'Check-in': ['check-in', 'key', 'access', 'arrival', 'door', 'code', 'lock', 'arrivée', 'clé', 'accès', 'porte', 'serrure'],
          'Communication': ['communication', 'respond', 'reply', 'host', 'manager', 'message', 'text', 'call', 'phone', 'réponse', 'hôte', 'message', 'appel'],
          'Location': ['location', 'area', 'noise', 'safe', 'neighborhood', 'street', 'loud', 'party', 'neighbor', 'emplacement', 'quartier', 'bruit', 'rue', 'voisin'],
          'Value': ['value', 'price', 'expensive', 'cost', 'worth', 'prix', 'cher', 'coût'],
          'Comfort': ['bed', 'mattress', 'sleep', 'pillow', 'comfort', 'ac', 'heat', 'cold', 'temperature', 'lit', 'matelas', 'dormir', 'confort', 'chaud', 'froid', 'climatisation'],
          'Facilities': ['kitchen', 'fridge', 'oven', 'microwave', 'bath', 'shower', 'water', 'toilet', 'wifi', 'internet', 'pool', 'spa', 'cuisine', 'four', 'bain', 'douche', 'toilette', 'piscine']
        };

        Object.entries(keyMap).forEach(([tag, keywords]) => {
          if (keywords.some(k => lowerText.includes(k))) {
            tags.push(tag);
          }
        });

        // Fallback for negative reviews without specific tags
        if (tags.length === 0 && sentiment === 'negative') tags.push('General Complaint');
      }

      return {
        id: item.id || `csv-${idx}`,
        source,
        date,
        rating,
        author,
        text,
        listingName,
        sentiment,
        tags
      };
    }).filter((r, i) => {
      const isValid = r.text && r.text.length > 0;
      if (!isValid && i < 5) logs.push(`Skipped row ${i}: No text found. Data: ${JSON.stringify(data[i])}`);
      return isValid;
    });

    logs.push(`Mapped ${formattedData.length} valid reviews.`);
    setDebugLog(logs);
    console.log(`Mapped ${formattedData.length} reviews from CSV`); // Debug log

    setReviews(formattedData);
  };

  // --- Filtering State (Lifted from ReviewTable) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [filterListing, setFilterListing] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Update date range when new reviews (CSV data) are loaded
  useEffect(() => {
    if (reviews.length > 0) {
      const timestamps = reviews.map(r => new Date(r.date).getTime()).filter(t => !isNaN(t));
      if (timestamps.length > 0) {
        const minDate = new Date(Math.min(...timestamps));
        const maxDate = new Date(Math.max(...timestamps));
        setStartDate(format(minDate, 'yyyy-MM-dd'));
        setEndDate(format(maxDate, 'yyyy-MM-dd'));

        // Reset filters
        setSearchTerm('');
        setFilterSentiment('all');
        setFilterListing('all');
        setFilterCategory(null);
        setFilterChannel('all');
      }
    }
  }, [reviews]);

  // 1. First level: Filter by Listing ONLY (for Analysis Panel aggregates)
  const listingReviews = useMemo(() => {
    if (filterListing === 'all') return reviews;
    return reviews.filter(r => r.listingName === filterListing);
  }, [reviews, filterListing]);

  // 2. Second level: Apply all other filters (for Table and Analysis List)
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const reviewDate = parseISO(review.date);
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      const matchesSearch =
        review.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.source.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSentiment = filterSentiment === 'all' || review.sentiment === filterSentiment;
      const matchesListing = filterListing === 'all' || review.listingName === filterListing;
      const matchesChannel = filterChannel === 'all' || review.source === filterChannel;
      const matchesDate = isWithinInterval(reviewDate, { start, end });

      let matchesCategory = true;
      if (filterCategory) {
        // Import RATING_CATEGORIES dynamically or inline check if import fails
        // For now reusing the specific logic:
        const categoryKeywords = {
          "Cleanliness": ['clean', 'dirt', 'hygiene', 'dust', 'mold', 'tidy', 'mess'],
          "Accuracy": ['accuracy', 'description', 'photo', 'misleading', 'listing', 'picture'],
          "Check-in": ['check-in', 'check in', 'key', 'access', 'arrival', 'lockbox', 'code', 'enter'],
          "Communication": ['communication', 'respond', 'reply', 'host', 'manager', 'message', 'text', 'call'],
          "Location": ['location', 'area', 'noise', 'safe', 'neighborhood', 'street', 'distance', 'view'],
          "Value": ['value', 'price', 'expensive', 'worth', 'cost', 'cheap']
        }[filterCategory] || [];

        matchesCategory = review.tags?.some(tag => categoryKeywords.some((k: string) => tag.toLowerCase().includes(k))) ||
          categoryKeywords.some((k: string) => review.text.toLowerCase().includes(k));
      }

      return matchesSearch && matchesSentiment && matchesListing && matchesChannel && matchesDate && matchesCategory;
    });
  }, [reviews, searchTerm, filterSentiment, filterListing, filterChannel, startDate, endDate, filterCategory]);


  return (
    <main className="min-h-screen bg-neutral-950 text-white p-8 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[40%] bg-purple-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-blue-900/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-white/10 gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-red-500/20 ring-2 ring-white/10">
              <img src="/logo.png" alt="Premium Booking" className="object-cover w-full h-full" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-white to-red-400 bg-clip-text text-transparent tracking-tight">
                Analyse Reviews Premium
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-0.5 w-8 bg-red-500 rounded-full"></span>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">
                  By PremiumBooking.ca
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Upload Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Data Source</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-sm text-gray-400 space-y-4">
              <p>Upload your review data to analyze specific feedback.</p>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-2">
                <p className="font-medium text-gray-300">Required CSV Columns:</p>
                <div className="flex flex-wrap gap-2">
                  {['date', 'rating', 'text', 'source'].map(col => (
                    <code key={col} className="bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded text-xs border border-purple-500/30">
                      {col}
                    </code>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  const csvContent = "id,source,date,rating,author,text,sentiment,tags\\n101,Google,2026-01-29,1,Jane Doe,The AC was broken and it was too hot.,negative,facilities\\n102,Yelp,2026-01-28,5,John Smith,Amazing food and great atmosphere!,positive,food\\n103,Facebook,2026-01-27,2,Bob,Waiter was rude.,negative,service";
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sample_reviews.csv';
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-4"
              >
                Download Sample CSV
              </button>
            </div>
            <CSVUploader onDataLoaded={(data) => handleDataLoaded(data)} />
          </div>

          {/* Debug Log (Visible if no reviews or requested) */}
          {reviews.length === 0 && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl font-mono text-xs text-red-200 overflow-x-auto max-h-60">
              <p className="font-bold mb-2 text-red-100">Debug Info (0 reviews loaded):</p>
              {debugLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}
        </section>

        <section>
          <AnalysisPanel
            reviews={listingReviews} // Use listing-filtered reviews for stats
            filterListing={filterListing === 'all' ? 'All Listings' : filterListing}
            setFilterListing={(l) => setFilterListing(l === 'All Listings' ? 'all' : l)}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            allReviews={reviews} // Pass all reviews for listing selector
          />
        </section>

        <section>
          <ReportGenerator reviews={reviews} />
        </section>

        <section>
          <ReviewTable
            reviews={reviews}
            filteredReviews={filteredReviews}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            filterSentiment={filterSentiment} setFilterSentiment={setFilterSentiment}
            filterListing={filterListing} setFilterListing={setFilterListing}
            filterChannel={filterChannel} setFilterChannel={setFilterChannel}
            startDate={startDate} setStartDate={setStartDate}
            endDate={endDate} setEndDate={setEndDate}
          />
        </section>
      </div>
    </main>
  );
}
