import React from 'react';
import { ExternalLink, Layers, Clock, Globe } from 'lucide-react';
import type { NewsItem } from '../types/news.js';
import { VerificationBadge } from './VerificationBadge.js';
import { getSourceName } from '../utils/source.js';

interface Props {
  article: NewsItem;
  onOpenStoryById?: (storyId: string) => void;
  storyTitle?: string;
}

export const NewsCard: React.FC<Props> = ({ article, onOpenStoryById, storyTitle }) => {
  return (
    <div className="paper-card rounded-xl p-4 transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5">
      <div>
        {/* Header: Source, Date, Category & Verification Badge */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold text-xs text-[#881326] font-serif">
              <Globe className="w-3.5 h-3.5 text-[#9e887a]" />
              {getSourceName(article?.source)}
            </span>
            <span className="text-[#c7b7a6] text-xs">•</span>
            <span className="text-[11px] text-[#715c50] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#9e887a]" />
              {article.publishedAt.includes('T')
                ? new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : article.publishedAt}
            </span>
          </div>

          <VerificationBadge 
            status={article.verificationStatus} 
            reason={article.statusReason} 
            size="sm" 
          />
        </div>

        {/* Category, Live Badge & Headline */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[#ede2d2] text-[#6b0f1a] border border-[#d8c7b2]">
              {article.category}
            </span>
            {(article.id.startsWith('serp_') || article.fetchedAt) && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#881326]/12 text-[#881326] border border-[#881326]/25">
                <span className="w-1.5 h-1.5 rounded-full bg-[#881326]"></span>
                Live SerpAPI Wire
              </span>
            )}
          </div>
          <h4 className="text-sm sm:text-[15px] font-bold text-[#20130d] hover:text-[#881326] transition-colors leading-snug font-headline">
            {article.headline}
          </h4>
        </div>

        {/* 2-4 Line AI Summary */}
        <div className="bg-[#f2e7d7]/85 rounded-lg p-2.5 border border-[#ddcdb8] my-2">
          <div className="text-[10px] font-bold text-[#881326] mb-1 flex items-center gap-1 font-serif uppercase tracking-wider">
            <span className="w-1 h-1 rounded-full bg-[#881326]"></span>
            <span>Intelligence Dispatch</span>
          </div>
          <p className="text-xs text-[#453026] leading-relaxed font-serif">
            {article.aiSummary}
          </p>
        </div>
      </div>

      {/* Footer: Original Source Link & Associated Story Hub */}
      <div className="mt-3 pt-2.5 border-t border-[#e8dccb] flex items-center justify-between gap-2 text-xs">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#786154] hover:text-[#881326] transition font-medium"
          title="Open original article source"
        >
          <span>Original Report</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {article.storyId && onOpenStoryById && (
          <button
            onClick={() => onOpenStoryById(article.storyId!)}
            className="inline-flex items-center gap-1 text-[#881326] hover:text-[#6b0f1a] font-bold cursor-pointer"
            title={storyTitle ? `View Story: ${storyTitle}` : "View full Story Hub & Timeline"}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Story Hub →</span>
          </button>
        )}
      </div>
    </div>
  );
};
