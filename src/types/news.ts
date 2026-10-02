export type VerificationStatus = 'verified' | 'unverified' | 'disputed' | 'corrected' | 'developing';

export type Category = 
  | 'All'
  | 'Trending'
  | 'World'
  | 'Politics'
  | 'Technology'
  | 'Business'
  | 'Science'
  | 'Sports'
  | 'Entertainment'
  | 'India';

export interface NewsItem {
  id: string;
  headline: string;
  source: {
    name: string;
    icon?: string;
  };
  url: string;
  publishedAt: string;
  category: Category;
  snippet: string;
  storyId?: string;
  aiSummary: string;
  verificationStatus: VerificationStatus;
  statusReason?: string;
  fetchedAt: string;
}

export interface TimelineEntry {
  id: string;
  date: string;
  phase: 'Started' | 'Major Development' | 'Official Response' | 'New Evidence' | 'Latest Update';
  title: string;
  event: string;
  aiExplanation: string;
  sources: Array<{
    name: string;
    url: string;
  }>;
  status?: VerificationStatus;
}

export interface ConflictingReport {
  id: string;
  claim: string;
  aspect: string;
  sourceA: {
    name: string;
    date: string;
    report: string;
    url?: string;
  };
  sourceB: {
    name: string;
    date: string;
    report: string;
    url?: string;
  };
  currentConsensus: string;
  discrepancyType: 'figure_discrepancy' | 'origin_claim' | 'responsibility' | 'timing' | 'policy_scope';
}

export interface StoryEvolutionItem {
  id: string;
  date: string;
  headlineEvolution: string;
  classification: VerificationStatus;
  details: string;
  whatInitiallyReported: string;
  whatLaterConfirmed: string;
  sources: string[];
}

export interface NewsTeaData {
  hook: string;
  whatHappened: string;
  whoIsInvolved: string;
  whyEveryoneTalking: string;
  backstory: string;
  whatChanged: string;
  whatsHappeningNow: string;
  keyTakeaway: string;
}

export interface SourcePerspective {
  source: string;
  outletType: 'Global Wire' | 'National Press' | 'Financial Daily' | 'Regional/Local' | 'Tech Focus' | 'Official Statement';
  angle: string;
  tone: string;
  sampleHeadline: string;
  keyHighlight: string;
}

export interface StoryHub {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  status: string; // e.g. "Active Investigation", "Diplomatic Talks", "Trial in Progress", "Developing Regulatory Fight"
  statusType: 'investigation' | 'developing' | 'negotiation' | 'hearing' | 'breakthrough' | 'monitoring';
  startedAt: string;
  updatedAt: string;
  isTrending: boolean;
  isDeveloping: boolean;
  coverImage?: string;
  quickBrief: {
    whatHappened: string;
    whyItMatters: string;
    whatsNext: string;
  };
  teaMode: NewsTeaData;
  timeline: TimelineEntry[];
  howItChanged: {
    initiallyReported: string;
    laterConfirmed: string;
    whatChanged: string;
    correctionsRetractions: string[];
    unverifiedClaims: string[];
    conflictingReports: ConflictingReport[];
    evolutionItems: StoryEvolutionItem[];
  };
  perspectives: SourcePerspective[];
  articles: NewsItem[];
  keyFigures: Array<{
    name: string;
    role: string;
  }>;
}

export interface ServerStatus {
  serpApiConfigured: boolean;
  geminiConfigured: boolean;
  totalStories: number;
  totalArticles: number;
  lastSyncedAt: string;
  categoriesAvailable: string[];
}
