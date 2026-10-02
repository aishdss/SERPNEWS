import React from 'react';
import { Flame, ArrowUpRight } from 'lucide-react';
import type { StoryHub } from '../types/news.js';

interface Props {
  stories: StoryHub[];
  onSelectStory: (story: StoryHub) => void;
}

export const TrendingTicker: React.FC<Props> = ({ stories, onSelectStory }) => {
  const trending = stories.filter(s => s.isTrending);

  if (trending.length === 0) return null;

  return (
    <div className="bg-[#f3e8da]/90 backdrop-blur-xs border-y-2 border-[#d6c5af] py-2 overflow-hidden font-serif">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#881326] text-white text-xs font-bold shrink-0 uppercase tracking-widest font-serif shadow-xs">
          <Flame className="w-3.5 h-3.5 text-amber-200 animate-bounce" />
          <span>Trending Dispatch</span>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap text-xs text-[#523e35]">
          {trending.map((story, i) => (
            <button
              key={story.id}
              onClick={() => onSelectStory(story)}
              className="flex items-center gap-2 hover:text-[#881326] transition cursor-pointer group py-0.5"
            >
              <span className="font-bold text-[#881326] group-hover:text-[#6b0f1a]">
                §{i + 1}
              </span>
              <span className="font-bold text-[#20130d] group-hover:text-[#881326] max-w-[280px] sm:max-w-md truncate font-headline">
                {story.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e8dcce] text-[#6b5245] border border-[#d4c3b1]">
                {story.status}
              </span>
              <ArrowUpRight className="w-3 h-3 text-[#a0897b] group-hover:text-[#881326] opacity-70 group-hover:opacity-100 transition" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
