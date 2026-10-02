import React from 'react';
import { Clock, ArrowRight, GitCommit, Sparkles, ShieldCheck } from 'lucide-react';
import type { StoryHub } from '../types/news.js';

interface Props {
  story: StoryHub;
  teaMode: boolean;
  onOpenStory: (story: StoryHub) => void;
}

export const StoryCard: React.FC<Props> = ({ story, teaMode, onOpenStory }) => {
  const latestTimeline = story.timeline[story.timeline.length - 1];

  const statusStyles: Record<string, string> = {
    hearing: 'bg-[#5b21b6]/10 text-[#5b21b6] border-[#5b21b6]/25',
    breakthrough: 'bg-[#166534]/10 text-[#166534] border-[#166534]/25',
    negotiation: 'bg-[#881326]/10 text-[#881326] border-[#881326]/25',
    monitoring: 'bg-[#9a3412]/10 text-[#9a3412] border-[#9a3412]/25',
    developing: 'bg-[#881326]/12 text-[#881326] border-[#881326]/30',
    investigation: 'bg-[#991b1b]/10 text-[#991b1b] border-[#991b1b]/25',
  };

  const statusClass = statusStyles[story.statusType] || 'bg-[#eee5d6] text-[#4a342c] border-[#ddcfbd]';

  return (
    <div 
      onClick={() => onOpenStory(story)}
      className="group relative paper-card rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-0.5"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-[#ede2d2] text-[#6b0f1a] border border-[#d8c7b2]">
              {story.category}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusClass}`}>
              {story.status}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#7d685c]">
            <Clock className="w-3 h-3 text-[#998375]" />
            <span>Updated {new Date(story.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#20130d] group-hover:text-[#881326] transition-colors line-clamp-2 leading-snug font-headline">
          {story.title}
        </h3>

        {/* Subtitle */}
        <p className="text-xs text-[#5e4b41] mt-1 line-clamp-2 leading-relaxed">
          {story.subtitle}
        </p>

        {/* Briefing Box: Normal Executive Brief vs News Tea */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#f2e7d7]/90 border border-[#ddcdb8] transition-all">
          {teaMode ? (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#881326] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Tea 👀</span>
              </div>
              <p className="text-xs text-[#3b241c] leading-relaxed italic">
                "{story.teaMode?.hook || story.quickBrief.whatHappened}"
              </p>
              <p className="text-xs text-[#5c463b] mt-1.5 line-clamp-2">
                {story.teaMode?.whatHappened}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#881326] mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#881326]"></span>
                <span className="font-serif font-bold">SerpNews AI Brief</span>
              </div>
              <p className="text-xs text-[#3d2922] leading-relaxed line-clamp-3">
                {story.quickBrief.whatHappened}
              </p>
            </div>
          )}
        </div>

        {/* Timeline Stepper Mini Preview */}
        <div className="mt-4 pt-3 border-t border-[#e8dccb]">
          <div className="flex items-center justify-between text-[11px] text-[#695449] mb-2 font-medium">
            <span className="flex items-center gap-1">
              <GitCommit className="w-3.5 h-3.5 text-[#881326]" />
              <span className="font-semibold">Timeline Progress ({story.timeline.length} Milestones)</span>
            </span>
            <span className="text-[#881326] text-[10px] font-bold">Interactive</span>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between relative px-1">
            <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-[#dfd0bd] -translate-y-1/2 -z-0"></div>
            {story.timeline.slice(0, 5).map((node, i) => (
              <div 
                key={node.id} 
                className="relative z-10 flex flex-col items-center group/node"
                title={`${node.date}: ${node.title}`}
              >
                <div className={`w-3 h-3 rounded-full border-2 transition-transform duration-200 group-hover/node:scale-125 ${
                  i === story.timeline.length - 1
                    ? 'bg-[#881326] border-[#fbf8f3] shadow-md shadow-[#881326]/40'
                    : 'bg-[#e0d3c0] border-[#bdaaa0]'
                }`}></div>
                <span className="text-[9px] text-[#715c50] mt-1 max-w-[45px] text-center truncate">
                  {node.date.split(',')[0]}
                </span>
              </div>
            ))}
          </div>

          {latestTimeline && (
            <div className="mt-2.5 p-2 rounded-lg bg-[#881326]/8 border border-[#881326]/20 text-[11px] text-[#422d25] flex items-start gap-1.5">
              <span className="px-1.5 py-0.2 rounded bg-[#881326] text-white font-bold text-[9px] uppercase tracking-wider shrink-0 mt-0.5">
                Latest
              </span>
              <span className="line-clamp-1 font-medium">{latestTimeline.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-4 pt-3 border-t border-[#e8dccb] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-[#695449]">
          <span className="flex items-center gap-1 text-[#166534] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            {story.howItChanged.evolutionItems.filter(e => e.classification === 'verified').length} Verified
          </span>
          {story.howItChanged.conflictingReports.length > 0 && (
            <span className="text-[#881326] text-[10px] font-semibold">
              • {story.howItChanged.conflictingReports.length} Disputed
            </span>
          )}
        </div>

        <button
          className="inline-flex items-center gap-1 text-xs font-bold text-[#881326] group-hover:text-[#6b0f1a] group-hover:translate-x-0.5 transition-transform"
        >
          <span>Story Hub</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
