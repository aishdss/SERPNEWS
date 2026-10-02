import React, { useState } from 'react';
import { 
  Search, 
  X, 
  Loader2, 
  Clock, 
  GitCommit, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  Layers
} from 'lucide-react';
import type { StoryHub, NewsItem } from '../types/news.js';
import { VerificationBadge } from './VerificationBadge.js';
import { getSourceName } from '../utils/source.js';

interface Props {
  onClose: () => void;
  onOpenStory: (story: StoryHub) => void;
}

export const SearchModal: React.FC<Props> = ({ onClose, onOpenStory }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundStory, setFoundStory] = useState<StoryHub | null>(null);
  const [foundArticles, setFoundArticles] = useState<NewsItem[]>([]);
  const [activeStep, setActiveStep] = useState<'latest' | 'timeline' | 'changed' | 'sources'>('latest');

  const popularSearches = [
    'Tech Antitrust',
    'India Semiconductor',
    'Artemis Moon Landing',
    'Ocean Climate Treaty',
    'AI Safety Accord',
    'Olympic Dispute',
  ];

  const handleSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setFoundStory(null);
    setFoundArticles([]);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) throw new Error('Search failed');

      const data = await res.json();

      if (data.stories && data.stories.length > 0) {
        setFoundStory(data.stories[0]);
        setFoundArticles(data.articles || data.stories[0].articles || []);
      } else if (data.articles && data.articles.length > 0) {
        setFoundArticles(data.articles);
      } else {
        setError(data.message || `No results found for "${q}". Try one of the suggested topics below.`);
      }
    } catch (e: any) {
      setError(e.message || 'Error executing search');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#20130d]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-4xl bg-[#faf4ea] border-2 border-[#d6c4ae] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#24140d] font-serif"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-6 bg-[#f3e9db] border-b-2 border-[#d6c4ae]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <img src="/serpnews_logo.jpg" alt="SERP NEWS" className="w-5 h-5 rounded object-cover border border-[#881326]/40" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#881326] flex items-center gap-1.5 font-serif">
                <span>SerpNews Intelligence Archive</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#ede2d2] hover:bg-[#e4d6c4] text-[#5c473b] hover:text-[#881326] transition cursor-pointer border border-[#d8c7b3]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8f776a]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics, people, events, countries, companies..."
              className="w-full bg-[#fffdfa] border border-[#d8c7b3] rounded-xl pl-12 pr-28 py-3 text-sm text-[#2b1713] placeholder-[#9e887a] focus:outline-none focus:border-[#881326] shadow-inner"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-[#881326] hover:bg-[#6b0f1a] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[#715c50] shrink-0 font-medium">Quick Topics:</span>
            {popularSearches.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setQuery(tag);
                  handleSearch(tag);
                }}
                className="px-2.5 py-1 rounded-full bg-[#eee3d4] hover:bg-[#881326] hover:text-white text-[#4a342a] transition cursor-pointer shrink-0 border border-[#dfd0bd]"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#881326] mx-auto" />
              <div className="font-bold text-[#2d1b15] font-serif">Retrieving News via SerpAPI & Synthesizing Story...</div>
              <p className="text-xs text-[#715c50] max-w-sm mx-auto">
                Analyzing recent wire coverage, generating chronological milestones, and assessing verification claims.
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-[#fee2e2]/60 border border-[#fca5a5] text-[#991b1b] text-xs">
              {error}
            </div>
          )}

          {!loading && !error && !foundStory && foundArticles.length === 0 && (
            <div className="py-12 text-center text-[#715c50] space-y-2">
              <Search className="w-10 h-10 mx-auto text-[#bcaaa0] mb-2" />
              <h4 className="text-sm font-bold text-[#2b1713] font-serif">Discover How News Unfolded Over Time</h4>
              <p className="text-xs max-w-md mx-auto">
                Enter any current affairs topic. Instead of an unorganized list of links, SerpNews will structure the results into:
              </p>
              <div className="flex items-center justify-center gap-2 pt-2 text-xs font-bold text-[#881326]">
                <span>Latest</span>
                <span>→</span>
                <span>Timeline</span>
                <span>→</span>
                <span>How It Changed</span>
                <span>→</span>
                <span>Sources</span>
              </div>
            </div>
          )}

          {/* FOUND STORY */}
          {!loading && foundStory && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-xl bg-[#f5ede2] border border-[#e2d5c3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#881326] text-white">
                      {foundStory.category}
                    </span>
                    <span className="text-xs font-semibold text-[#523e35]">
                      {foundStory.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#2b1713] leading-snug font-serif">
                    {foundStory.title}
                  </h3>
                  <p className="text-xs text-[#695449] mt-0.5">
                    {foundStory.subtitle}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenStory(foundStory);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#881326] hover:bg-[#6b0f1a] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-[#881326]/20"
                >
                  <Layers className="w-4 h-4" />
                  <span>Open Full Story Hub</span>
                </button>
              </div>

              {/* 4-Step Navigation Tabs */}
              <div className="grid grid-cols-4 bg-[#eee4d5] p-1 rounded-xl border border-[#ddcfbd] text-xs text-center font-bold">
                <button
                  onClick={() => setActiveStep('latest')}
                  className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeStep === 'latest'
                      ? 'bg-[#881326] text-white shadow-xs'
                      : 'text-[#715c50] hover:text-[#2b1713]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>1. Latest</span>
                </button>

                <button
                  onClick={() => setActiveStep('timeline')}
                  className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeStep === 'timeline'
                      ? 'bg-[#881326] text-white shadow-xs'
                      : 'text-[#715c50] hover:text-[#2b1713]'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>2. Timeline</span>
                </button>

                <button
                  onClick={() => setActiveStep('changed')}
                  className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeStep === 'changed'
                      ? 'bg-[#881326] text-white shadow-xs'
                      : 'text-[#715c50] hover:text-[#2b1713]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>3. How It Changed</span>
                </button>

                <button
                  onClick={() => setActiveStep('sources')}
                  className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeStep === 'sources'
                      ? 'bg-[#881326] text-white shadow-xs'
                      : 'text-[#715c50] hover:text-[#2b1713]'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>4. Sources</span>
                </button>
              </div>

              {/* STEP 1: LATEST */}
              {activeStep === 'latest' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#fffdfa] border border-[#e2d5c3]">
                      <span className="font-bold text-[#881326] block mb-1">What Happened</span>
                      <p className="text-[#422e25] leading-relaxed">{foundStory.quickBrief.whatHappened}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#fffdfa] border border-[#e2d5c3]">
                      <span className="font-bold text-[#b45309] block mb-1">Why It Matters</span>
                      <p className="text-[#422e25] leading-relaxed">{foundStory.quickBrief.whyItMatters}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#fffdfa] border border-[#e2d5c3]">
                      <span className="font-bold text-[#166534] block mb-1">What's Next</span>
                      <p className="text-[#422e25] leading-relaxed">{foundStory.quickBrief.whatsNext}</p>
                    </div>
                  </div>

                  {foundStory.timeline[foundStory.timeline.length - 1] && (
                    <div className="p-4 rounded-xl bg-[#881326]/8 border border-[#881326]/20 text-xs">
                      <div className="font-bold text-[#881326] mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Most Recent Milestone ({foundStory.timeline[foundStory.timeline.length - 1].date})</span>
                      </div>
                      <h4 className="font-bold text-[#2b1713] text-sm mb-1 font-serif">
                        {foundStory.timeline[foundStory.timeline.length - 1].title}
                      </h4>
                      <p className="text-[#422e25]">
                        {foundStory.timeline[foundStory.timeline.length - 1].event}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: TIMELINE */}
              {activeStep === 'timeline' && (
                <div className="space-y-3">
                  <div className="relative pl-6 border-l-2 border-[#881326]/30 space-y-4 ml-2">
                    {foundStory.timeline.map((node, i) => (
                      <div key={node.id || i} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#881326] border-2 border-[#fbf8f3]"></div>
                        <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#e2d5c3] text-xs">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono font-bold text-[#881326]">{node.date}</span>
                            <span className="px-2 py-0.5 rounded bg-[#eee3d4] text-[#422e25] text-[10px] font-bold uppercase">
                              {node.phase}
                            </span>
                          </div>
                          <h5 className="font-bold text-[#2b1713] text-sm mb-1 font-serif">{node.title}</h5>
                          <p className="text-[#422e25]">{node.event}</p>
                          <p className="text-[11px] text-[#881326] mt-1.5 bg-[#881326]/8 p-2 rounded border border-[#881326]/15">
                            {node.aiExplanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: HOW IT CHANGED */}
              {activeStep === 'changed' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#e8ceb5]">
                      <span className="font-bold text-[#b45309] block mb-1">Initially Reported</span>
                      <p className="text-[#422e25]">{foundStory.howItChanged.initiallyReported}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#bbf7d0]">
                      <span className="font-bold text-[#166534] block mb-1">Later Confirmed</span>
                      <p className="text-[#422e25]">{foundStory.howItChanged.laterConfirmed}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#e2d5c3]">
                    <span className="font-bold text-[#881326] block mb-1 font-serif">Evolution of Understanding</span>
                    <p className="text-[#422e25]">{foundStory.howItChanged.whatChanged}</p>
                  </div>

                  {foundStory.howItChanged.evolutionItems.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <span className="font-bold text-[#2b1713] block font-serif">Milestone Status Verification:</span>
                      {foundStory.howItChanged.evolutionItems.map((e) => (
                        <div key={e.id} className="p-3 rounded-lg bg-[#fffdfa] border border-[#e2d5c3] flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-[#2b1713] font-serif">{e.headlineEvolution}</span>
                            <span className="text-[#715c50] block text-[11px]">{e.details}</span>
                          </div>
                          <VerificationBadge status={e.classification} size="sm" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: SOURCES */}
              {activeStep === 'sources' && (
                <div className="space-y-3 text-xs">
                  <div className="text-[#715c50]">
                    Underlying reports retrieved and indexed for this investigation:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {foundArticles.map((art) => (
                      <div key={art.id} className="p-3 rounded-xl bg-[#fffdfa] border border-[#e2d5c3] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-[#881326]">{getSourceName(art?.source)}</span>
                            <VerificationBadge status={art.verificationStatus} size="sm" />
                          </div>
                          <h6 className="font-bold text-[#2b1713] text-xs mb-1 line-clamp-2 font-serif">{art.headline}</h6>
                        </div>
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#881326] hover:text-[#6b0f1a] text-[11px] font-bold mt-2"
                        >
                          <span>Visit Publisher Article</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* If only individual articles matched without a story */}
          {!loading && !foundStory && foundArticles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#2b1713] font-serif">Matching News Articles ({foundArticles.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {foundArticles.map((art) => (
                  <div key={art.id} className="p-3.5 rounded-xl bg-[#fffdfa] border border-[#e2d5c3] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-[#881326]">{getSourceName(art?.source)}</span>
                        <VerificationBadge status={art.verificationStatus} size="sm" />
                      </div>
                      <h5 className="font-bold text-[#2b1713] text-xs mb-1 font-serif">{art.headline}</h5>
                      <p className="text-[#695449] line-clamp-2">{art.snippet}</p>
                    </div>
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#881326] hover:text-[#6b0f1a] text-[11px] font-bold mt-2"
                    >
                      <span>Read Original</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
