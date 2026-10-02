import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Flame, 
  Compass, 
  ShieldCheck, 
  RefreshCw, 
  Radio, 
  Globe, 
  ArrowRight
} from 'lucide-react';
import type { StoryHub, NewsItem, Category, ServerStatus } from './types/news.js';
import { Header } from './components/Header.js';
import { TrendingTicker } from './components/TrendingTicker.js';
import { CategoryNav } from './components/CategoryNav.js';
import { StoryCard } from './components/StoryCard.js';
import { NewsCard } from './components/NewsCard.js';
import { StoryHubModal } from './components/StoryHubModal.js';
import { SearchModal } from './components/SearchModal.js';

export default function App() {
  const [stories, setStories] = useState<StoryHub[]>([]);
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [selectedStory, setSelectedStory] = useState<StoryHub | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [teaMode, setTeaMode] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'stories' | 'articles'>('stories');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const categories: Category[] = [
    'All',
    'Trending',
    'World',
    'Politics',
    'Technology',
    'Business',
    'Science',
    'Sports',
    'Entertainment',
    'India',
  ];

  // Fetch status, stories, and articles
  const loadData = async (cat: Category = activeCategory) => {
    try {
      setLoading(true);
      const [statusRes, storiesRes, articlesRes] = await Promise.all([
        fetch('/api/status'),
        fetch(`/api/stories?category=${encodeURIComponent(cat)}`),
        fetch(`/api/articles?category=${encodeURIComponent(cat)}`),
      ]);

      if (statusRes.ok) {
        const s = await statusRes.json();
        setStatus(s);
      }

      if (storiesRes.ok) {
        const d = await storiesRes.json();
        setStories(d.stories || []);
      }

      if (articlesRes.ok) {
        const a = await articlesRes.json();
        setArticles(a.articles || []);
      }
    } catch (err) {
      console.error('Failed to load news intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeCategory);
  }, [activeCategory]);

  // Sync with SerpAPI on demand
  const handleSyncSerpApi = async () => {
    setIsSyncing(true);
    setNotification('Fetching latest news from SerpAPI & analyzing with Gemini...');
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeCategory }),
      });
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
      }
      await loadData(activeCategory);
      if (data.added > 0 || data.updated > 0) {
        setNotification(`SerpAPI sync complete! Ingested ${data.added} new reports.`);
      } else {
        setNotification('SerpAPI checked: stories are up-to-date with latest wire reports.');
      }
    } catch (e: any) {
      setNotification('Sync failed. Using cached intelligence.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Regenerate Gen-Z Tea with Gemini
  const handleRegenerateTea = async (storyId: string) => {
    try {
      const res = await fetch(`/api/stories/${storyId}/tea`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.teaMode) {
          setStories(prev => prev.map(s => s.id === storyId ? { ...s, teaMode: data.teaMode } : s));
          if (selectedStory && selectedStory.id === storyId) {
            setSelectedStory(prev => prev ? { ...prev, teaMode: data.teaMode } : null);
          }
        }
      }
    } catch (err) {
      console.error('Error regenerating tea:', err);
    }
  };

  const handleOpenStoryById = (storyId: string) => {
    const s = stories.find(item => item.id === storyId);
    if (s) {
      setSelectedStory(s);
    } else {
      fetch(`/api/stories/${storyId}`)
        .then(r => r.json())
        .then(d => {
          if (d.story) setSelectedStory(d.story);
        })
        .catch(console.error);
    }
  };

  const featuredStory = stories.find(s => s.isTrending) || stories[0];

  return (
    <div className="min-h-screen text-[#22120b] flex flex-col font-serif selection:bg-[#881326] selection:text-white">
      
      {/* Global Header */}
      <Header
        teaMode={teaMode}
        onToggleTeaMode={setTeaMode}
        onOpenSearch={() => setIsSearchOpen(true)}
        status={status}
        onSync={handleSyncSerpApi}
        isSyncing={isSyncing}
        viewTab={viewTab}
        onChangeViewTab={setViewTab}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="bg-[#881326] text-white text-xs font-semibold py-2 px-4 text-center transition-all animate-pulse">
          {notification}
        </div>
      )}

      {/* Trending Now Banner */}
      <TrendingTicker 
        stories={stories} 
        onSelectStory={(s) => setSelectedStory(s)} 
      />

      {/* Category Navigation Pills */}
      <CategoryNav
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        categories={categories}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-7">
        
        {/* Newspaper Masthead Hero Banner */}
        <div className="paper-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-[#d6c5af]">
          <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto">
            <img 
              src="/serpnews_logo.jpg" 
              alt="SERP NEWS - Discover How News Unfolded Over Time" 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-[#881326]/40 shadow-md shrink-0 object-cover" 
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#881326] tracking-wider font-masthead leading-none">
                  SERP NEWS
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#881326]/12 text-[#881326] border border-[#881326]/30">
                  Edition 2026
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-[#881326] font-serif mt-1">
                Discover How News Unfolded Over Time
              </p>
              <p className="text-[11px] text-[#634e42] font-serif mt-0.5 line-clamp-1">
                Real-time SerpAPI wire ingest • Clustered developing story hubs • Chronological evolution ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#dccbb7]">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#ede3d4] hover:bg-[#e4d7c5] text-[#2c1810] text-xs font-bold transition cursor-pointer border border-[#d8c7b3] flex items-center gap-1.5"
            >
              <span>Explore Archive</span>
            </button>
            <button
              onClick={handleSyncSerpApi}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-[#881326] hover:bg-[#6b0f1a] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#881326]/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Live Wire'}</span>
            </button>
          </div>
        </div>

        {/* Featured Developing Story Hero Card */}
        {viewTab === 'stories' && featuredStory && activeCategory === 'All' && (
          <div className="relative overflow-hidden rounded-3xl bg-[#fdf9f2]/92 backdrop-blur-md border-2 border-[#d6c4ae] p-6 sm:p-8 shadow-xl shadow-[#881326]/5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#881326]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#881326] text-white flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-200" />
                  <span>Lead Developing Affair</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ede0ce] text-[#69111c] border border-[#d8c3ad]">
                  {featuredStory.category}
                </span>
                <span className="text-xs text-[#715c50]">
                  {featuredStory.timeline.length} Milestones Tracked
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1f120c] tracking-tight leading-tight mb-3 font-headline">
                {featuredStory.title}
              </h1>

              <p className="text-sm sm:text-base text-[#4a342b] leading-relaxed mb-6 font-serif">
                {teaMode 
                  ? `"${featuredStory.teaMode?.hook || featuredStory.quickBrief.whatHappened}" ${featuredStory.teaMode?.whatHappened || ''}`
                  : featuredStory.quickBrief.whatHappened}
              </p>

              {/* Progress Milestones Bar */}
              <div className="p-3.5 rounded-2xl bg-[#f7f0e4] border border-[#dccbb7] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#422e25]">
                  <span className="w-2 h-2 rounded-full bg-[#881326] animate-pulse"></span>
                  <span className="font-bold text-[#2d1b15]">Current Phase:</span>
                  <span className="text-[#881326] font-bold">{featuredStory.status}</span>
                </div>
                <div className="flex items-center gap-2 text-[#715c50]">
                  <span>Started: {new Date(featuredStory.startedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  <span>•</span>
                  <span className="text-[#166534] font-bold">
                    {featuredStory.howItChanged.evolutionItems.filter(e => e.classification === 'verified').length} Verified Updates
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setSelectedStory(featuredStory)}
                  className="px-5 py-2.5 rounded-xl bg-[#881326] hover:bg-[#6b0f1a] text-white font-bold text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#881326]/20 font-serif"
                >
                  <Layers className="w-4 h-4" />
                  <span>Explore Interactive Timeline & Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setTeaMode(!teaMode)}
                  className="px-4 py-2.5 rounded-xl bg-[#ede3d4] hover:bg-[#e4d7c5] text-[#36241c] font-bold text-xs transition cursor-pointer flex items-center gap-2 border border-[#d8c7b3] font-serif"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#881326]" />
                  <span>{teaMode ? 'Switch to Standard' : 'Read as News Tea 🍵'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Heading & Controls */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1f120c] tracking-tight flex items-center gap-2 font-headline">
              {viewTab === 'stories' ? (
                <>
                  <Radio className="w-5 h-5 text-[#881326]" />
                  <span>Developing Story Hubs</span>
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5 text-[#881326]" />
                  <span>Live News Wire (SerpAPI Ingested)</span>
                </>
              )}
            </h2>
            <p className="text-xs text-[#715c50] mt-0.5">
              {viewTab === 'stories' 
                ? 'Chronological narratives clustered from multiple sources over time.'
                : 'Individual articles with 2-4 line AI summaries and verification transparency.'}
            </p>
          </div>

          <div className="text-xs text-[#715c50] hidden sm:block font-medium">
            Category: <span className="text-[#881326] font-bold">{activeCategory}</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#881326] mx-auto" />
            <div className="text-sm font-bold text-[#2d1b15] font-serif">Loading SerpNews Intelligence...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && viewTab === 'stories' && stories.length === 0 && (
          <div className="p-8 rounded-2xl bg-[#fffdfa] border border-[#e2d5c3] text-center space-y-3">
            <Compass className="w-8 h-8 text-[#9e887a] mx-auto" />
            <h4 className="text-base font-bold text-[#2d1b15] font-serif">No Story Hubs for {activeCategory} yet</h4>
            <p className="text-xs text-[#715c50] max-w-sm mx-auto">
              Click 'Sync SerpAPI' in the top right to retrieve recent coverage and automatically cluster reports into a story hub.
            </p>
            <button
              onClick={handleSyncSerpApi}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-[#881326] hover:bg-[#6b0f1a] text-white font-bold text-xs transition cursor-pointer"
            >
              Fetch from SerpAPI Now
            </button>
          </div>
        )}

        {/* STORIES GRID */}
        {!loading && viewTab === 'stories' && stories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                teaMode={teaMode}
                onOpenStory={(s) => setSelectedStory(s)}
              />
            ))}
          </div>
        )}

        {/* ARTICLES WIRE GRID */}
        {!loading && viewTab === 'articles' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => {
              const matchedStory = stories.find(s => s.id === article.storyId);
              return (
                <NewsCard
                  key={article.id}
                  article={article}
                  storyTitle={matchedStory?.title}
                  onOpenStoryById={handleOpenStoryById}
                />
              );
            })}
          </div>
        )}

        {/* Transparency & Fact-Checking Constitution Banner */}
        <div className="mt-12 p-5 rounded-2xl bg-[#f5ede2] border border-[#e2d5c3] text-xs text-[#614b40] space-y-3">
          <div className="flex items-center gap-2 text-[#2d1b15] font-bold text-sm font-serif">
            <ShieldCheck className="w-4 h-4 text-[#881326]" />
            <span>SerpNews Factual Transparency Standards</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[11px] leading-relaxed">
            <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#e2d5c3]">
              <strong className="text-[#166534] block mb-1">Primary Wire Origin</strong>
              News articles are retrieved via SerpAPI from verified publishers. Original publication links are always preserved.
            </div>

            <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#e2d5c3]">
              <strong className="text-[#881326] block mb-1">No AI Fabrication</strong>
              AI is restricted to summarization, chronological sorting, and linguistic translation (News Tea). Facts are never invented.
            </div>

            <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#e2d5c3]">
              <strong className="text-[#5b21b6] block mb-1">Dispute Transparency</strong>
              When major outlets report conflicting casualty figures or dates, we present both side-by-side rather than picking one.
            </div>

            <div className="p-3 rounded-xl bg-[#fffdfa] border border-[#e2d5c3]">
              <strong className="text-[#b45309] block mb-1">Temporal Evolution</strong>
              We track retractions and revisions so readers understand how the truth came to light over days, months, and years.
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#d6c5af] bg-[#f3e9dc]/90 py-6 text-xs text-[#6e584c] text-center font-serif">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/serpnews_logo.jpg" 
              alt="SERP NEWS" 
              className="w-8 h-8 rounded-lg border border-[#881326]/40 object-cover" 
            />
            <div className="text-left">
              <span className="font-extrabold text-[#881326] font-masthead text-sm">SERP NEWS</span>
              <p className="text-[10px] uppercase tracking-wider text-[#881326]/80 font-bold">Discover How News Unfolded Over Time</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#715c50]">
            <span>SerpAPI Real-Time Wire</span>
            <span>•</span>
            <span>Working live</span>
            <span>•</span>
            <span>Factual News Tea 🍵</span>
          </div>
        </div>
      </footer>

      {/* Story Hub Modal */}
      {selectedStory && (
        <StoryHubModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          globalTeaMode={teaMode}
          onRegenerateTea={handleRegenerateTea}
        />
      )}

      {/* Search & Explore Modal */}
      {isSearchOpen && (
        <SearchModal
          onClose={() => setIsSearchOpen(false)}
          onOpenStory={(s) => {
            setIsSearchOpen(false);
            setSelectedStory(s);
          }}
        />
      )}

    </div>
  );
}
