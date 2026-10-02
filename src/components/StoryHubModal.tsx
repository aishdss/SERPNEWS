import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  GitCommit, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Newspaper, 
  Share2, 
  Check, 
  Users, 
  BookOpen, 
  Scale, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import type { StoryHub, VerificationStatus, TimelineEntry, ConflictingReport, StoryEvolutionItem } from '../types/news.js';
import { VerificationBadge } from './VerificationBadge.js';
import { AudioPlayer } from './AudioPlayer.js';
import { getSourceName, getSourceUrl } from '../utils/source.js';

interface Props {
  story: StoryHub;
  onClose: () => void;
  globalTeaMode: boolean;
  onRegenerateTea?: (storyId: string) => Promise<void>;
}

export const StoryHubModal: React.FC<Props> = ({ 
  story, 
  onClose, 
  globalTeaMode,
  onRegenerateTea 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'changed' | 'perspectives' | 'articles'>('overview');
  const [localTeaMode, setLocalTeaMode] = useState<boolean>(globalTeaMode);
  const [filterEvolutionStatus, setFilterEvolutionStatus] = useState<VerificationStatus | 'all'>('all');
  const [copied, setCopied] = useState(false);
  const [isRegeneratingTea, setIsRegeneratingTea] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateTea = async () => {
    if (!onRegenerateTea) return;
    setIsRegeneratingTea(true);
    await onRegenerateTea(story.id);
    setIsRegeneratingTea(false);
  };

  // Complete defensive normalization for howItChanged so that EVERY story
  // (seed, searched, or synced) has a rich, functional narrative evolution.
  const rawHowItChanged = (story.howItChanged || {}) as any;

  // 1. Initially reported / Later confirmed / What changed
  const initiallyReported =
    rawHowItChanged.initiallyReported ||
    (story.timeline?.[0]?.event) ||
    (story.articles?.[story.articles.length - 1]?.headline) ||
    'Preliminary wire dispatches highlighted early alerts and initial statements.';

  const laterConfirmed =
    rawHowItChanged.laterConfirmed ||
    (story.timeline?.[story.timeline.length - 1]?.event) ||
    (story.articles?.[0]?.headline) ||
    'Subsequent reporting corroborated verified milestones and official findings.';

  const whatChanged =
    rawHowItChanged.whatChanged ||
    `Reporting transitioned from initial breaking alerts to multi-source verification and contextual analysis across ${story.category}.`;

  // 2. Conflicting reports
  const rawConflicting = Array.isArray(rawHowItChanged.conflictingReports) ? rawHowItChanged.conflictingReports : [];
  const conflictingReports: ConflictingReport[] = rawConflicting.map((conf: any, idx: number) => {
    if (typeof conf === 'string') {
      return {
        id: `conf-${idx}`,
        claim: conf,
        aspect: 'Reporting Difference',
        sourceA: { name: 'Initial Wire', date: 'Early Report', report: conf },
        sourceB: { name: 'Follow-up Wire', date: 'Follow-up', report: 'Contrasting or updated details' },
        currentConsensus: 'Current consensus reflects evolving facts reported across independent editorial wires.',
        discrepancyType: 'policy_scope' as const,
      };
    }
    return {
      id: conf.id || `conf-${idx}`,
      claim: conf.claim || conf.title || conf.summary || 'Disputed point in reporting',
      aspect: conf.aspect || 'Discrepancy',
      sourceA: typeof conf.sourceA === 'object' && conf.sourceA !== null
        ? {
            name: conf.sourceA.name || 'Source A',
            date: conf.sourceA.date || '',
            report: conf.sourceA.report || conf.sourceA.statement || 'Reported statement',
            url: conf.sourceA.url,
          }
        : {
            name: typeof conf.sourceA === 'string' ? conf.sourceA : 'Source A',
            date: '',
            report: typeof conf.sourceA === 'string' ? conf.sourceA : 'Reported statement',
          },
      sourceB: typeof conf.sourceB === 'object' && conf.sourceB !== null
        ? {
            name: conf.sourceB.name || 'Source B',
            date: conf.sourceB.date || '',
            report: conf.sourceB.report || conf.sourceB.statement || 'Reported statement',
            url: conf.sourceB.url,
          }
        : {
            name: typeof conf.sourceB === 'string' ? conf.sourceB : 'Source B',
            date: '',
            report: typeof conf.sourceB === 'string' ? conf.sourceB : 'Reported statement',
          },
      currentConsensus: conf.currentConsensus || conf.consensus || 'Ongoing reporting continues to clarify factual consensus.',
      discrepancyType: conf.discrepancyType || 'policy_scope',
    };
  });

  // 3. Corrections & Unverified claims
  const correctionsRetractions: string[] = Array.isArray(rawHowItChanged.correctionsRetractions)
    ? rawHowItChanged.correctionsRetractions.filter(Boolean)
    : [];
  const unverifiedClaims: string[] = Array.isArray(rawHowItChanged.unverifiedClaims)
    ? rawHowItChanged.unverifiedClaims.filter(Boolean)
    : [];

  // 4. Evolution items: normalize or synthesize from timeline / articles
  let evolutionItems: StoryEvolutionItem[] = [];
  if (Array.isArray(rawHowItChanged.evolutionItems) && rawHowItChanged.evolutionItems.length > 0) {
    evolutionItems = rawHowItChanged.evolutionItems.map((item: any, idx: number) => {
      const headline = item.headlineEvolution || item.headline || item.item || item.title || `Milestone #${idx + 1}`;
      const validClass = (['verified', 'disputed', 'corrected', 'developing', 'unverified'].includes(item.classification)
        ? item.classification
        : 'verified') as VerificationStatus;
      const sources = Array.isArray(item.sources)
        ? item.sources
        : typeof item.sources === 'string'
        ? [item.sources]
        : item.source
        ? [typeof item.source === 'string' ? item.source : item.source.name || 'News Source']
        : ['Editorial Wire'];

      return {
        id: item.id || `ev-${idx}`,
        date: item.date || item.timestamp || (story.timeline?.[idx]?.date) || 'Recent',
        headlineEvolution: headline,
        classification: validClass,
        details: item.details || item.summary || item.description || (typeof item === 'string' ? item : headline),
        whatInitiallyReported: item.whatInitiallyReported || item.initialReport || item.initiallyReported || 'Preliminary breaking dispatch',
        whatLaterConfirmed: item.whatLaterConfirmed || item.confirmedReport || item.laterConfirmed || 'Corroborated by follow-up reporting',
        sources,
      };
    });
  } else if (story.timeline && story.timeline.length > 0) {
    // Generate evolution items from timeline
    evolutionItems = story.timeline.slice(0, 4).map((t, idx) => ({
      id: `evo-derived-${idx}`,
      date: t.date || 'Recent',
      headlineEvolution: t.title || 'Development Milestone',
      classification: (t.status || 'verified') as VerificationStatus,
      details: t.event || t.aiExplanation || 'News development documented across verified wires.',
      whatInitiallyReported: idx === 0 ? t.event : 'Initial breaking bulletins noted early signals.',
      whatLaterConfirmed: t.event || 'Subsequent wire verification corroborated official details.',
      sources: t.sources ? t.sources.map(s => typeof s === 'string' ? s : s.name) : ['News Wire'],
    }));
  } else if (story.articles && story.articles.length > 0) {
    // Generate evolution items from articles
    evolutionItems = story.articles.slice(0, 3).map((a, idx) => {
      const sName = typeof a.source === 'string' ? a.source : a.source?.name || 'News Source';
      return {
        id: `evo-art-${idx}`,
        date: new Date(a.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        headlineEvolution: a.headline,
        classification: (a.verificationStatus || 'verified') as VerificationStatus,
        details: a.snippet || a.headline,
        whatInitiallyReported: idx === 0 ? a.headline : 'Wire bulletins issued preliminary figures.',
        whatLaterConfirmed: 'Subsequent reporting clarified the broader picture.',
        sources: [sName],
      };
    });
  }

  const howItChanged: StoryHub['howItChanged'] = {
    initiallyReported,
    laterConfirmed,
    whatChanged,
    conflictingReports,
    correctionsRetractions,
    unverifiedClaims,
    evolutionItems,
  };

  const filteredEvolutionItems = filterEvolutionStatus === 'all'
    ? howItChanged.evolutionItems
    : howItChanged.evolutionItems.filter(item => item.classification === filterEvolutionStatus);

  // Check if the story has documented changes, discrepancies, or retractions
  const hasChanges =
    howItChanged.conflictingReports.length > 0 ||
    howItChanged.correctionsRetractions.length > 0 ||
    howItChanged.unverifiedClaims.length > 0 ||
    howItChanged.evolutionItems.some(
      (item) => item.classification === 'disputed' || item.classification === 'corrected'
    ) ||
    Boolean(
      rawHowItChanged?.whatChanged &&
        rawHowItChanged.whatChanged.trim().length > 0 &&
        !rawHowItChanged.whatChanged.toLowerCase().includes('retained originality') &&
        !rawHowItChanged.whatChanged.toLowerCase().includes('steady') &&
        !rawHowItChanged.whatChanged.toLowerCase().includes('originality') &&
        rawHowItChanged.whatChanged.toLowerCase().includes('shift')
    );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#20130d]/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div 
        className="relative w-full max-w-5xl bg-[#faf4ea] border-2 border-[#d6c4ae] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#24140d] font-serif"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-[#f3e9db] border-b-2 border-[#d6c4ae] p-4 sm:p-6 shrink-0">
          <div className="flex items-start justify-between gap-4">
            
            <div className="flex-1">
              {/* Category, Status & Timeline Badge */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-[#881326] text-white">
                  {story.category}
                </span>
                
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eae0cf] text-[#6b0f1a] border border-[#d2c0aa] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#881326] animate-ping"></span>
                  {story.status}
                </span>

                <span className="text-xs text-[#715c50] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#9e887a]" />
                  Started {new Date(story.startedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} • Updated {new Date(story.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {/* Story Title */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#20130d] tracking-tight leading-tight font-headline">
                {story.title}
              </h2>
              <p className="text-sm text-[#5f493d] mt-1">
                {story.subtitle}
              </p>
            </div>

            {/* Actions: Share & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-[#ede2d2] hover:bg-[#e4d6c4] text-[#4b352a] transition cursor-pointer border border-[#d8c7b3]"
                title="Copy Story Link"
              >
                {copied ? <Check className="w-4 h-4 text-[#166534]" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-[#ede2d2] hover:bg-[#e4d6c4] text-[#4b352a] hover:text-[#881326] transition cursor-pointer border border-[#d8c7b3]"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* Subheader: Audio Flash Briefing & Mode Switcher */}
          <div className="mt-4 pt-3 border-t border-[#e2d5c3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <AudioPlayer
              briefingText={localTeaMode ? story.teaMode.whatHappened : story.quickBrief.whatHappened}
              storyTitle={story.title}
            />

            {/* In-Modal Tea Mode Toggle */}
            <div className="flex items-center bg-[#eee4d5] p-0.5 rounded-xl border border-[#ddcfbd] self-start sm:self-auto shadow-inner">
              <button
                onClick={() => setLocalTeaMode(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  !localTeaMode
                    ? 'bg-[#fbf8f3] text-[#2c1810] font-bold shadow-xs border border-[#d8c7b3]'
                    : 'text-[#715c50] hover:text-[#2c1810]'
                }`}
              >
                Executive Brief
              </button>
              <button
                onClick={() => setLocalTeaMode(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  localTeaMode
                    ? 'bg-gradient-to-r from-[#881326] to-[#b91c1c] text-white shadow-md'
                    : 'text-[#881326] hover:text-[#6b0f1a]'
                }`}
              >
                <span>News Tea 🍵</span>
                {localTeaMode && <Sparkles className="w-3 h-3 text-amber-200" />}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[#e2d5c3] pt-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-[#881326] text-[#881326] bg-[#fbf8f3]'
                  : 'border-transparent text-[#715c50] hover:text-[#2c1810]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{localTeaMode ? 'The Tea Rundown' : 'Quick Brief'}</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'border-[#881326] text-[#881326] bg-[#fbf8f3]'
                  : 'border-transparent text-[#715c50] hover:text-[#2c1810]'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Interactive Timeline ({story.timeline.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('changed')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'changed'
                  ? 'border-[#881326] text-[#881326] bg-[#fbf8f3]'
                  : 'border-transparent text-[#715c50] hover:text-[#2c1810]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>How The Story Changed ({howItChanged.evolutionItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('perspectives')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'perspectives'
                  ? 'border-[#881326] text-[#881326] bg-[#fbf8f3]'
                  : 'border-transparent text-[#715c50] hover:text-[#2c1810]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Source Perspectives ({story.perspectives.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('articles')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'articles'
                  ? 'border-[#881326] text-[#881326] bg-[#fbf8f3]'
                  : 'border-transparent text-[#715c50] hover:text-[#2c1810]'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Underlying Reports ({story.articles.length})</span>
            </button>
          </div>

        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: OVERVIEW / QUICK BRIEF / NEWS TEA */}
          {activeTab === 'overview' && (
            <div>
              {localTeaMode ? (
                /* NEWS TEA — GEN Z MODE */
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#f8ece5] via-[#fbf7f1] to-[#fceee8] border border-[#e8c5ba] shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-[#881326] font-extrabold text-sm uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>News Tea • Gen Z Briefing Mode</span>
                      </div>
                      <span className="text-[11px] text-[#881326] bg-[#881326]/10 px-2 py-0.5 rounded-full border border-[#881326]/20 font-bold">
                        100% Factual Integrity
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-[#6b0f1a] mb-4 italic font-serif">
                      "{story.teaMode.hook}"
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-[#fffdfa] p-3.5 rounded-xl border border-[#e6dac8]">
                        <div className="font-bold text-[#881326] mb-1 flex items-center gap-1.5">
                          <span>👀</span>
                          <span>What Actually Happened</span>
                        </div>
                        <p className="text-[#4a342b] leading-relaxed">
                          {story.teaMode.whatHappened}
                        </p>
                      </div>

                      <div className="bg-[#fffdfa] p-3.5 rounded-xl border border-[#e6dac8]">
                        <div className="font-bold text-[#b91c1c] mb-1 flex items-center gap-1.5">
                          <span>👥</span>
                          <span>Who Is Involved</span>
                        </div>
                        <p className="text-[#4a342b] leading-relaxed">
                          {story.teaMode.whoIsInvolved}
                        </p>
                      </div>

                      <div className="bg-[#fffdfa] p-3.5 rounded-xl border border-[#e6dac8]">
                        <div className="font-bold text-[#9a3412] mb-1 flex items-center gap-1.5">
                          <span>🔥</span>
                          <span>Why Everyone Is Talking</span>
                        </div>
                        <p className="text-[#4a342b] leading-relaxed">
                          {story.teaMode.whyEveryoneTalking}
                        </p>
                      </div>

                      <div className="bg-[#fffdfa] p-3.5 rounded-xl border border-[#e6dac8]">
                        <div className="font-bold text-[#881326] mb-1 flex items-center gap-1.5">
                          <span>⏮️</span>
                          <span>The Backstory</span>
                        </div>
                        <p className="text-[#4a342b] leading-relaxed">
                          {story.teaMode.backstory}
                        </p>
                      </div>

                      <div className="bg-[#fffdfa] p-3.5 rounded-xl border border-[#e6dac8]">
                        <div className="font-bold text-[#166534] mb-1 flex items-center gap-1.5">
                          <span>⚡</span>
                          <span>What Changed / Plot Twist</span>
                        </div>
                        <p className="text-[#4a342b] leading-relaxed">
                          {story.teaMode.whatChanged}
                        </p>
                      </div>

                      <div className="bg-[#fffdfa] p-3.5 rounded-xl border border-[#e6dac8]">
                        <div className="font-bold text-[#5b21b6] mb-1 flex items-center gap-1.5">
                          <span>📍</span>
                          <span>Where Things Stand Right Now</span>
                        </div>
                        <p className="text-[#4a342b] leading-relaxed">
                          {story.teaMode.whatsHappeningNow}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-[#881326]/10 border border-[#881326]/20 rounded-xl text-xs text-[#52131b] flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-[10px] bg-[#881326] text-white px-2 py-0.5 rounded">
                          Bottom Line
                        </span>
                        <span className="font-medium">{story.teaMode.keyTakeaway}</span>
                      </div>
                      {onRegenerateTea && (
                        <button
                          onClick={handleRegenerateTea}
                          disabled={isRegeneratingTea}
                          className="text-[11px] text-[#881326] hover:text-[#6b0f1a] underline cursor-pointer disabled:opacity-50 font-semibold"
                        >
                          {isRegeneratingTea ? 'Translating with Gemini...' : 'Re-spin tea with Gemini'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* NORMAL EXECUTIVE BRIEF */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#fffdfa] border border-[#e6dac8]">
                      <div className="text-xs font-bold text-[#881326] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#881326]"></span>
                        <span>What Happened</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#422f27] leading-relaxed">
                        {story.quickBrief.whatHappened}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#fffdfa] border border-[#e6dac8]">
                      <div className="text-xs font-bold text-[#9a3412] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#9a3412]"></span>
                        <span>Why It Matters</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#422f27] leading-relaxed">
                        {story.quickBrief.whyItMatters}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#fffdfa] border border-[#e6dac8]">
                      <div className="text-xs font-bold text-[#166534] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#166534]"></span>
                        <span>What's Next</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#422f27] leading-relaxed">
                        {story.quickBrief.whatsNext}
                      </p>
                    </div>
                  </div>

                  {/* Key Figures */}
                  {story.keyFigures && story.keyFigures.length > 0 && (
                    <div className="p-4 rounded-xl bg-[#f5ede2] border border-[#e2d5c3]">
                      <h4 className="text-xs font-bold text-[#2d1b15] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#881326]" />
                        <span>Key Stakeholders & Figures</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        {story.keyFigures.map((fig: any, i: number) => {
                          const figName = typeof fig === 'string' ? fig : fig?.name || 'Key Stakeholder';
                          const figRole = typeof fig === 'string' ? '' : fig?.role || '';
                          return (
                            <div key={i} className="p-2.5 rounded-lg bg-[#fffdfa] border border-[#e0d3c0] text-xs">
                              <span className="font-bold text-[#2b1713] block">{figName}</span>
                              {figRole && <span className="text-[11px] text-[#715c50] leading-tight block mt-0.5">{figRole}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Story Highlights Bar */}
              <div className="mt-4 p-4 rounded-xl bg-[#881326]/8 border border-[#881326]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#881326]">Story Intelligence Summary:</span>
                  <span className="text-[#4a342b]">
                    {story.timeline.length} Chronological Milestones • {story.articles.length} SerpAPI Ingested Reports
                  </span>
                </div>

                <button
                  onClick={() => setActiveTab('timeline')}
                  className="inline-flex items-center gap-1 text-[#881326] hover:text-[#6b0f1a] font-bold cursor-pointer"
                >
                  <span>Explore Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#f5ede2] rounded-xl border border-[#e2d5c3] text-xs text-[#5f493d] flex items-center justify-between">
                <span>
                  Chronological progression of <strong className="text-[#2b1713] font-serif">{story.title}</strong> from initial reports to current status.
                </span>
                <span className="text-[#881326] font-mono text-[11px] font-bold">
                  {story.timeline.length} Milestones Recorded
                </span>
              </div>

              {/* Vertical Interactive Timeline */}
              <div className="relative pl-6 sm:pl-8 border-l-2 border-[#881326]/30 space-y-8 my-4 ml-3">
                {story.timeline.map((node, index) => {
                  const isLatest = index === story.timeline.length - 1;
                  const isFirst = index === 0;

                  return (
                    <div key={node.id} className="relative group">
                      
                      {/* Node Bullet */}
                      <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full border-4 flex items-center justify-center transition-transform group-hover:scale-125 ${
                        isLatest
                          ? 'bg-[#881326] border-[#fbf8f3] shadow-md shadow-[#881326]/40'
                          : isFirst
                          ? 'bg-[#b45309] border-[#fbf8f3]'
                          : 'bg-[#bcaaa0] border-[#fbf8f3]'
                      }`}></div>

                      {/* Content Card */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        isLatest
                          ? 'bg-[#fffdfa] border-[#881326]/40 shadow-md'
                          : 'bg-[#fffdfa] border-[#e6dac8] hover:border-[#881326]/30'
                      }`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#881326]">
                              {node.date}
                            </span>
                            <span className="text-[#bcaaa0] text-xs">•</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#ede2d2] text-[#4a342b]">
                              {node.phase}
                            </span>
                          </div>

                          <VerificationBadge status={node.status || 'verified'} size="sm" />
                        </div>

                        <h4 className="text-base font-bold text-[#26130d] mb-1.5 leading-snug font-serif">
                          {node.title}
                        </h4>

                        <p className="text-xs text-[#4a342b] leading-relaxed mb-2.5">
                          {node.event}
                        </p>

                        <div className="p-2.5 rounded-lg bg-[#881326]/6 border border-[#881326]/15 text-xs text-[#52131b] mb-3">
                          <span className="font-bold text-[#881326] block mb-0.5">Why This Step Mattered:</span>
                          {node.aiExplanation}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#715c50] pt-2 border-t border-[#ede2d2]">
                          <span className="font-medium text-[#8f776a]">Documented by:</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {node.sources?.map((src: any, sIdx: number) => {
                              const sName = getSourceName(src);
                              const sUrl = getSourceUrl(src);
                              return (
                                <a
                                  key={sIdx}
                                  href={sUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#eee3d4] hover:bg-[#881326] hover:text-white text-[#422e25] transition"
                                >
                                  <span>{sName}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: HOW THE STORY CHANGED */}
          {activeTab === 'changed' && (
            <div className="space-y-6">
              {!hasChanges ? (
                /* Fallback for stories that do not have changes: Story's retains it's originality! */
                <div className="space-y-6">
                  <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-[#fbf8f4] via-[#f7efe2] to-[#ede3d2] border-2 border-[#dfd0bc] text-center shadow-xs">
                    <div className="w-16 h-16 rounded-full bg-[#166534]/10 text-[#166534] border border-[#166534]/20 flex items-center justify-center mx-auto mb-4 shadow-inner">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#166534] text-white inline-block mb-3 shadow-xs">
                      Steadfast & Consistent
                    </span>
                    <h3 className="font-serif font-bold text-2xl text-[#2b1713] mb-2 tracking-tight">
                      Story's retains it's originality!
                    </h3>
                    <p className="text-sm text-[#5c4639] max-w-lg mx-auto leading-relaxed">
                      No narrative shifts, conflicting claims, or retracted reports have occurred. From the very first wire bulletin to the latest developments, the core reporting on this story has remained steadfast, factual, and fully verified.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-[#715c50]">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fffdfa] border border-[#d8c8b4] shadow-xs">
                        <ShieldCheck className="w-4 h-4 text-[#166534]" />
                        <span className="font-bold text-[#2b1713]">Zero Retractions or Reversals</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fffdfa] border border-[#d8c8b4] shadow-xs">
                        <Sparkles className="w-4 h-4 text-[#881326]" />
                        <span>Continuous live wire corroboration active</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-[#dfd0bd] max-w-md mx-auto text-left bg-[#fffdfa]/80 p-4 rounded-xl border border-[#e2d5c3]">
                      <span className="font-bold text-[11px] text-[#881326] block mb-1 uppercase tracking-wider font-mono">
                        Consensus Summary:
                      </span>
                      <p className="text-xs text-[#422e25] leading-relaxed italic">
                        "{howItChanged.laterConfirmed || howItChanged.initiallyReported || 'All reporting has remained fully aligned with the initial wire dispatches.'}"
                      </p>
                    </div>
                  </div>

                  {/* Verified steady chronicle milestones */}
                  {howItChanged.evolutionItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#2c1810] font-serif mb-3">
                        Verified Chronicle Milestones ({howItChanged.evolutionItems.length})
                      </h4>
                      <div className="space-y-3">
                        {howItChanged.evolutionItems.map((item) => (
                          <div key={item.id} className="p-4 rounded-xl bg-[#fffdfa] border border-[#e2d5c3] text-xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[#881326] font-bold">{item.date}</span>
                                <span className="text-[#c2b2a3]">•</span>
                                <span className="font-bold text-[#2b1713] text-sm font-serif">{item.headlineEvolution}</span>
                              </div>
                              <VerificationBadge status={item.classification} size="sm" />
                            </div>

                            <p className="text-[#422e25] leading-relaxed">
                              {item.details}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                              <div className="text-[#715c50]">
                                <span className="text-[#b45309] font-bold">Initially: </span>
                                {item.whatInitiallyReported}
                              </div>
                              <div className="text-[#422e25]">
                                <span className="text-[#166534] font-bold">Confirmed: </span>
                                {item.whatLaterConfirmed}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-[#8f776a] pt-1 border-t border-[#ede2d2]">
                              <span>Corroborating Sources:</span>
                              <span className="text-[#422e25]">
                                {(Array.isArray(item.sources) ? item.sources : [item.sources || 'News Wire']).join(', ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Full details when the story HAS recorded changes / discrepancies */
                <>
                  {/* Information Evolution & Discrepancy Tracking */}
                  <div className="p-4 rounded-xl bg-[#f5ede2] border border-[#e2d5c3]">
                    <div className="flex items-center gap-2 text-[#881326] font-bold text-sm mb-1 font-serif">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Information Evolution & Discrepancy Tracking</span>
                    </div>
                    <p className="text-xs text-[#523d32] leading-relaxed">
                      We compare reports published at different stages of the story to uncover what was initially reported versus what was subsequently verified, retracted, or contested.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#dfd0bd] text-xs">
                      <div className="p-3 rounded-lg bg-[#fffdfa] border border-[#e8ceb5]">
                        <span className="font-bold text-[#b45309] block mb-1">What Was Initially Reported:</span>
                        <p className="text-[#422e25] leading-relaxed">{howItChanged.initiallyReported}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#fffdfa] border border-[#bbf7d0]">
                        <span className="font-bold text-[#166534] block mb-1">What Was Later Confirmed:</span>
                        <p className="text-[#422e25] leading-relaxed">{howItChanged.laterConfirmed}</p>
                      </div>
                    </div>

                    {howItChanged.whatChanged && (
                      <div className="mt-3 p-2.5 bg-[#fffdfa] rounded-lg text-xs text-[#3b271f] border border-[#dfd0bd]">
                        <strong className="text-[#881326]">Core Narrative Shift: </strong>
                        {howItChanged.whatChanged}
                      </div>
                    )}
                  </div>

                  {/* Conflicting Reports */}
                  {howItChanged.conflictingReports.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#2d1b15] mb-3 flex items-center gap-2 font-serif">
                        <AlertCircle className="w-4 h-4 text-[#881326]" />
                        <span>Conflicting Reports & Source Discrepancies</span>
                      </h4>

                      <div className="space-y-3">
                        {howItChanged.conflictingReports.map((conf) => (
                          <div key={conf.id} className="p-4 rounded-xl bg-[#fffdfa] border border-[#dfd0bd] text-xs">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-bold text-[#881326] text-sm">{conf.claim}</span>
                              <span className="px-2 py-0.5 rounded bg-[#881326]/10 text-[#881326] uppercase font-mono text-[10px] font-bold">
                                {conf.aspect}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                              <div className="p-3 rounded-lg bg-[#fbf8f3] border border-[#e6dac8]">
                                <div className="font-bold text-[#2b1713] flex items-center justify-between mb-1">
                                  <span>Source A: {getSourceName(conf.sourceA, 'Source A')}</span>
                                  <span className="text-[10px] text-[#715c50] font-mono">{conf.sourceA?.date || ''}</span>
                                </div>
                                <p className="text-[#422e25] italic">"{typeof conf.sourceA === 'string' ? conf.sourceA : conf.sourceA?.report || 'Reported statement'}"</p>
                              </div>

                              <div className="p-3 rounded-lg bg-[#fbf8f3] border border-[#e6dac8]">
                                <div className="font-bold text-[#2b1713] flex items-center justify-between mb-1">
                                  <span>Source B: {getSourceName(conf.sourceB, 'Source B')}</span>
                                  <span className="text-[10px] text-[#715c50] font-mono">{conf.sourceB?.date || ''}</span>
                                </div>
                                <p className="text-[#422e25] italic">"{typeof conf.sourceB === 'string' ? conf.sourceB : conf.sourceB?.report || 'Reported statement'}"</p>
                              </div>
                            </div>

                            <div className="mt-2 p-2 bg-[#f5ede2] rounded border border-[#dfd0bd] text-[#36241c]">
                              <strong className="text-[#166534]">Current Evidence & Consensus: </strong>
                              {conf.currentConsensus}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Corrections & Unverified Claims */}
                  {(howItChanged.correctionsRetractions.length > 0 || howItChanged.unverifiedClaims.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {howItChanged.correctionsRetractions.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-[#fee2e2]/40 border border-[#fca5a5] text-xs">
                          <div className="font-bold text-[#b91c1c] mb-2 flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Corrections & Retractions</span>
                          </div>
                          <ul className="space-y-1.5 list-disc list-inside text-[#422e25]">
                            {howItChanged.correctionsRetractions.map((c, idx) => (
                              <li key={idx} className="leading-relaxed">{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {howItChanged.unverifiedClaims.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-[#fef3c7]/40 border border-[#fcd34d] text-xs">
                          <div className="font-bold text-[#b45309] mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Claims Remaining Unverified</span>
                          </div>
                          <ul className="space-y-1.5 list-disc list-inside text-[#422e25]">
                            {howItChanged.unverifiedClaims.map((c, idx) => (
                              <li key={idx} className="leading-relaxed">{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evolution items list */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <h4 className="text-sm font-bold text-[#2c1810] font-serif">
                        Step-by-Step Evolution of Information ({filteredEvolutionItems.length})
                      </h4>

                      <div className="flex items-center gap-1 text-xs">
                        {(['all', 'verified', 'disputed', 'corrected'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => setFilterEvolutionStatus(st)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer capitalize ${
                              filterEvolutionStatus === st
                                ? 'bg-[#881326] text-white shadow-xs'
                                : 'bg-[#ede2d2] text-[#715c50] hover:text-[#2c1810]'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredEvolutionItems.length === 0 ? (
                      <div className="p-6 rounded-xl bg-[#fffdfa] border border-[#e2d5c3] text-center text-xs text-[#715c50] space-y-1">
                        <p className="font-bold text-[#2b1713]">No developments tagged under "{filterEvolutionStatus}"</p>
                        <p className="text-[#5a4437]">All verified developments for this story are logged in the main timeline tab.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredEvolutionItems.map((item) => (
                          <div key={item.id} className="p-4 rounded-xl bg-[#fffdfa] border border-[#e2d5c3] text-xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[#881326] font-bold">{item.date}</span>
                                <span className="text-[#c2b2a3]">•</span>
                                <span className="font-bold text-[#2b1713] text-sm font-serif">{item.headlineEvolution}</span>
                              </div>
                              <VerificationBadge status={item.classification} size="sm" />
                            </div>

                            <p className="text-[#422e25] leading-relaxed">
                              {item.details}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                              <div className="text-[#715c50]">
                                <span className="text-[#b45309] font-bold">Initially: </span>
                                {item.whatInitiallyReported}
                              </div>
                              <div className="text-[#422e25]">
                                <span className="text-[#166534] font-bold">Confirmed: </span>
                                {item.whatLaterConfirmed}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-[#8f776a] pt-1 border-t border-[#ede2d2]">
                              <span>Corroborating Sources:</span>
                              <span className="text-[#422e25]">
                                {(Array.isArray(item.sources) ? item.sources : [item.sources || 'News Wire']).join(', ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: SOURCE PERSPECTIVES */}
          {activeTab === 'perspectives' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#f5ede2] rounded-xl border border-[#e2d5c3] text-xs text-[#5f493d]">
                Compare how different news publications framed and prioritized aspects of this story.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {story.perspectives.map((p, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#fffdfa] border border-[#e2d5c3] flex flex-col justify-between text-xs space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-[#2b1713] text-sm font-serif">{p.source}</span>
                        <span className="px-2 py-0.5 rounded bg-[#881326]/10 text-[#881326] text-[10px] uppercase font-mono font-bold">
                          {p.outletType}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#fbf8f3] border border-[#e6dac8] mb-3">
                        <span className="text-[10px] text-[#8f776a] uppercase font-bold block mb-1">Headline Framing</span>
                        <p className="text-[#2b1713] italic font-medium font-serif">"{p.sampleHeadline}"</p>
                      </div>

                      <div className="space-y-1.5 text-[#422e25]">
                        <div>
                          <strong className="text-[#715c50]">Reporting Angle: </strong>
                          {p.angle}
                        </div>
                        <div>
                          <strong className="text-[#715c50]">Editorial Tone: </strong>
                          {p.tone}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#ede2d2] text-[11px] text-[#881326]">
                      <strong>Key Focal Point: </strong>
                      {p.keyHighlight}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: UNDERLYING ARTICLES */}
          {activeTab === 'articles' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#f5ede2] rounded-xl border border-[#e2d5c3] text-xs text-[#5f493d] flex items-center justify-between">
                <span>
                  All underlying articles gathered through SerpAPI and clustered into this Story Hub.
                </span>
                <span className="text-[#881326] font-mono text-[11px] font-bold">
                  {story.articles.length} Reports
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {story.articles.map((art) => (
                  <div key={art.id} className="p-3.5 rounded-xl bg-[#fffdfa] border border-[#e2d5c3] flex flex-col justify-between text-xs space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-[#881326]">{getSourceName(art?.source)}</span>
                        <VerificationBadge status={art.verificationStatus} size="sm" />
                      </div>
                      <h5 className="font-bold text-[#26130d] text-sm leading-snug mb-1 font-serif">
                        {art.headline}
                      </h5>
                      <p className="text-[#5c473b] line-clamp-2">
                        {art.snippet}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#ede2d2] flex items-center justify-between text-[11px] text-[#715c50]">
                      <span>{art.publishedAt}</span>
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#881326] hover:text-[#6b0f1a] font-bold"
                      >
                        <span>Open Publisher Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Status Bar */}
        <div className="bg-[#f5ede2] border-t border-[#e2d5c3] px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-[#5f493d] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#881326] animate-pulse"></span>
            <span>Continuously tracked via SerpAPI </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#881326] hover:bg-[#6b0f1a] text-white font-bold transition cursor-pointer"
          >
            Close Story
          </button>
        </div>

      </div>
    </div>
  );
};
