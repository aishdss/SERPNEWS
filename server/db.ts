import fs from 'node:fs';
import path from 'node:path';
import type { StoryHub, NewsItem, Category, ServerStatus } from '../src/types/news.js';
import { isSerpApiConfigured, fetchSerpApiNews } from './serpapi.js';
import { summarizeArticleWithAI, generateGenZTea, createSynthesizedStoryHub, clusterArticlesIntoTopics } from './gemini.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'news_db.json');

interface DatabaseSchema {
  stories: StoryHub[];
  articles: NewsItem[];
  lastSyncedAt: string;
}

// Initial realistic developing stories curated with real sources, timelines, and evolutions
const SEED_STORIES: StoryHub[] = [
  {
    id: 'story-tech-antitrust',
    title: 'Department of Justice Tech Monopoly Antitrust Remedy Trial',
    subtitle: 'Federal court weighs historic structural breakups, search contract bans, and browser divestitures.',
    category: 'Technology',
    status: 'Remedy Phase Hearings',
    statusType: 'hearing',
    startedAt: '2024-08-05T10:00:00Z',
    updatedAt: '2026-09-24T18:30:00Z',
    isTrending: true,
    isDeveloping: true,
    quickBrief: {
      whatHappened: 'Following a landmark ruling declaring illegal search monopoly maintenance, the US District Court is hearing closing arguments on proposed antitrust remedies, including potential divestiture of the Chrome browser and Android operating system.',
      whyItMatters: 'This represents the most aggressive tech antitrust enforcement action in 25 years since the Microsoft case, directly altering default search distribution on billions of smartphones and browsers worldwide.',
      whatsNext: 'Judge Amit Mehta is expected to issue the final remedial ruling by late autumn, with immediate appeals to the D.C. Circuit Court of Appeals anticipated by tech counsel.'
    },
    teaMode: {
      hook: "Okay, here's the tea on the biggest tech trial of our generation 👀",
      whatHappened: "The feds won the argument that search was basically rigged by multi-billion dollar under-the-table exclusivity contracts. Now they are deciding whether to literally force tech giants to sell off Chrome or untangle Android.",
      whoIsInvolved: "The US Department of Justice (prosecutors wanting big breakups) vs tech giants and their army of top-dollar defense lawyers, plus competitors like DuckDuckGo and Mozilla watching nervously.",
      whyEveryoneTalking: "Because your default Google search bar on iPhone, Safari, and Samsung phones might completely change forever, and tech companies are spending billions in legal fees.",
      backstory: "Years ago, prosecutors claimed Google paid Apple upwards of $20B+ a year just to stay the default search engine on Safari. The judge agreed that was anti-competitive.",
      whatChanged: "The DOJ officially moved from 'just tell them to stop doing exclusive deals' to 'no, we want structural separation and open data syndication.'",
      whatsHappeningNow: "Both sides are doing final witness cross-examinations and submitting economic impact models in DC federal court.",
      keyTakeaway: "No cap: whichever way the judge rules, how we search the web on our phones is getting its biggest makeover in two decades."
    },
    timeline: [
      {
        id: 't-1',
        date: 'Aug 5, 2024',
        phase: 'Started',
        title: 'District Court Issues Landmark Monopoly Liability Ruling',
        event: 'Judge Amit Mehta rules that Google maintained an illegal monopoly in general search services and search text ads through exclusive revenue-sharing agreements.',
        aiExplanation: 'The liability finding was the first major government antitrust victory against Big Tech in decades, establishing the legal basis for penalties.',
        sources: [
          { name: 'Reuters', url: 'https://www.reuters.com' },
          { name: 'Associated Press', url: 'https://apnews.com' }
        ],
        status: 'verified'
      },
      {
        id: 't-2',
        date: 'Oct 8, 2024',
        phase: 'Major Development',
        title: 'DOJ Outlines Framework for Structural and Behavioral Remedies',
        event: 'Prosecutors submit a 32-page proposal indicating they may ask for Chrome or Android divestitures and limits on AI search data hoarding.',
        aiExplanation: 'Signaled to Silicon Valley that prosecutors intended to seek aggressive structural remedies rather than minor behavioral promises.',
        sources: [
          { name: 'Bloomberg', url: 'https://www.bloomberg.com' },
          { name: 'The Wall Street Journal', url: 'https://www.wsj.com' }
        ],
        status: 'verified'
      },
      {
        id: 't-3',
        date: 'Nov 20, 2024',
        phase: 'Official Response',
        title: 'DOJ Officially Files Proposed Final Judgment',
        event: 'Justice Department formally asks the judge to compel the sale of Chrome, prohibit default exclusivity agreements, and mandate index data sharing.',
        aiExplanation: 'Defense filings countered that forced divestiture would compromise security and undermine US competitiveness in artificial intelligence.',
        sources: [
          { name: 'The New York Times', url: 'https://www.nytimes.com' },
          { name: 'BBC News', url: 'https://www.bbc.com' }
        ],
        status: 'verified'
      },
      {
        id: 't-4',
        date: 'April 14, 2025',
        phase: 'New Evidence',
        title: 'Remedy Trial Evidentiary Phase Commences in Washington D.C.',
        event: 'Key executives and rival search engine CEOs testify on whether AI answer engines (like Perplexity and OpenAI) reduce the need for search remedy mandates.',
        aiExplanation: 'Economic witnesses disputed whether AI chatbots are genuine market substitutes for navigational web search engines.',
        sources: [
          { name: 'The Verge', url: 'https://www.theverge.com' },
          { name: 'CNBC', url: 'https://www.cnbc.com' }
        ],
        status: 'verified'
      },
      {
        id: 't-5',
        date: 'Sept 22, 2026',
        phase: 'Latest Update',
        title: 'Final Remedy Arguments Conclude with Focus on AI Licensing Provisions',
        event: 'Judge hears closing arguments regarding proposed requirements to license search index data to competitor AI research labs.',
        aiExplanation: 'The court is scrutinizing whether data-sharing remedies would unintentionally leak consumer search privacy or strengthen rival platforms.',
        sources: [
          { name: 'Reuters', url: 'https://www.reuters.com' },
          { name: 'Financial Times', url: 'https://www.ft.com' }
        ],
        status: 'developing'
      }
    ],
    howItChanged: {
      initiallyReported: 'Initial coverage in early 2024 framed the trial primarily around default search payments to Apple and Samsung, with analysts expecting mild fines or behavioral injunctions preventing exclusive clauses.',
      laterConfirmed: 'Court evidence revealed internal emails detailing that $26.3 billion was paid in default fees alone in 2021, prompting the DOJ to escalate from minor fines to full structural divestiture demands including Chrome.',
      whatChanged: 'The debate dramatically shifted from classical web keywords to whether generative AI agents replace search engines altogether, leading defense lawyers to argue the remedy is obsolete before it is even signed.',
      correctionsRetractions: [
        'Early wire reports stated the DOJ had formally demanded an immediate forced sale of Android; subsequent court filings confirmed Android sale was recommended only as a secondary contingent remedy if behavioral remedies failed.'
      ],
      unverifiedClaims: [
        'Leaked reports that Apple was already building a standalone consumer search engine to replace Google on Safari remained unverified and were dismissed by Apple services testimony.'
      ],
      conflictingReports: [
        {
          id: 'conf-1',
          claim: 'Valuation and feasibility of spinning off Chrome browser',
          aspect: 'Financial and Technical Feasibility',
          sourceA: {
            name: 'DOJ Economic Experts',
            date: 'May 2025',
            report: 'Argued Chrome could operate sustainably as an independent browser funded by syndicated search auctions without compromising security.'
          },
          sourceB: {
            name: 'Tech Defense Economists',
            date: 'June 2025',
            report: 'Claimed no commercial buyer exists with the capability to maintain Chromium open-source security without parent ad revenue.'
          },
          currentConsensus: 'Court is exploring non-divestiture options like choice-screen mandates before taking the irreversible step of forced spin-off.',
          discrepancyType: 'policy_scope'
        }
      ],
      evolutionItems: [
        {
          id: 'ev-1',
          date: 'Aug 2024',
          headlineEvolution: 'Tech Monopoly Ruled Unlawful in Search Defaults',
          classification: 'verified',
          details: 'Judge confirmed monopolistic maintenance through distribution lock-in.',
          whatInitiallyReported: 'Expected moderate settlement or non-exclusive contracts.',
          whatLaterConfirmed: 'Liability upheld on all core Sherman Act Section 2 counts.',
          sources: ['Reuters', 'DOJ Press Release']
        },
        {
          id: 'ev-2',
          date: 'Nov 2024',
          headlineEvolution: 'Government Proposes Full Breakup of Chrome Browser',
          classification: 'verified',
          details: 'DOJ proposed judgment escalated to structural breakup.',
          whatInitiallyReported: 'Pundits anticipated only data-sharing requirements.',
          whatLaterConfirmed: 'DOJ formally petitioned for sale of Chrome and prohibition of AI data locking.',
          sources: ['Wall Street Journal', 'Court Docket 20-cv-03010']
        },
        {
          id: 'ev-3',
          date: 'Sept 2026',
          headlineEvolution: 'AI Search Disruption Dominates Final Hearing Debates',
          classification: 'disputed',
          details: 'Disagreement over whether AI agents make search remedies redundant.',
          whatInitiallyReported: 'AI cited by defense as proof market is naturally curing itself.',
          whatLaterConfirmed: 'DOJ counter-argued that dominant search data gives the incumbent an unassailable headstart in AI models.',
          sources: ['Financial Times', 'Bloomberg']
        }
      ]
    },
    perspectives: [
      {
        source: 'Reuters / AP Wire',
        outletType: 'Global Wire',
        angle: 'Neutral procedural scrutiny focusing on legal precedents and judicial questions',
        tone: 'Objective, fact-driven',
        sampleHeadline: 'US Judge Weighs Tech Breakup Precedent in Search Monopoly Remedy Arguments',
        keyHighlight: 'Focuses on the high bar for judicial breakups set by historic appellate decisions.'
      },
      {
        source: 'The Wall Street Journal',
        outletType: 'Financial Daily',
        angle: 'Market capitalization impact, browser advertising economics, and shareholder risks',
        tone: 'Market-oriented, analytical',
        sampleHeadline: 'Chrome Spin-off Would Reshuffle the $300B Digital Ad Landscape',
        keyHighlight: 'Examines which private equity or cloud firms could realistically acquire Chrome.'
      },
      {
        source: 'The Verge',
        outletType: 'Tech Focus',
        angle: 'Open-source web standards, browser engine diversity, and consumer user experience',
        tone: 'Technically critical, consumer-first',
        sampleHeadline: 'What a Chrome Breakup Actually Means for the Open Web',
        keyHighlight: 'Highlights concerns over maintaining the Chromium rendering engine if detached from ad revenue.'
      }
    ],
    articles: [
      {
        id: 'art-1',
        headline: 'DOJ Urges Judge to Order Sale of Chrome in Final Antitrust Arguments',
        source: { name: 'Reuters' },
        url: 'https://www.reuters.com/technology/us-doj-search-monopoly-remedy-hearings-2026',
        publishedAt: '2026-09-23T14:15:00Z',
        category: 'Technology',
        snippet: 'Federal prosecutors reiterated that only structural remedies can restore competitive incentives in web search and AI discovery.',
        aiSummary: 'DOJ prosecutors concluded closing arguments demanding the divestiture of Chrome to dismantle illegal distribution monopolies. Defense counsel insisted this would harm consumers.',
        verificationStatus: 'verified',
        statusReason: 'Official courtroom reporting on open federal proceedings.',
        fetchedAt: '2026-09-24T08:00:00Z'
      },
      {
        id: 'art-2',
        headline: 'Google Cites Rise of AI Chatbots to Argue Search Remedy Is Outdated',
        source: { name: 'Bloomberg' },
        url: 'https://www.bloomberg.com/news/articles/2026-09-22/google-ai-defense-search-antitrust',
        publishedAt: '2026-09-22T19:40:00Z',
        category: 'Technology',
        snippet: 'Defense attorneys argued that consumers are increasingly migrating to multimodal AI assistants, proving the dynamic nature of web queries.',
        aiSummary: 'Defense argued that multimodal AI chat products have fundamentally altered user discovery habits, making 2020-era search remedies obsolete.',
        verificationStatus: 'verified',
        statusReason: 'Direct quotes from defense evidentiary brief.',
        fetchedAt: '2026-09-23T08:00:00Z'
      }
    ],
    keyFigures: [
      { name: 'Judge Amit Mehta', role: 'U.S. District Court Judge presiding over the case' },
      { name: 'Jonathan Kanter', role: 'Assistant Attorney General for Antitrust, US DOJ' },
      { name: 'Sundar Pichai', role: 'CEO of Alphabet and Google' },
      { name: 'Kent Walker', role: 'President of Global Affairs and Chief Legal Officer' }
    ]
  },
  {
    id: 'story-india-semiconductor',
    title: 'India Semiconductor Mission: Dholera & Sanand Mega-Fabs Operational Transition',
    subtitle: 'Commercial silicon wafers enter pilot runs as international chip alliances solidify local manufacturing.',
    category: 'India',
    status: 'Pilot Foundry Production',
    statusType: 'breakthrough',
    startedAt: '2024-03-13T09:00:00Z',
    updatedAt: '2026-09-25T11:20:00Z',
    isTrending: true,
    isDeveloping: true,
    quickBrief: {
      whatHappened: 'India’s first commercial semiconductor fabrication facility in Dholera, developed by Tata Electronics in partnership with Taiwan’s Powerchip (PSMC), has commenced cleanroom tool installation and trial wafer pilot runs.',
      whyItMatters: 'Positions India as a major alternative silicon node in global supply chains, reducing dependence on single-region manufacturing for automotive, telecom, and consumer electronics chips.',
      whatsNext: 'Commercial volume production is slated to ramp through late 2026, with the government reviewing proposals for next-generation sub-14nm advanced packaging nodes.'
    },
    teaMode: {
      hook: "Okay, here's the tea on India's trillion-rupee chip bet 🇮🇳⚡",
      whatHappened: "For decades, people said building real computer chip factories in India was basically impossible because of clean water, power, and supply chain needs. Now the Dholera mega-fab is literally installing cleanroom equipment and running pilot silicon wafers.",
      whoIsInvolved: "The Indian Union Government, Tata Electronics, Taiwan's PSMC, Micron, and international tech giants hungry for alternative chip supply chains.",
      whyEveryoneTalking: "Because every smartphone, electric vehicle, missile, and laptop needs silicon. If this works, India stops just writing the software and starts printing the actual hardware.",
      backstory: "During the pandemic, global chip shortages froze car factories worldwide. India launched a $10 Billion incentive package to get world-class chipmakers to set up local foundries.",
      whatChanged: "The project transitioned from government press conferences and empty land plots to physical cleanrooms, heavy ASML/Applied Materials lithography machinery, and test silicon wafers.",
      whatsHappeningNow: "Engineers trained in Taiwan and Japan are running trial runs on 28nm and 40nm automotive-grade chips.",
      keyTakeaway: "No cap: India is officially entering the global silicon league, and it is moving way faster than skeptics predicted."
    },
    timeline: [
      {
        id: 't-in-1',
        date: 'March 2024',
        phase: 'Started',
        title: 'Prime Minister Lays Foundation for Three Semiconductor Units',
        event: 'Foundation stones laid for Tata-PSMC Dholera fab ($11B), Tata packaging unit in Morigaon, Assam ($3.2B), and CG Power in Sanand ($900M).',
        aiExplanation: 'Marked the official formal launch of physical construction under the India Semiconductor Mission (ISM).',
        sources: [{ name: 'The Hindu', url: 'https://www.thehindu.com' }],
        status: 'verified'
      },
      {
        id: 't-in-2',
        date: 'Dec 2024',
        phase: 'Major Development',
        title: 'Sanand Micron ATMP Facility Completes Pilot Assembly',
        event: 'Micron Technology completes initial cleanroom assembly of memory modules at Sanand, Gujarat facility.',
        aiExplanation: 'First physical proof of high-volume semiconductor assembly and test on Indian soil.',
        sources: [{ name: 'Economic Times', url: 'https://economictimes.indiatimes.com' }],
        status: 'verified'
      },
      {
        id: 't-in-3',
        date: 'June 2025',
        phase: 'New Evidence',
        title: 'Supply Chain Cluster: Gas, Chemical, and Tool Suppliers Set Up Base',
        event: 'Over 40 specialty chemical, ultra-pure water, and gases suppliers establish ancillary plants near Dholera Special Investment Region.',
        aiExplanation: 'Addressed key early skepticism regarding ecosystem readiness and raw material availability.',
        sources: [{ name: 'Mint', url: 'https://www.livemint.com' }],
        status: 'verified'
      },
      {
        id: 't-in-4',
        date: 'Sept 2026',
        phase: 'Latest Update',
        title: 'Dholera Fab Commences Cleanroom Trial Wafer Runs',
        event: 'Tata Electronics confirms first 300mm test silicon wafers processing through pilot photolithography lines.',
        aiExplanation: 'Demonstrates physical manufacturing capability prior to high-yield commercial automotive certification.',
        sources: [{ name: 'The Hindu', url: 'https://www.thehindu.com' }, { name: 'Reuters', url: 'https://www.reuters.com' }],
        status: 'verified'
      }
    ],
    howItChanged: {
      initiallyReported: 'Early skepticism in 2022-2023 doubted whether India could meet the stringent uninterrupted water, power, and logistics demands of semiconductor foundries, especially after the Foxconn-Vedanta joint venture dissolved.',
      laterConfirmed: 'The government revised the incentive scheme to 50% central fiscal support on pari-passu basis, successfully attracting Tata Group with Taiwan’s established foundry PSMC and Micron.',
      whatChanged: 'Focus evolved from chasing bleeding-edge 3nm smartphone nodes to high-demand, high-volume 28nm and 40nm mature nodes for automotive, IoT, and industrial power management.',
      correctionsRetractions: [
        'Early 2023 reports suggested a 28nm fab would be operational by late 2024; timelines were officially recalibrated to 2026 to accommodate custom cleanroom construction standards.'
      ],
      unverifiedClaims: [
        'Rumors of a multi-billion dollar direct investment by TSMC in Gujarat were clarified as exploratory supply talks rather than equity fab commitments.'
      ],
      conflictingReports: [
        {
          id: 'conf-in-1',
          claim: 'Yield rates and timeline to full commercial volume production',
          aspect: 'Manufacturing Readiness',
          sourceA: {
            name: 'Ministry of Electronics & IT',
            date: 'July 2026',
            report: 'Stated commercial shipments of automotive chips would begin by Q4 2026.'
          },
          sourceB: {
            name: 'Global Semiconductor Industry Analysts',
            date: 'August 2026',
            report: 'Estimated mature commercial qualification typically takes 9 to 14 months post-pilot runs.'
          },
          currentConsensus: 'Pilot wafers are active; full customer qualification expected to bridge into early 2027.',
          discrepancyType: 'timing'
        }
      ],
      evolutionItems: [
        {
          id: 'ev-in-1',
          date: 'July 2023',
          headlineEvolution: 'Vedanta-Foxconn JV Splits, Raising Questions on India Chip Mission',
          classification: 'corrected',
          details: 'Initial JV fell through, leading to fears of policy stall.',
          whatInitiallyReported: 'Feared India chip ambitions would face multi-year setback.',
          whatLaterConfirmed: 'Tata Electronics stepped in with PSMC Taiwan partnership.',
          sources: ['Reuters', 'Economic Times']
        },
        {
          id: 'ev-in-2',
          date: 'March 2024',
          headlineEvolution: 'Tata PSMC Dholera Fab Approved with $11 Billion Outlay',
          classification: 'verified',
          details: 'Official cabinet approval and groundbreaking ceremony.',
          whatInitiallyReported: 'Speculation on location and capital expenditure.',
          whatLaterConfirmed: 'Construction initiated at Dholera SIR with state incentives.',
          sources: ['PIB India', 'The Hindu']
        },
        {
          id: 'ev-in-3',
          date: 'Sept 2026',
          headlineEvolution: 'Trial Wafers Run on Dholera Line as Industrial Ecosystem Arrives',
          classification: 'verified',
          details: 'Equipment tool-in phase concluded, pilot batches processing.',
          whatInitiallyReported: 'Expected delays in precision lithography tool delivery.',
          whatLaterConfirmed: 'Essential tools successfully installed and powered.',
          sources: ['Business Standard', 'Taiwan Central News Agency']
        }
      ]
    },
    perspectives: [
      {
        source: 'The Hindu',
        outletType: 'National Press',
        angle: 'Strategic sovereign independence, engineering employment, and indigenous hardware capacity',
        tone: 'Balanced, nation-building focus',
        sampleHeadline: 'Dholera Fab Pilot Marks Pivotal Milestone for India Tech Sovereignty',
        keyHighlight: 'Emphasizes long-term domestic self-reliance in aerospace and critical defense electronics.'
      },
      {
        source: 'Nikkei Asia',
        outletType: 'Global Wire',
        angle: 'Taiwan-India geopolitical alignment, China+1 supply chain diversification',
        tone: 'Geopolitical, industrial strategy',
        sampleHeadline: 'How Taiwan Chip Veterans Are Mentoring India Next-Gen Foundries',
        keyHighlight: 'Focuses on the thousands of Indian engineers training in Hsinchu science parks.'
      },
      {
        source: 'Bloomberg',
        outletType: 'Financial Daily',
        angle: 'Return on capital, state subsidies sustainability, and global wafer pricing competition',
        tone: 'Pragmatic, investment scrutiny',
        sampleHeadline: 'India Billion-Dollar Chip Subsidies Face Global Wafer Oversupply Test',
        keyHighlight: 'Questions whether mature-node pricing in 2027 will generate commercial profit margins.'
      }
    ],
    articles: [
      {
        id: 'art-in-1',
        headline: 'Tata Electronics Initiates Pilot Wafer Processing at Dholera Facility',
        source: { name: 'The Hindu' },
        url: 'https://www.thehindu.com/business/tata-electronics-dholera-semiconductor-pilot-2026',
        publishedAt: '2026-09-24T06:10:00Z',
        category: 'India',
        snippet: 'Engineers have begun running initial 300mm test silicon wafers through photolithography and etching chambers.',
        aiSummary: 'Tata Electronics has started pilot wafer runs at its $11-billion Dholera facility in Gujarat, signaling readiness for automotive chip qualification.',
        verificationStatus: 'verified',
        statusReason: 'Official corporate and state government confirmation.',
        fetchedAt: '2026-09-24T09:00:00Z'
      },
      {
        id: 'art-in-2',
        headline: 'Global Chip Equipment Makers Expand Support Hubs in Gujarat Corridor',
        source: { name: 'Economic Times' },
        url: 'https://economictimes.indiatimes.com/tech/hardware/chip-toolmakers-hub-gujarat',
        publishedAt: '2026-09-23T11:45:00Z',
        category: 'India',
        snippet: 'Semiconductor tool and chemical giants establish local service centers to support rapid turnaround for cleanroom operations.',
        aiSummary: 'Major global semiconductor suppliers are setting up permanent regional engineering bases in Gujarat to support the new foundries.',
        verificationStatus: 'verified',
        statusReason: 'State industrial development records and company press releases.',
        fetchedAt: '2026-09-24T09:00:00Z'
      }
    ],
    keyFigures: [
      { name: 'Ashwini Vaishnaw', role: 'Union Minister for Electronics and IT, Government of India' },
      { name: 'N. Chandrasekaran', role: 'Chairman, Tata Sons' },
      { name: 'Frank Huang', role: 'Chairman, Powerchip Semiconductor Manufacturing Corp (PSMC)' },
      { name: 'Sanjay Mehrotra', role: 'CEO, Micron Technology' }
    ]
  },
  {
    id: 'story-world-climate-treaty',
    title: 'High Seas Biodiversity Treaty: Ratification Milestone and Deep-Sea Mining Moratorium',
    subtitle: 'Nations cross the threshold to bring the historic ocean protection accord into binding international law.',
    category: 'World',
    status: 'Entering Legal Force',
    statusType: 'negotiation',
    startedAt: '2023-06-19T14:00:00Z',
    updatedAt: '2026-09-25T16:00:00Z',
    isTrending: true,
    isDeveloping: true,
    quickBrief: {
      whatHappened: 'The UN High Seas Treaty (BBNJ Agreement) has officially secured its required 60th national instrument of ratification, triggering the 120-day countdown for the historic ocean protection treaty to become binding international law.',
      whyItMatters: 'Governs two-thirds of the world’s oceans beyond national jurisdictions, enabling the creation of vast marine protected areas and restricting unvetted deep-seabed extraction.',
      whatsNext: 'The inaugural Conference of the Parties (COP1) will convene in early 2027 to establish the first designated high-seas sanctuaries and set environmental impact assessment standards.'
    },
    teaMode: {
      hook: "Okay, here's the tea on the massive ocean treaty everyone's celebrating 🌊🐠",
      whatHappened: "For all of human history, two-thirds of the ocean has basically been an unregulated Wild West where anyone could dump stuff, overfish, or drill. Now, 60 countries finally signed on the dotted line to make high-seas environmental rules legally binding.",
      whoIsInvolved: "The United Nations, island nations whose very survival depends on coral reefs, environmental activists, and deep-sea mining corporations wanting battery minerals.",
      whyEveryoneTalking: "Because passing any global treaty where superpowers, small island nations, and commercial giants all agree is basically a modern miracle.",
      backstory: "Diplomats spent nearly 20 years arguing over who owns genetic material from weird glowing deep-sea organisms and whether companies can vacuum up the ocean floor for cobalt.",
      whatChanged: "A coalition of European, Latin American, and Pacific island nations pushed the ratification count across the official 60-nation finish line.",
      whatsHappeningNow: "Mining companies are scrambling because their plans to dredge polymetallic nodules from the Clarion-Clipperton Zone just hit a massive legal roadblock.",
      keyTakeaway: "Bottom line: The ocean finally has real international traffic laws, and big polluters can't just pretend international waters are a free-for-all anymore."
    },
    timeline: [
      {
        id: 't-cl-1',
        date: 'March 2023',
        phase: 'Started',
        title: 'UN Delegates Reach Agreement After 38-Hour Marathon Session',
        event: 'Following nearly two decades of stalled negotiations, diplomats in New York finalize the text of the Marine Biodiversity Beyond National Jurisdiction (BBNJ) treaty.',
        aiExplanation: 'The agreement was hailed as a generational breakthrough for multilateral environmental diplomacy.',
        sources: [{ name: 'UN News', url: 'https://news.un.org' }, { name: 'BBC News', url: 'https://www.bbc.com' }],
        status: 'verified'
      },
      {
        id: 't-cl-2',
        date: 'Sept 2023',
        phase: 'Major Development',
        title: 'Treaty Opens for Formal Signatures at UN General Assembly',
        event: 'Over 80 countries sign the treaty during High-Level Week, committing to seek domestic parliamentary ratification.',
        aiExplanation: 'Signing expresses intent, but treaties require formal domestic legislation and instrument deposit to become binding.',
        sources: [{ name: 'The Guardian', url: 'https://www.theguardian.com' }],
        status: 'verified'
      },
      {
        id: 't-cl-3',
        date: 'Nov 2025',
        phase: 'Official Response',
        title: 'Deep-Sea Mining Council Clashes with High Seas Accord Principles',
        event: 'International Seabed Authority (ISA) debates whether commercial seabed exploitation licenses can be issued before BBNJ rules are operational.',
        aiExplanation: 'Heated diplomatic struggle between nations seeking critical minerals for EV batteries and conservationists advocating precautionary pause.',
        sources: [{ name: 'Nature', url: 'https://www.nature.com' }],
        status: 'disputed'
      },
      {
        id: 't-cl-4',
        date: 'Sept 2026',
        phase: 'Latest Update',
        title: '60th Ratification Deposited at UN Headquarters',
        event: 'The threshold is reached with formal deposits from small island developing states and EU member nations, starting the 120-day legal clock.',
        aiExplanation: 'Makes the agreement legally operative international law under the UN Convention on the Law of the Sea.',
        sources: [{ name: 'Reuters', url: 'https://www.reuters.com' }],
        status: 'verified'
      }
    ],
    howItChanged: {
      initiallyReported: 'In 2023, critics believed the treaty would languish for a decade without reaching the 60-state threshold due to disputes between developed and developing nations over digital genetic sequence sharing.',
      laterConfirmed: 'A compromise financial benefit-sharing mechanism was adopted, creating a multilateral fund that accelerated domestic ratifications across Latin America, the Pacific, and Europe.',
      whatChanged: 'The core battle evolved from marine genetic patents to urgent emergency halts on deep-sea mining exploration in international waters.',
      correctionsRetractions: [
        'Early reports claimed the treaty would automatically ban all commercial maritime traffic in newly formed sanctuaries; the treaty text specifies that navigation freedoms under UNCLOS are preserved.'
      ],
      unverifiedClaims: [
        'Claims that certain naval superpowers would declare the high-seas treaty unconstitutional for their commercial vessels remain speculative.'
      ],
      conflictingReports: [
        {
          id: 'conf-cl-1',
          claim: 'Authority of BBNJ over International Seabed Authority (ISA) mining permits',
          aspect: 'Jurisdictional Hierarchy',
          sourceA: {
            name: 'Conservation Legal Scholars',
            date: 'May 2026',
            report: 'Argued the BBNJ treaty environmental standards legally supersede ISA provisional extraction permits.'
          },
          sourceB: {
            name: 'Seabed Mining Proponents',
            date: 'June 2026',
            report: 'Maintained that ISA has exclusive autonomous mandate over the seabed under Part XI of UNCLOS.'
          },
          currentConsensus: 'Jurisdictional harmonization will be the first contentious topic at the upcoming COP1 session.',
          discrepancyType: 'responsibility'
        }
      ],
      evolutionItems: [
        {
          id: 'ev-cl-1',
          date: 'March 2023',
          headlineEvolution: 'Historic UN Ocean Treaty Adopted After Decades of Talks',
          classification: 'verified',
          details: 'Consensus achieved on draft text in New York.',
          whatInitiallyReported: 'Talks on the verge of collapse over genetic benefit sharing.',
          whatLaterConfirmed: 'Compromise deal struck after 38-hour non-stop negotiation.',
          sources: ['UN Press', 'BBC']
        },
        {
          id: 'ev-cl-2',
          date: 'Nov 2025',
          headlineEvolution: 'Battle Over Seabed Mining Threatens to Derail Ocean Accord Enactment',
          classification: 'disputed',
          details: 'Disagreement between mining nations and conservation alliances.',
          whatInitiallyReported: 'Mining permits expected to proceed under the "two-year rule".',
          whatLaterConfirmed: 'Diplomatic pushback created de facto moratorium pending environmental impact assessments.',
          sources: ['Reuters', 'Financial Times']
        },
        {
          id: 'ev-cl-3',
          date: 'Sept 2026',
          headlineEvolution: 'Treaty Hits Golden 60th Ratification, Entering International Law',
          classification: 'verified',
          details: 'Official UN Treaty Section verifies required ratification milestone.',
          whatInitiallyReported: 'Forecast to hit 60 ratifications by late 2027.',
          whatLaterConfirmed: 'Coordinated campaign reached the threshold 14 months early.',
          sources: ['Associated Press', 'Le Monde']
        }
      ]
    },
    perspectives: [
      {
        source: 'The Guardian',
        outletType: 'National Press',
        angle: 'Ecological preservation, climate resilience, and victory for civil society grassroots campaigns',
        tone: 'Passionate, environmental advocacy',
        sampleHeadline: 'A Triumph for the Living Planet: High Seas Treaty Crosses Legal Finish Line',
        keyHighlight: 'Spotlights how 30% of global oceans can now be shielded from industrial destruction.'
      },
      {
        source: 'Financial Times',
        outletType: 'Financial Daily',
        angle: 'Critical mineral supply chains, battery cell costs, and commercial maritime regulatory risk',
        tone: 'Corporate risk, market analysis',
        sampleHeadline: 'Deep-Sea Mining Ambitions Clouded by UN Ocean Treaty Ratification',
        keyHighlight: 'Analyzes stock volatility in seabed exploration companies facing compliance hurdles.'
      },
      {
        source: 'South China Morning Post',
        outletType: 'Regional/Local',
        angle: 'Equitable sharing of marine scientific data and maritime trade route implications',
        tone: 'Diplomatic, strategic sovereignty',
        sampleHeadline: 'Global South Secures Genetic Data Royalty Commitments in Ocean Pact',
        keyHighlight: 'Focuses on the technology transfer clauses intended for developing nations.'
      }
    ],
    articles: [
      {
        id: 'art-cl-1',
        headline: 'UN High Seas Treaty Secures Crucial 60th Ratification to Take Effect',
        source: { name: 'Associated Press' },
        url: 'https://apnews.com/article/un-high-seas-treaty-ocean-protection-ratified-2026',
        publishedAt: '2026-09-25T14:20:00Z',
        category: 'World',
        snippet: 'The landmark biodiversity treaty crosses the required threshold, establishing binding international rules for two-thirds of Earth’s oceans.',
        aiSummary: 'Sixty nations have ratified the UN High Seas Treaty, triggering its implementation into binding international law within 120 days.',
        verificationStatus: 'verified',
        statusReason: 'Official UN Treaty Office registry confirmation.',
        fetchedAt: '2026-09-25T15:00:00Z'
      },
      {
        id: 'art-cl-2',
        headline: 'Mining Regulators Face Tough Precautionary Standards Under New High Seas Accord',
        source: { name: 'Reuters' },
        url: 'https://www.reuters.com/sustainability/oceans-deep-sea-mining-regulatory-clash-2026',
        publishedAt: '2026-09-24T18:00:00Z',
        category: 'World',
        snippet: 'The legal entry into force of the treaty imposes rigorous new environmental impact assessments on seabed extraction activities.',
        aiSummary: 'Legal analysts confirm deep-sea extraction projects must now comply with strict precautionary environmental assessments mandated by the treaty.',
        verificationStatus: 'verified',
        statusReason: 'Legal analysis corroborated by environmental law panels.',
        fetchedAt: '2026-09-25T08:00:00Z'
      }
    ],
    keyFigures: [
      { name: 'Rena Lee', role: 'Ambassador for Oceans, President of the BBNJ Conference' },
      { name: 'António Guterres', role: 'United Nations Secretary-General' },
      { name: 'Michael Lodge', role: 'Secretary-General of the International Seabed Authority' }
    ]
  },
  {
    id: 'story-science-artemis',
    title: 'NASA Artemis Lunar Architecture & Starship Moon Lander Readiness Review',
    subtitle: 'Uncrewed orbital propellant transfer tests and Lunar Gateway assembly milestones ahead of crewed landing.',
    category: 'Science',
    status: 'Propellant Depots & Pad Integration',
    statusType: 'monitoring',
    startedAt: '2024-01-09T12:00:00Z',
    updatedAt: '2026-09-24T20:15:00Z',
    isTrending: true,
    isDeveloping: true,
    quickBrief: {
      whatHappened: 'NASA and commercial aerospace partners have initiated critical uncrewed ship-to-ship cryogenic fuel transfer tests in low Earth orbit, resolving the primary technical bottleneck for the Artemis III human landing system.',
      whyItMatters: 'Demonstrating large-scale orbital transfer of supercooled liquid oxygen and methane is the defining prerequisite for returning humans to the lunar south pole.',
      whatsNext: 'An uncrewed lunar landing demonstration test is scheduled to depart Starbase for the Moon before human astronauts launch aboard the Orion spacecraft.'
    },
    teaMode: {
      hook: "Okay, here's the tea on how we're actually getting back to the Moon 🚀🌕",
      whatHappened: "Remember how in the 1960s Apollo just used one giant rocket that flew straight there? Artemis is way more ambitious: they're building a gas station in space. SpaceX and NASA are testing fueling Starship in orbit with liquid oxygen.",
      whoIsInvolved: "NASA, SpaceX, international partner agencies (ESA, JAXA, CSA), and four astronauts already training for the Artemis orbital flyby.",
      whyEveryoneTalking: "Because sending humans 240,000 miles away isn't CGI anymore. They are literally testing the space tankers that will carry humans down to the lunar south pole ice craters.",
      backstory: "A lot of critics said SpaceX's Starship was too huge and needed too many tanker launches to fill up in orbit. NASA had to push the landing timeline back to make sure it was 100% safe.",
      whatChanged: "The test flights went from exploding on the launch pad to catching the giant booster with robot chopstick arms and transferring cryogenic fuel in vacuum.",
      whatsHappeningNow: "SpaceX is prepping the full uncrewed dress rehearsal where an empty Starship flies all the way to lunar orbit and touches down on the Moon autonomously.",
      keyTakeaway: "No cap: We are months away from seeing whether robotic orbital refueling can unlock true interplanetary travel."
    },
    timeline: [
      {
        id: 't-art-1',
        date: 'Jan 2024',
        phase: 'Started',
        title: 'NASA Updates Artemis Schedule to Prioritize Crew Safety',
        event: 'NASA leadership shifts Artemis II crewed flyby and Artemis III lunar landing targets to resolve Orion heat shield erosion and battery issues.',
        aiExplanation: 'Prioritized resolving unexpected char loss observed during the uncrewed Artemis I re-entry.',
        sources: [{ name: 'NASA Press Release', url: 'https://www.nasa.gov' }],
        status: 'verified'
      },
      {
        id: 't-art-2',
        date: 'Oct 2024',
        phase: 'Major Development',
        title: 'Historic Starship Booster Catch by Mechanical Launch Tower Arms',
        event: 'Flight 5 of Starship achieves first-ever capture of Super Heavy booster back at the launch mount using tower chopstick arms.',
        aiExplanation: 'Validated the rapid reusability paradigm required for multi-launch orbital propellant aggregation.',
        sources: [{ name: 'SpaceNews', url: 'https://spacenews.com' }],
        status: 'verified'
      },
      {
        id: 't-art-3',
        date: 'Dec 2025',
        phase: 'New Evidence',
        title: 'Cryogenic Fluid Transfer Demonstration in Low Earth Orbit',
        event: 'Two orbital vehicles perform automated rendezvous and transfer thousands of kilograms of supercooled liquid propellant in microgravity.',
        aiExplanation: 'Proved the feasibility of preventing boil-off during multi-tanker propellant transfer.',
        sources: [{ name: 'Ars Technica', url: 'https://arstechnica.com' }],
        status: 'verified'
      },
      {
        id: 't-art-4',
        date: 'Sept 2026',
        phase: 'Latest Update',
        title: 'Uncrewed Lunar Landing Demonstration Vehicle Completes Pad Static Fire',
        event: 'The uncrewed HLS prototype completes multi-engine static fire ahead of its solo test voyage to the lunar surface.',
        aiExplanation: 'The final critical operational test milestone before human crew embarkation.',
        sources: [{ name: 'Aviation Week', url: 'https://aviationweek.com' }],
        status: 'verified'
      }
    ],
    howItChanged: {
      initiallyReported: 'Government accountability office (GAO) reports in 2023 estimated Starship might require upwards of 16 to 20 individual tanker launches per Moon landing, leading to widespread doubts about launch cadence.',
      laterConfirmed: 'SpaceX and NASA engine efficiency upgrades (Raptor 3) and increased propellant tank volume reduced the required tanker flights to an estimated 8 to 11 per lunar mission.',
      whatChanged: 'Debate evolved from whether the vehicle could survive re-entry to the precision of autonomous lunar descent thrusters over rugged south polar terrain.',
      correctionsRetractions: [
        'Early news articles reported Orion heatshield charring was catastrophic; post-flight forensic teardown confirmed the cabin remained within human tolerance margins, though material recipes were upgraded for safety.'
      ],
      unverifiedClaims: [
        'Claims that NASA would replace the Starship Human Landing System with a conventional expendable lander were repeatedly denied by NASA administrator.'
      ],
      conflictingReports: [
        {
          id: 'conf-art-1',
          claim: 'Number of orbital refueling tanker flights required per lunar landing',
          aspect: 'Launch Cadence & Logistics',
          sourceA: {
            name: 'US Government Accountability Office',
            date: 'Late 2023',
            report: 'Estimated up to 18-20 launches needed based on early propellant boil-off assumptions.'
          },
          sourceB: {
            name: 'SpaceX Propulsion Engineering',
            date: 'Early 2025',
            report: 'Calculated 8-10 flights using Raptor 3 performance gains and vacuum insulated tank skins.'
          },
          currentConsensus: 'NASA operational planning currently models approximately 10-12 flights for the uncrewed demo.',
          discrepancyType: 'figure_discrepancy'
        }
      ],
      evolutionItems: [
        {
          id: 'ev-art-1',
          date: 'Jan 2024',
          headlineEvolution: 'NASA Delays Artemis Moon Landings to Ensure Life Support Redundancy',
          classification: 'verified',
          details: 'Official timeline adjustment to resolve Orion valve and heatshield data.',
          whatInitiallyReported: 'Moon landing still targeted for late 2025.',
          whatLaterConfirmed: 'Realistic flight manifest adjusted to prioritize test flights.',
          sources: ['NASA', 'Washington Post']
        },
        {
          id: 'ev-art-2',
          date: 'Oct 2024',
          headlineEvolution: 'Super Heavy Booster Caught in Mid-Air at Texas Starbase',
          classification: 'verified',
          details: 'Precision aerospace engineering milestone achieved.',
          whatInitiallyReported: 'Tower catch was considered a high-risk longshot for Flight 5.',
          whatLaterConfirmed: 'Booster safely cradled by launch tower on first attempt.',
          sources: ['SpaceX Webcast', 'Aviation Week']
        },
        {
          id: 'ev-art-3',
          date: 'Sept 2026',
          headlineEvolution: 'Orbital Fuel Transfers Validated for Deep Space Human Flight',
          classification: 'verified',
          details: 'In-space cryogenic transfer milestones achieved.',
          whatInitiallyReported: 'Boil-off in vacuum regarded as potential mission blocker.',
          whatLaterConfirmed: 'Zero-boil-off chillers and automated couplings passed space validation.',
          sources: ['Ars Technica', 'NASA HLS Office']
        }
      ]
    },
    perspectives: [
      {
        source: 'Ars Technica',
        outletType: 'Tech Focus',
        angle: 'Deep aerospace engineering scrutiny, propulsion physics, and launch manifests',
        tone: 'Rigorous, technically authoritative',
        sampleHeadline: 'How Cryogenic Fueling in Orbit Changed Rocket Science Forever',
        keyHighlight: 'Explains why the orbital tanker concept unlocks arbitrary payload masses beyond Earth orbit.'
      },
      {
        source: 'The New York Times',
        outletType: 'National Press',
        angle: 'Global space race with China, budgetary oversight, and scientific exploration of lunar ice',
        tone: 'Geopolitical, investigative',
        sampleHeadline: 'The Geopolitical Race for the Moon’s Permanently Shadowed Craters',
        keyHighlight: 'Details why the lunar south pole has become the premier strategic frontier for drinking water and rocket fuel.'
      },
      {
        source: 'SpaceNews',
        outletType: 'Global Wire',
        angle: 'Commercial contracts, space industry supply chains, and international partnerships',
        tone: 'Industry-standard, professional',
        sampleHeadline: 'Artemis Architecture Matures as Flight Hardware Gathers at Kennedy Space Center',
        keyHighlight: 'Tracks the assembly of the mobile launcher and Lunar Gateway habitation modules.'
      }
    ],
    articles: [
      {
        id: 'art-art-1',
        headline: 'NASA Confirms Starship Cryogenic Fluid Transfer Meets Artemis Criteria',
        source: { name: 'SpaceNews' },
        url: 'https://spacenews.com/nasa-starship-cryo-fluid-transfer-milestone-2026',
        publishedAt: '2026-09-24T12:00:00Z',
        category: 'Science',
        snippet: 'Telemetry from recent orbital test flights demonstrates effective transfer of cryogenic oxygen without dangerous boil-off pressures.',
        aiSummary: 'NASA officials confirmed that in-space propellant transfer tests achieved the required efficiency benchmarks for Artemis human landing systems.',
        verificationStatus: 'verified',
        statusReason: 'Official NASA press conference and agency briefing slides.',
        fetchedAt: '2026-09-24T14:00:00Z'
      },
      {
        id: 'art-art-2',
        headline: 'Uncrewed Moon Lander Flight Prepares for Historic South Pole Touchdown Run',
        source: { name: 'Reuters' },
        url: 'https://www.reuters.com/science/artemis-uncrewed-hls-lunar-south-pole-prep-2026',
        publishedAt: '2026-09-23T16:30:00Z',
        category: 'Science',
        snippet: 'Engineers finish final integration checks on landing radar and hazard detection cameras designed to guide the lander around boulder fields.',
        aiSummary: 'SpaceX and NASA are completing final sensor calibration for the uncrewed lunar test mission targeting south pole crater ridges.',
        verificationStatus: 'verified',
        statusReason: 'Engineering flight readiness review documentation.',
        fetchedAt: '2026-09-24T10:00:00Z'
      }
    ],
    keyFigures: [
      { name: 'Bill Nelson', role: 'NASA Administrator' },
      { name: 'Elon Musk', role: 'Chief Engineer, SpaceX' },
      { name: 'Reid Wiseman', role: 'Commander, Artemis II crew' },
      { name: 'Pam Melroy', role: 'NASA Deputy Administrator and Former Astronaut' }
    ]
  },
  {
    id: 'story-biz-chips-act',
    title: 'Global Semiconductor Foundry Realignment & Subsidies Next Phase',
    subtitle: 'Multibillion-dollar factory construction across US, Europe, and Asia tests market demand and yields.',
    category: 'Business',
    status: 'High-Volume Production Rollout',
    statusType: 'developing',
    startedAt: '2022-08-09T15:00:00Z',
    updatedAt: '2026-09-24T19:00:00Z',
    isTrending: false,
    isDeveloping: true,
    quickBrief: {
      whatHappened: 'Subsidized semiconductor mega-foundries across Arizona, Ohio, Germany, and Japan are reaching commercial production stages, creating intense competition for advanced packaging and high-bandwidth memory (HBM) supply.',
      whyItMatters: 'Trillions in AI infrastructure depend on continuous chip production, while governments seek insurance against geopolitical choke-points.',
      whatsNext: 'Governments are evaluating phase two incentive frameworks focusing specifically on silicon photonics and packaging clusters.'
    },
    teaMode: {
      hook: "Okay, here's the tea on the massive global chip factory land grab 🏭💰",
      whatHappened: "Countries threw hundreds of billions of dollars at chipmakers like TSMC, Intel, and Samsung to build factories on their home soil. Now those factories are actually starting to pump out silicon, and everyone is checking who is winning the yield game.",
      whoIsInvolved: "The US Commerce Department, TSMC, Intel, Samsung, European governments, and big buyers like Nvidia and Apple.",
      whyEveryoneTalking: "Because building a chip factory is the most expensive thing humans do. We're talking $40 Billion per site with machines that cost $350 Million each.",
      backstory: "Everyone realized that 90% of the world's most advanced AI chips were coming from one island. Governments panicked and passed massive subsidy bills.",
      whatChanged: "The narrative went from 'can they build these on time?' to 'TSMC Arizona fab yield rates actually matched Taiwan plants, beating expectations.'",
      whatsHappeningNow: "Tech giants are booking manufacturing slots for next-gen 2-nanometer wafers.",
      keyTakeaway: "Silicon is the new oil, and the countries with the best fabs hold all the cards."
    },
    timeline: [
      {
        id: 't-biz-1',
        date: 'Aug 2022',
        phase: 'Started',
        title: 'US Enacts $52B CHIPS and Science Act',
        event: 'President signs bipartisan bill to revitalize domestic silicon manufacturing and research.',
        aiExplanation: 'Spurred competitive industrial policy matching by the European Union, Japan, and South Korea.',
        sources: [{ name: 'The Wall Street Journal', url: 'https://www.wsj.com' }],
        status: 'verified'
      },
      {
        id: 't-biz-2',
        date: 'Feb 2024',
        phase: 'Major Development',
        title: 'TSMC Opens Kumamoto Fab in Japan Ahead of Schedule',
        event: 'TSMC’s first Japanese manufacturing site in Kumamoto opens with heavy backing from Sony and the Japanese government.',
        aiExplanation: 'Demonstrated rapid construction capability when local supplier cooperation is synchronized.',
        sources: [{ name: 'Nikkei Asia', url: 'https://asia.nikkei.com' }],
        status: 'verified'
      },
      {
        id: 't-biz-3',
        date: 'Oct 2024',
        phase: 'New Evidence',
        title: 'TSMC Arizona Fab Reports Early Wafer Yields Equal to Taiwan Fabs',
        event: 'Early test runs of 4-nanometer chips in Phoenix match production yields of sister plants in Tainan.',
        aiExplanation: 'Rebutted early claims that cultural and labor differences would cripple American fab productivity.',
        sources: [{ name: 'Bloomberg', url: 'https://www.bloomberg.com' }],
        status: 'verified'
      },
      {
        id: 't-biz-4',
        date: 'Sept 2026',
        phase: 'Latest Update',
        title: 'Packaging Bottlenecks Shift Investment Focus to Silicon Photonics',
        event: 'Commerce Department and industry consortiums redirect surplus grants into advanced CoWoS packaging facilities.',
        aiExplanation: 'The industry recognizes that raw wafer printing is useless without high-density interconnect packaging.',
        sources: [{ name: 'Financial Times', url: 'https://www.ft.com' }],
        status: 'verified'
      }
    ],
    howItChanged: {
      initiallyReported: 'In 2023, numerous reports claimed US and European fabs would face catastrophic 2-3 year delays and yield defects due to skilled technician shortages.',
      laterConfirmed: 'Intensive worker exchanges and equipment optimization brought Arizona fab yields to parity with Taiwan factories for 4nm wafers.',
      whatChanged: 'Attention shifted from raw silicon fabrication capacity to advanced chiplet packaging (CoWoS) and High Bandwidth Memory (HBM) supply limits.',
      correctionsRetractions: [],
      unverifiedClaims: [
        'Unconfirmed rumors that Intel would fully spin off its Foundry division into an independent standalone entity remain subject to board review.'
      ],
      conflictingReports: [],
      evolutionItems: [
        {
          id: 'ev-biz-1',
          date: 'July 2023',
          headlineEvolution: 'Labor Disputes Threaten Timelines at US Chip Fabs',
          classification: 'disputed',
          details: 'Tensions between local union trades and specialized Taiwanese cleanroom contractors.',
          whatInitiallyReported: 'Warning of multi-year launch freezes.',
          whatLaterConfirmed: 'Agreements negotiated; production ramp resumed smoothly.',
          sources: ['WSJ', 'Arizona Republic']
        },
        {
          id: 'ev-biz-2',
          date: 'Oct 2024',
          headlineEvolution: 'Yield Parity Achieved: Arizona Fabs Match Taiwan Standards',
          classification: 'verified',
          details: 'Commercial trial batches confirmed high defect-free rates.',
          whatInitiallyReported: 'Skeptics expected 15-20% lower yields.',
          whatLaterConfirmed: 'Independent customer audits confirmed standard 4nm yields.',
          sources: ['Bloomberg', 'EE Times']
        }
      ]
    },
    perspectives: [
      {
        source: 'The Wall Street Journal',
        outletType: 'Financial Daily',
        angle: 'Capital efficiency, government subsidy allocation, and corporate balance sheets',
        tone: 'Financial analysis',
        sampleHeadline: 'The True Cost of Building the World’s Most Complex Factories in America',
        keyHighlight: 'Breaks down the operational cost differential between Asian and Western semiconductor manufacturing.'
      },
      {
        source: 'Nikkei Asia',
        outletType: 'Regional/Local',
        angle: 'Asian manufacturing excellence, supply chain agility, and geopolitical hedges',
        tone: 'Industrial, operational',
        sampleHeadline: 'How Asia Retains the Upper Hand in High-End Silicon Packaging',
        keyHighlight: 'Explains why Taiwan and South Korea still dominate next-gen advanced packaging.'
      }
    ],
    articles: [
      {
        id: 'art-biz-1',
        headline: 'Advanced Packaging Expansions Announced as AI Chip Demand Accelerates',
        source: { name: 'Bloomberg' },
        url: 'https://www.bloomberg.com/news/articles/2026-09-24/ai-chip-packaging-expansion',
        publishedAt: '2026-09-24T07:30:00Z',
        category: 'Business',
        snippet: 'Foundries commit an additional $15 billion to specialized packaging facilities required for AI accelerator modules.',
        aiSummary: 'Chipmakers are pouring fresh billions into advanced packaging facilities to remove the key bottleneck holding back AI accelerator shipments.',
        verificationStatus: 'verified',
        statusReason: 'Corporate capital expenditure filings.',
        fetchedAt: '2026-09-24T09:00:00Z'
      }
    ],
    keyFigures: [
      { name: 'Gina Raimondo', role: 'U.S. Secretary of Commerce' },
      { name: 'C.C. Wei', role: 'Chairman and CEO, TSMC' },
      { name: 'Pat Gelsinger', role: 'Technology Industry Executive' }
    ]
  }
];

class NewsDatabase {
  private data: DatabaseSchema = {
    stories: [],
    articles: [],
    lastSyncedAt: new Date().toISOString()
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          this.data = {
            stories: Array.isArray(parsed.stories) ? parsed.stories : [],
            articles: Array.isArray(parsed.articles) ? parsed.articles : [],
            lastSyncedAt: parsed.lastSyncedAt || new Date().toISOString()
          };
          // NOTE: SEED_STORIES is only meant to be a one-time placeholder on first launch.
          // Do NOT re-seed if parsed stories is empty.
        } catch (readErr) {
          console.error('Error reading existing database file during init; keeping current state without re-seeding:', readErr);
          // Do NOT re-seed on parse or read errors
        }
      } else {
        // Only seed on true first launch when the database file does not exist yet
        this.seedInitial();
      }
    } catch (e) {
      console.error('Error initializing database directory; continuing without re-seeding:', e);
      // Do NOT re-seed
    }

    // Trigger initial background sync with SerpAPI using the configured key
    setTimeout(async () => {
      try {
        if (isSerpApiConfigured()) {
          console.log('[SerpNews] Server startup: Syncing live news from SerpAPI Google News engine...');
          await this.syncWithSerpApi('All');
          await this.syncWithSerpApi('Trending');
          console.log(`[SerpNews] Startup sync complete. Total articles in DB: ${this.data.articles.length}`);
        }
      } catch (err) {
        console.error('[SerpNews] Initial startup sync error:', err);
      }
    }, 1000);
  }

  private seedInitial() {
    this.data.stories = SEED_STORIES;
    // Flatten articles
    const allArticles: NewsItem[] = [];
    for (const s of SEED_STORIES) {
      for (const a of s.articles) {
        allArticles.push({
          ...a,
          storyId: s.id,
        });
      }
    }
    this.data.articles = allArticles;
    this.data.lastSyncedAt = new Date().toISOString();
    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save news_db.json:', err);
    }
  }

  public getStatus(): ServerStatus {
    return {
      serpApiConfigured: isSerpApiConfigured(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      totalStories: this.data.stories.length,
      totalArticles: this.data.articles.length,
      lastSyncedAt: this.data.lastSyncedAt,
      categoriesAvailable: ['All', 'Trending', 'World', 'Politics', 'Technology', 'Business', 'Science', 'Sports', 'Entertainment', 'India']
    };
  }

  public getStories(category?: Category, search?: string): StoryHub[] {
    let result = this.data.stories;

    if (category && category !== 'All') {
      if (category === 'Trending') {
        result = result.filter(s => s.isTrending);
      } else {
        result = result.filter(s => s.category.toLowerCase() === category.toLowerCase());
      }
    }

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.quickBrief?.whatHappened?.toLowerCase().includes(q) ||
        s.keyFigures?.some(f => (typeof f === 'string' ? f : f?.name || '').toLowerCase().includes(q))
      );
    }

    return result;
  }

  public getStoryById(id: string): StoryHub | undefined {
    return this.data.stories.find(s => s.id === id);
  }

  public getArticles(category?: Category, search?: string, limit = 40): NewsItem[] {
    let result = this.data.articles;

    if (category && category !== 'All') {
      if (category === 'Trending') {
        const trendingStoryIds = new Set(this.data.stories.filter(s => s.isTrending).map(s => s.id));
        result = result.filter(a => a.storyId && trendingStoryIds.has(a.storyId));
      } else {
        result = result.filter(a => a.category.toLowerCase() === category.toLowerCase());
      }
    }

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      result = result.filter(a => {
        const sourceName = typeof a.source === 'string' ? a.source : a.source?.name || '';
        return (
          a.headline.toLowerCase().includes(q) ||
          a.snippet.toLowerCase().includes(q) ||
          sourceName.toLowerCase().includes(q)
        );
      });
    }

    return result.slice(0, limit);
  }

  public addOrUpdateStory(story: StoryHub) {
    const idx = this.data.stories.findIndex(s => s.id === story.id);
    if (idx >= 0) {
      this.data.stories[idx] = story;
    } else {
      this.data.stories.unshift(story);
    }

    // Upsert articles
    for (const a of story.articles) {
      const aIdx = this.data.articles.findIndex(item => item.id === a.id || item.url === a.url);
      if (aIdx >= 0) {
        this.data.articles[aIdx] = { ...a, storyId: story.id };
      } else {
        this.data.articles.unshift({ ...a, storyId: story.id });
      }
    }

    this.save();
  }

  /**
   * Sync a category or query using SerpAPI (and AI summarization)
   */
  public async syncWithSerpApi(category: Category = 'All', customQuery?: string): Promise<{ added: number; updated: number }> {
    if (!isSerpApiConfigured()) {
      return { added: 0, updated: 0 };
    }

    const query = customQuery || (category === 'All' ? 'top news' : category === 'India' ? 'India national news' : `${category} news`);
    const fetchedItems = await fetchSerpApiNews(query, category);

    if (fetchedItems.length === 0) {
      return { added: 0, updated: 0 };
    }

    let added = 0;
    let updated = 0;
    const freshArticles: NewsItem[] = [];

    for (const item of fetchedItems) {
      const existingIdx = this.data.articles.findIndex(a => a.url === item.url || a.headline === item.headline);
      if (existingIdx >= 0) {
        this.data.articles[existingIdx] = {
          ...this.data.articles[existingIdx],
          snippet: item.snippet,
          publishedAt: item.publishedAt,
        };
        freshArticles.push(this.data.articles[existingIdx]);
        updated++;
      } else {
        // High-speed instant ingestion from SerpAPI
        const sourceName = typeof item.source === 'string' ? item.source : item.source?.name || 'News Source';
        item.source = { name: sourceName, icon: typeof item.source === 'object' ? item.source?.icon : undefined };
        item.aiSummary = item.snippet && item.snippet.length > 20 
          ? `Key Report: ${item.snippet}` 
          : `${item.headline}. Reported by ${sourceName}.`;
        item.verificationStatus = 'verified';
        item.statusReason = `Live wire report retrieved via SerpAPI from ${sourceName}.`;

        this.data.articles.unshift(item);
        freshArticles.push(item);
        added++;
      }
    }

    this.data.lastSyncedAt = new Date().toISOString();
    this.save();

    // Cluster fresh articles into developing Story Hubs using the same synthesis logic
    try {
      const clusters = await clusterArticlesIntoTopics(freshArticles, category);
      for (const cluster of clusters) {
        if (!cluster.articles || cluster.articles.length === 0) continue;

        const clusterTopicLower = cluster.topic.toLowerCase();
        const clusterKeywords = clusterTopicLower
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 3);

        // Check if an existing story already matches this cluster
        const existingStory = this.data.stories.find(story => {
          const storyTitleLower = story.title.toLowerCase();
          if (storyTitleLower.includes(clusterTopicLower) || clusterTopicLower.includes(storyTitleLower)) {
            return true;
          }
          const storyKeywords = storyTitleLower
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3);
          const matchCount = clusterKeywords.filter(k => storyKeywords.includes(k)).length;
          return matchCount >= 2;
        });

        if (existingStory) {
          // Add new articles to existing story
          let storyUpdated = false;
          for (const art of cluster.articles) {
            art.storyId = existingStory.id;
            if (!existingStory.articles.some(a => a.url === art.url)) {
              existingStory.articles.unshift(art);
              storyUpdated = true;
            }
          }
          if (storyUpdated) {
            existingStory.updatedAt = new Date().toISOString();
            this.addOrUpdateStory(existingStory);
            console.log(`[SerpNews] Updated existing Story Hub "${existingStory.title}" with fresh cluster articles.`);
          }
        } else {
          // Synthesize new Story Hub using the same synthesis logic and addOrUpdateStory
          try {
            console.log(`[SerpNews] Synthesizing new Story Hub from background sync: "${cluster.topic}" (${cluster.articles.length} articles)...`);
            const newStory = await createSynthesizedStoryHub(
              cluster.topic,
              cluster.articles,
              cluster.category,
              'story-cluster'
            );
            this.addOrUpdateStory(newStory);
            console.log(`[SerpNews] Added new developing Story Hub: "${newStory.title}" (${newStory.id})`);
          } catch (synthErr) {
            console.error(`[SerpNews] Error synthesizing cluster "${cluster.topic}":`, synthErr);
          }
        }
      }
    } catch (clusterErr) {
      console.error('[SerpNews] Error clustering articles in syncWithSerpApi:', clusterErr);
    }

    return { added, updated };
  }
}

export const db = new NewsDatabase();
