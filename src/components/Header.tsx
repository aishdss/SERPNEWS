import React from 'react';
import { Newspaper, Sparkles, Search, RefreshCw, Radio, Globe } from 'lucide-react';
import type { ServerStatus } from '../types/news.js';

interface Props {
  teaMode: boolean;
  onToggleTeaMode: (val: boolean) => void;
  onOpenSearch: () => void;
  status: ServerStatus | null;
  onSync: () => void;
  isSyncing: boolean;
  viewTab: 'stories' | 'articles';
  onChangeViewTab: (tab: 'stories' | 'articles') => void;
}

export const Header: React.FC<Props> = ({
  teaMode,
  onToggleTeaMode,
  onOpenSearch,
  status,
  onSync,
  isSyncing,
  viewTab,
  onChangeViewTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#f7f1e4]/92 backdrop-blur-md border-b-2 border-[#d6c5af] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Newspaper Masthead Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-[#881326]/40 shadow-xs shrink-0 bg-[#ede4d4]">
              <img 
                src="/serpnews_logo.jpg" 
                alt="SERP NEWS" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-wide text-[#881326] font-masthead flex items-center gap-1">
                  SERP NEWS
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#881326]/10 border border-[#881326]/20 text-[10px] font-semibold text-[#881326]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#881326] animate-ping"></span>
                  SerpAPI Active
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] tracking-wider uppercase text-[#881326]/85 font-serif font-bold hidden sm:block">
                Discover How News Unfolded Over Time
              </p>
            </div>
          </div>

          {/* Search Trigger Button */}
          <button
            onClick={onOpenSearch}
            className="flex-1 max-w-md hidden md:flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#eee5d6] border border-[#ddcfbd] hover:border-[#881326]/40 text-[#6d574c] hover:text-[#3b1219] transition text-sm cursor-pointer shadow-inner group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-[#8a7366] group-hover:text-[#881326] transition" />
              <span className="text-xs text-[#6d574c] group-hover:text-[#3b1219]">
                Search topics, people, events, companies...
              </span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#786154] bg-[#fbf8f3] border border-[#ddcfbd] rounded shadow-xs">
              Explore
            </kbd>
          </button>

          {/* Right Controls: Tea Mode Toggle & Sync */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Mobile Search Button */}
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 rounded-lg bg-[#eee5d6] border border-[#ddcfbd] text-[#786154] hover:text-[#3b1219]"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* News Tea Mode Switcher */}
            <div className="flex items-center bg-[#eee5d6] p-0.5 rounded-xl border border-[#ddcfbd] shadow-inner">
              <button
                onClick={() => onToggleTeaMode(false)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  !teaMode
                    ? 'bg-[#fbf8f3] text-[#3b1219] shadow-xs font-semibold border border-[#ddcfbd]'
                    : 'text-[#786154] hover:text-[#3b1219]'
                }`}
                title="Normal Executive Briefing"
              >
                <span>Standard</span>
              </button>
              <button
                onClick={() => onToggleTeaMode(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  teaMode
                    ? 'bg-gradient-to-r from-[#881326] to-[#b91c1c] text-white shadow-md shadow-[#881326]/30'
                    : 'text-[#881326] hover:text-[#6b0f1a]'
                }`}
                title="News Tea — Gen Z Mode (100% facts, engaging tea format)"
              >
                <span>News Tea 🍵</span>
                {teaMode && <Sparkles className="w-3 h-3 text-amber-200 animate-pulse" />}
              </button>
            </div>

            {/* SerpAPI Sync & Status */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#eee5d6] hover:bg-[#e4d8c5] border border-[#ddcfbd] text-[#4a2e2b] text-xs font-medium transition cursor-pointer disabled:opacity-50"
              title={status?.serpApiConfigured ? "Connected to SerpAPI: Click to fetch live updates" : "SerpAPI Key configured in backend: Click to sync"}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#881326] ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline font-semibold">
                {isSyncing ? 'Syncing...' : 'Sync SerpAPI'}
              </span>
            </button>
          </div>

        </div>

        {/* View Switcher Sub-bar: Developing Stories vs Individual Articles Wire */}
        <div className="mt-3 flex items-center justify-between border-t border-[#e6dac8] pt-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeViewTab('stories')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'stories'
                  ? 'bg-[#881326]/12 text-[#6b0f1a] border border-[#881326]/30 font-bold'
                  : 'text-[#786154] hover:text-[#3b1219]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Developing Stories ({status?.totalStories || 0})</span>
            </button>

            <button
              onClick={() => onChangeViewTab('articles')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'articles'
                  ? 'bg-[#881326]/12 text-[#6b0f1a] border border-[#881326]/30 font-bold'
                  : 'text-[#786154] hover:text-[#3b1219]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All News Wire ({status?.totalArticles || 0})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#786154]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#881326]"></span>
              {status?.serpApiConfigured ? 'SerpAPI Live' : 'SerpAPI Configured'}
            </span>
            <span>•</span>
            <span>BREAKING NEWS</span>
          </div>
        </div>

      </div>
    </header>
  );
};
