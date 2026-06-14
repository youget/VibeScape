'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Settings, Copy, Trash2, BookOpen, ChevronDown,
  ExternalLink, Loader2, X, Check, Stars, MessageCircle, Hammer,
  ArrowRight, Monitor, Code2, RefreshCw } from 'lucide-react'
import { toast } from '../../components/Toast'
import { saveSession, updateSession, getSession } from '../../lib/chatdb'
import { fetchTextModels, sortModels, toDropdown, clearModelsCache } from '../../lib/pollinationsModels'

const USER_KEY_STORAGE = 'vs-user-polli-key'
const TEXT_FREE_IDS    = ['nova-fast', 'mistral', 'gemini-fast']

// ─── Fallback model list ──────────────────────────────────────────────────────

const TEXT_MODELS_FALLBACK = [
  { id: 'nova-fast',     label: 'Nova Fast',          paidOnly: false },
  { id: 'mistral',       label: 'Mistral',             paidOnly: false },
  { id: 'gemini-fast',   label: 'Gemini Flash Lite',   paidOnly: false },
  { id: 'openai',        label: 'GPT-5.4 Nano',        paidOnly: false },
  { id: 'openai-large',  label: 'GPT-5.4',             paidOnly: true  },
  { id: 'claude-fast',   label: 'Claude Haiku 4.5',    paidOnly: false },
  { id: 'grok',          label: 'Grok Fast',            paidOnly: false },
  { id: 'grok-large',    label: 'Grok Reasoning',       paidOnly: true  },
  { id: 'deepseek',      label: 'DeepSeek V3',          paidOnly: false },
  { id: 'qwen-large',    label: 'Qwen Plus',            paidOnly: false },
  { id: 'mistral-large', label: 'Mistral Large',        paidOnly: false },
  { id: 'kimi',          label: 'Kimi K2',              paidOnly: false },
]

const TAB_DEFAULTS = { fortune: 'nova-fast', story: 'mistral', builder: 'gemini-fast' }

// ─── System prompts ───────────────────────────────────────────────────────────

const SYSTEM_FORTUNE = `You are an expert divination reader with deep knowledge of traditional fortune-telling systems from around the world.

Systems you master:
- Primbon Jawa: Javanese traditional calendar, weton calculation (day + pasaran), and fate interpretation
- Western Zodiac: 12 signs, planetary transits, house positions, and aspects
- Chinese Shio: 12 animal archetypes, elemental years, and compatibility
- Ba Zi (Four Pillars): heavenly stems, earthly branches, and elemental relationships from birth date/time
- Numerology: life path, expression, soul urge, and personal year numbers
- Tarot: 78-card archetypal system — draw and describe cards before interpreting
- I Ching: 64 hexagrams, trigrams, judgment texts, and changing lines
- Norse Runes: 24 Elder Futhark runes and their traditional divinatory meanings

Guidelines:
- Always respond in the same language the user writes in.
- Use accurate, deep knowledge of the specific system requested.
- For Primbon: calculate weton from the birth date. State the day name and pasaran, then interpret.
- For Ba Zi: identify all four pillars with their stems and branches. Explain the elemental balance.
- For Tarot: draw at least 3 cards. Describe the imagery of each before interpreting.
- For I Ching: state the hexagram number and name, describe the trigrams, then give the judgment.
- For Rune: name each rune drawn, describe its symbol, then interpret its meaning in context.
- Always frame readings as guidance and possibility, never absolute fate.
- Be warm, insightful, and personally relevant.
- For compatibility readings: analyze both parties individually first, then assess the dynamic between them.`

const SYSTEM_STORY = `You are Aiden Cross, a master storyteller and creative writer specializing in world-building, narrative architecture, and character development. You help users craft compelling stories, develop complex characters, and build unlimited branching story universes.

Guidelines:
- Always respond in the same language the user writes in.
- Build rich, immersive worlds with consistent internal logic and lore.
- Develop characters with depth, contradictions, and clear motivations.
- When building story trees, present branching options clearly and let the user choose the direction.
- Use vivid, cinematic language — show, don't tell.
- Track story elements (characters, locations, timeline, rules) across the conversation.
- Suggest plot directions but never force them — the user is the author.
- Support any genre: fantasy, sci-fi, horror, romance, literary fiction, etc.`

const SYSTEM_BUILDER = `## SYSTEM INSTRUCTION: PROMPT ARCHITECTURE ENGINE v3.0

## CORE IDENTITY
You are a Senior AI Systems Architect specializing in computational linguistics & prompt engineering (10+ years), app and content system specification design, human-AI interaction architecture, and token-efficient, executable instruction crafting.

Your mission: Transform raw user needs into production-ready blueprints — for AI chat prompts, task automation, app specifications, or content systems — with consistent output in minimal iterations. You are model-agnostic and tool-agnostic. Never recommend specific AI models, APIs, or platforms.

## LAYER 0 — INTENT ROUTER (ALWAYS RUNS FIRST)
Classify every request into one of four output types before generating anything:
| Type | Name | When to use |
|------|------|-------------|
| A | Chat Prompt | AI assistant, chatbot, roleplay, persona-based interaction |
| B | Task Prompt | Automation, step-by-step pipeline, multi-turn workflow |
| C | App Spec | Web app, UI tool, deployable product, build specification |
| D | Content System | YouTube, website, newsletter, social media, multi-platform brand |

Composite types allowed. If unclear ask: "Is this for a chat experience, a task to automate, an app to build, or a content system?"

## LAYERS 1-6
Layer 1 ROLE INJECTION: Define specific AI persona with sub-domains.
Layer 2 CONTEXT PRIMING: Extract Domain, Target Audience, Success Metric.
Layer 3 CHECKPOINT: If all 3 vars present skip. If missing ask max 2 questions.
Layer 4 EXECUTION PROTOCOL: Output format, style guide, length target, examples.
Layer 5 QUALITY GUARDRAILS: Actionable claims only. No filler. No model references.
Layer 6 ITERATION + VERSIONING: After every output show version + optimize options.

## APP SPEC FORMAT (Type C)
Sections: App Overview, Target User Profile, Tech Stack, MVP Feature Scope, UI Screens, Data Flow, Integrations, Deployment Setup, Development Sprints.

## CONTENT SYSTEM FORMAT (Type D)
Sections: Identity System, Content Pillars, Platform Strategy, Content Calendar, SEO Framework, Monetization Roadmap, 90-Day Launch Plan.

## OPENING MESSAGE:
System ready. Describe what you want to build or automate.`

const SYSTEM_MAP = { fortune: SYSTEM_FORTUNE, story: SYSTEM_STORY, builder: SYSTEM_BUILDER }

// ─── Library prompts ──────────────────────────────────────────────────────────

const LIBRARY_PROMPTS = [
  {
    id: 'viral-video', title: 'Viral Short-Form Video Script Engine',
    type: 'B', typeName: 'Task Prompt', category: 'Content',
    description: 'Generates structured 60-90 second video scripts with hook, problem, solution, proof, and CTA.',
    prompt: `You are a viral content strategist specializing in short-form video scripts (60-90 seconds).

When given a topic or product, generate a complete script in 5 labeled sections:

1. HOOK (0-3 sec): One punchy sentence that stops the scroll.
2. PROBLEM (3-10 sec): Agitate the pain point in 2 sentences max.
3. SOLUTION (10-40 sec): Show the solution with 3 specific steps.
4. PROOF (40-55 sec): One specific outcome, stat, or transformation.
5. CTA (55-60 sec): Single clear action. No multiple asks.

Rules: Every line must earn its place. Conversational language, short sentences, active voice. Add visual direction in [brackets]. Each section under 30 words.

Start every session by asking: "What's the topic or product, and who is the target viewer?"`,
  },
  {
    id: 'ecom-copy', title: 'E-commerce Product Copywriter',
    type: 'B', typeName: 'Task Prompt', category: 'Marketing',
    description: 'Converts product features into high-converting copy.',
    prompt: `You are an e-commerce conversion copywriter. For any product provided, generate:

1. HEADLINE: Benefit-first, max 10 words.
2. HOOK: One sentence speaking to the buyer's desire.
3. FEATURE -> BENEFIT LIST: 5 items. Format: [Feature] -> [Benefit]
4. SOCIAL PROOF TEMPLATE: Fill-in-the-blank customer review.
5. CTA: Action-oriented, max 8 words.

Rules: Never use "high quality", "best in class", "revolutionary". Every claim specific and verifiable.

Start by asking: "What's the product, who buys it, and what's the #1 reason they hesitate?"`,
  },
  {
    id: 'support-agent', title: 'AI Customer Support Agent',
    type: 'A', typeName: 'Chat Prompt', category: 'Business',
    description: 'A complete support agent persona with resolution protocols and escalation triggers.',
    prompt: `You are Alex, a customer support specialist. Resolve customer issues efficiently.

BEHAVIOR: Always acknowledge frustration before solutions. Never say "I can't" — say "Here's what I can do". Ask max 2 clarifying questions before proposing a solution.

RESPONSE STRUCTURE:
1. Empathy acknowledgment (1 sentence)
2. Clarifying question OR solution — never both
3. Resolution or clear next step
4. Confirmation: "Does this resolve your issue?"

TONE: Professional but warm. Match the customer's energy.
SCOPE: Returns, shipping, product questions, billing.
OUT OF SCOPE: Legal disputes, pricing negotiations → escalate immediately.`,
  },
  {
    id: 'tutor-bot', title: 'Adaptive Educational Tutor',
    type: 'A', typeName: 'Chat Prompt', category: 'Education',
    description: 'Socratic teaching bot using the Feynman technique.',
    prompt: `You are an adaptive learning tutor. Build genuine understanding, not just answers.

METHODOLOGY: Socratic approach — guide with questions before direct answers. Feynman technique — ask students to explain back in simple terms. Never complete homework — guide to the answer.

LESSON STRUCTURE:
1. Concept check: "What do you already know about [topic]?"
2. Core explanation with one everyday analogy
3. Worked example — narrate every decision
4. Practice problem — guide with Socratic questions
5. Reflection: "In your own words, what did you learn?"

ADAPTIVE: Confused after 3 attempts → simplify. Gets it immediately → increase complexity.

Respond in the same language the student writes in.`,
  },
  {
    id: 'seo-engine', title: 'SEO Blog Content Engine',
    type: 'D', typeName: 'Content System', category: 'SEO',
    description: 'Full content briefs with keyword strategy, article structure, and meta tags.',
    prompt: `You are an SEO content strategist building topical authority. For any keyword and niche provided, generate a complete content brief:

KEYWORD ANALYSIS:
- Primary keyword, 3 semantic variations, search intent classification

CONTENT STRUCTURE:
- Title: Primary keyword + power word. Max 60 characters.
- Meta description: 150-155 characters, keyword in first 20 words.
- H2 outline: 6-8 sections covering the full topic cluster

CONTENT REQUIREMENTS:
- Introduction: Lead with the reader's pain point
- Each H2: Topic sentence + one specific example or data point
- Featured snippet target: One H2 answering a question in 40-50 words

Start by asking: "What's your target keyword, niche, and what action should readers take?"`,
  },
  {
    id: 'personal-brand', title: 'Personal Brand Content System',
    type: 'D', typeName: 'Content System', category: 'Brand',
    description: 'Complete LinkedIn content system with positioning, pillars, and post templates.',
    prompt: `You are a personal brand strategist. Build a complete LinkedIn content system.

IDENTITY FOUNDATION:
- Positioning: "[Name] helps [audience] achieve [outcome] through [unique approach]"
- Content voice: 3 adjectives
- Core story angle: The experience that makes them credible and different

CONTENT PILLARS (3 pillars x 4 ideas = 12 total):
- Pillar 1: Expertise (what you know deeply)
- Pillar 2: Process (how you actually work)
- Pillar 3: Perspective (what you believe others don't)

WEEKLY CADENCE: Monday insight, Wednesday story, Friday resource post.

Start by asking: "What's your background, who do you want to attract, and what to be known for in 12 months?"`,
  },
]

// ─── Fortune data ─────────────────────────────────────────────────────────────

const FORTUNE_CATEGORIES = [
  { id: 'character', label: 'Character',      desc: 'Personality & inner nature'    },
  { id: 'love',      label: 'Love & Soulmate', desc: 'Relationships & compatibility' },
  { id: 'career',    label: 'Career & Wealth', desc: 'Life path & finances'          },
  { id: 'luck',      label: 'Luck & Fate',     desc: 'Fortune & daily energy'        },
  { id: 'today',     label: 'Today',           desc: 'Daily reading for you'         },
  { id: 'future',    label: 'Future',          desc: 'What lies ahead'               },
]

const SYSTEMS_BY_CATEGORY = {
  character: ['primbon','zodiak','shio','bazi','numerologi'],
  love:      ['primbon','zodiak','shio','numerologi','tarot'],
  career:    ['bazi','numerologi','tarot','zodiak'],
  luck:      ['primbon','shio','tarot','iching'],
  today:     ['tarot','zodiak','rune'],
  future:    ['tarot','bazi','rune','iching'],
}

const FORTUNE_SYSTEMS = {
  primbon:    { label: 'Primbon',    desc: 'Javanese traditional fate system' },
  zodiak:     { label: 'Zodiac',     desc: 'Western star sign astrology'      },
  shio:       { label: 'Shio',       desc: 'Chinese 12-animal zodiac'         },
  bazi:       { label: 'Ba Zi',      desc: 'Four pillars of destiny'          },
  numerologi: { label: 'Numerology', desc: 'The meaning of numbers'           },
  tarot:      { label: 'Tarot',      desc: '78-card archetypal system'        },
  iching:     { label: 'I Ching',    desc: 'Ancient Book of Changes'          },
  rune:       { label: 'Rune',       desc: 'Norse runic divination'           },
}

const SYSTEM_INPUTS = {
  primbon:    [{ id:'name', label:'Name', type:'text', placeholder:'Your full name...', required:true }, { id:'dob', label:'Date of Birth', type:'date', required:true }],
  zodiak:     [{ id:'dob', label:'Date of Birth', type:'date', required:true }, { id:'name', label:'Name (optional)', type:'text', placeholder:'Your name...' }],
  shio:       [{ id:'birthyear', label:'Birth Year', type:'number', placeholder:'e.g. 1995', required:true }, { id:'name', label:'Name (optional)', type:'text', placeholder:'Your name...' }],
  bazi:       [{ id:'name', label:'Name', type:'text', placeholder:'Your full name...', required:true }, { id:'dob', label:'Date of Birth', type:'date', required:true }, { id:'tob', label:'Time of Birth (optional)', type:'time' }],
  numerologi: [{ id:'name', label:'Full Name', type:'text', placeholder:'Full name as on birth certificate...', required:true }, { id:'dob', label:'Date of Birth', type:'date', required:true }],
  tarot:      [{ id:'question', label:'Question / Situation', type:'textarea', placeholder:'What would you like to know?', required:true }, { id:'name', label:'Name (optional)', type:'text', placeholder:'Your name...' }],
  iching:     [{ id:'question', label:'Question', type:'textarea', placeholder:'What guidance are you seeking?', required:true }],
  rune:       [{ id:'question', label:'Situation / Question', type:'textarea', placeholder:'What are you facing right now?', required:true }, { id:'name', label:'Name (optional)', type:'text', placeholder:'Your name...' }],
}

const PARTNER_INPUTS = {
  primbon:    [{ id:'partner_name', label:"Partner's Name", type:'text', placeholder:"Partner's name..." }, { id:'partner_dob', label:"Partner's Date of Birth", type:'date' }],
  zodiak:     [{ id:'partner_name', label:"Partner's Name (optional)", type:'text', placeholder:"Partner's name..." }, { id:'partner_dob', label:"Partner's Date of Birth", type:'date' }],
  shio:       [{ id:'partner_name', label:"Partner's Name (optional)", type:'text', placeholder:"Partner's name..." }, { id:'partner_birthyear', label:"Partner's Birth Year", type:'number', placeholder:'e.g. 1993' }],
  numerologi: [{ id:'partner_name', label:"Partner's Full Name", type:'text', placeholder:"Partner's full name..." }, { id:'partner_dob', label:"Partner's Date of Birth", type:'date' }],
  bazi:       [{ id:'partner_name', label:"Partner's Name (optional)", type:'text', placeholder:"Partner's name..." }, { id:'partner_dob', label:"Partner's Date of Birth", type:'date' }],
}

function buildFortunePrompt(category, system, inputs) {
  const catLabel = { character:'character and personality', love:'love, relationships, and compatibility', career:'career and financial fortune', luck:'luck and fate', today:"today's reading", future:'future outlook' }[category]
  const sysLabel = { primbon:'Primbon Jawa', zodiak:'Western Zodiac', shio:'Chinese Shio', bazi:'Ba Zi (Four Pillars)', numerologi:'Numerology', tarot:'Tarot', iching:'I Ching', rune:'Norse Runes' }[system]
  const lines = ['Please give me a ' + catLabel + ' reading using ' + sysLabel + '.', '']
  if (inputs.name)      lines.push('Name: ' + inputs.name)
  if (inputs.dob)       lines.push('Date of Birth: ' + inputs.dob)
  if (inputs.birthyear) lines.push('Birth Year: ' + inputs.birthyear)
  if (inputs.tob)       lines.push('Time of Birth: ' + inputs.tob)
  if (inputs.question)  lines.push('Question / Situation: ' + inputs.question)
  const hasPartner = inputs.partner_name || inputs.partner_dob || inputs.partner_birthyear
  if (hasPartner) {
    lines.push('', "Partner's Information:")
    if (inputs.partner_name)      lines.push("Partner's Name: " + inputs.partner_name)
    if (inputs.partner_dob)       lines.push("Partner's Date of Birth: " + inputs.partner_dob)
    if (inputs.partner_birthyear) lines.push("Partner's Birth Year: " + inputs.partner_birthyear)
  }
  return lines.join('\n')
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TAB_CONFIG = {
  fortune: { label: 'Fortune', welcomeContent: "Welcome. Select a category below to get a structured reading, or simply type your question.\n\nAvailable systems: Primbon, Zodiac, Shio, Ba Zi, Numerology, Tarot, I Ching, Rune." },
  story:   { label: 'Story',   welcomeContent: "Hey, ready to build something?\n\nShare a story idea, a character, a world — or just a feeling you want to explore. We'll build from there, one branch at a time." },
  builder: { label: 'Builder', welcomeContent: "**System ready.** Describe what you want to build or automate:\n\n**Option 1 — Quick:** One direct sentence.\n\n**Option 2 — Structured:**\n-> Domain: [Topic or field]\n-> Target User: [Who uses this output]\n-> Success Metric: [What ideal output looks like]\n\nEngine will classify your request and generate the right blueprint format." },
}

const TAB_ICON_MAP = { fortune: Stars, story: MessageCircle, builder: Hammer, library: BookOpen }

const BUILDER_QS = {
  content: [
    { id: 'niche',    q: 'What is your main niche & topic?',  hint: 'E.g.: tech reviews, Gen Z finance', ph: 'Describe your niche...' },
    { id: 'platform', q: 'Primary platform?', type: 'choice', opts: ['YouTube (long-form)', 'Website / Blog', 'Short-form (TikTok/Reels)', 'Newsletter / Email', 'Multi-platform'] },
    { id: 'goal',     q: 'Main goal for the first 90 days?',  hint: 'Subscriber count, revenue, milestone', ph: 'E.g.: 1,000 subscribers...' },
  ],
  app: [
    { id: 'idea',  q: 'Describe this app in one sentence.',  hint: "What it does, who it's for, problem it solves", ph: 'This app is...' },
    { id: 'user',  q: 'Who is the target user?',             hint: 'Specific persona = sharper blueprint', ph: 'E.g.: YouTube creators 18-30...' },
    { id: 'stack', q: 'Tech stack preference?', type: 'choice', opts: ['Next.js + Vercel (recommended)', 'React + Node.js API', 'HTML/CSS/JS serverless', 'Recommend the best'] },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserKey()   { try { return localStorage.getItem(USER_KEY_STORAGE) || '' } catch { return '' } }
function saveUserKey(k) { try { localStorage.setItem(USER_KEY_STORAGE, k) } catch {} }
function clearUserKey() { try { localStorage.removeItem(USER_KEY_STORAGE) } catch {} }
function makeWelcome(t) { return { role: 'assistant', content: TAB_CONFIG[t].welcomeContent, isWelcome: true } }

function renderContent(content) {
  const lines = content.split('\n')
  const result = []
  let inCode = false, codeBuffer = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (!inCode) { inCode = true; codeBuffer = [] }
      else {
        result.push(<pre key={i} className="my-2 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed" style={{ backgroundColor: 'var(--vs-bg2)', fontFamily: 'monospace' }}><code>{codeBuffer.join('\n')}</code></pre>)
        inCode = false; codeBuffer = []
      }
      continue
    }
    if (inCode) { codeBuffer.push(line); continue }
    if (line.match(/^─+$/) || line.match(/^-{3,}$/)) { result.push(<hr key={i} className="my-2 border-t vs-border" />); continue }
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={j}>{part.slice(2,-2)}</strong>
      if (part.startsWith('`') && part.endsWith('`')) return <code key={j} className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--vs-bg2)', fontFamily: 'monospace' }}>{part.slice(1,-1)}</code>
      return part
    })
    if (line === '') result.push(<br key={i} />)
    else result.push(<p key={i} className="leading-relaxed">{rendered}</p>)
  }
  return result
}

// ─── TierBadge ────────────────────────────────────────────────────────────────

function TierBadge({ tier }) {
  const cfg = {
    free: { label: 'free', bg: '#22c55e22', color: '#22c55e' },
    key:  { label: 'key',  bg: 'var(--vs-accent)22', color: 'var(--vs-accent)' },
    paid: { label: 'paid', bg: '#a855f722', color: '#a855f7' },
  }[tier] || { label: 'key', bg: 'var(--vs-accent)22', color: 'var(--vs-accent)' }
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ─── Fortune Gate ─────────────────────────────────────────────────────────────

function FortuneGate({ onStart }) {
  const [step, setStep]         = useState('category')
  const [category, setCategory] = useState(null)
  const [system, setSystem]     = useState(null)
  const [inputs, setInputs]     = useState({})

  const availableSystems = category ? SYSTEMS_BY_CATEGORY[category] : []
  const fields           = system ? SYSTEM_INPUTS[system] : []
  const partnerFields    = (category === 'love' && system && PARTNER_INPUTS[system]) ? PARTNER_INPUTS[system] : []
  const isValid          = () => fields.filter(f => f.required).every(f => (inputs[f.id] || '').trim())
  const setInput         = (id, val) => setInputs(prev => ({ ...prev, [id]: val }))
  const selectedCat      = FORTUNE_CATEGORIES.find(c => c.id === category)

  if (step === 'category') return (
    <div className="mx-3 mb-3 rounded-2xl border vs-border overflow-hidden" style={{ background: 'var(--vs-card)' }}>
      <div className="px-4 pt-4 pb-3 border-b vs-border">
        <p className="text-xs font-bold vs-text-sub uppercase tracking-wider">Fortune Reading</p>
        <p className="text-sm font-bold vs-text mt-1">What would you like to know?</p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {FORTUNE_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setCategory(cat.id); setSystem(null); setInputs({}); setStep('system') }}
            className="rounded-xl border vs-border p-3 text-left transition-all hover:border-[var(--vs-accent)]" style={{ background: 'var(--vs-bg)' }}>
            <p className="text-xs font-bold vs-text">{cat.label}</p>
            <p className="text-[10px] vs-text-sub mt-0.5">{cat.desc}</p>
          </button>
        ))}
      </div>
      <p className="text-[10px] vs-text-sub text-center pb-3">or type your question directly below</p>
    </div>
  )

  if (step === 'system') return (
    <div className="mx-3 mb-3 rounded-2xl border vs-border overflow-hidden" style={{ background: 'var(--vs-card)' }}>
      <div className="px-4 pt-4 pb-3 border-b vs-border flex items-center justify-between">
        <div>
          <p className="text-xs font-bold vs-text-sub uppercase tracking-wider">{selectedCat?.label}</p>
          <p className="text-sm font-bold vs-text mt-0.5">Choose a system</p>
        </div>
        <button onClick={() => setStep('category')} className="vs-text-sub p-1.5 rounded-lg"><X size={14} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {availableSystems.map(sysId => {
          const sys = FORTUNE_SYSTEMS[sysId]
          return (
            <button key={sysId} onClick={() => { setSystem(sysId); setInputs({}); setStep('input') }}
              className="rounded-xl border vs-border p-3 text-left transition-all hover:border-[var(--vs-accent)]" style={{ background: 'var(--vs-bg)' }}>
              <p className="text-xs font-bold vs-text">{sys.label}</p>
              <p className="text-[10px] vs-text-sub mt-0.5">{sys.desc}</p>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="mx-3 mb-3 rounded-2xl border vs-border overflow-hidden" style={{ background: 'var(--vs-card)' }}>
      <div className="px-4 pt-4 pb-3 border-b vs-border flex items-center justify-between">
        <div>
          <p className="text-xs font-bold vs-text-sub uppercase tracking-wider">{FORTUNE_SYSTEMS[system]?.label} &middot; {selectedCat?.label}</p>
          <p className="text-sm font-bold vs-text mt-0.5">Fill in your details</p>
        </div>
        <button onClick={() => setStep('system')} className="vs-text-sub p-1.5 rounded-lg"><X size={14} /></button>
      </div>
      <div className="p-3 flex flex-col gap-2.5">
        {fields.map(field => (
          <div key={field.id}>
            <p className="text-[10px] font-semibold vs-text mb-1">{field.label}</p>
            {field.type === 'textarea'
              ? <textarea value={inputs[field.id] || ''} onChange={e => setInput(field.id, e.target.value)} placeholder={field.placeholder} rows={2} className="w-full py-2 px-3 rounded-lg text-sm vs-text outline-none resize-none" style={{ background: 'var(--vs-bg)', border: '1px solid var(--vs-border)' }} />
              : <input type={field.type} value={inputs[field.id] || ''} onChange={e => setInput(field.id, e.target.value)} placeholder={field.placeholder || ''} className="w-full py-2 px-3 rounded-lg text-sm vs-text outline-none" style={{ background: 'var(--vs-bg)', border: '1px solid var(--vs-border)' }} />
            }
          </div>
        ))}
        {partnerFields.length > 0 && (
          <>
            <div className="border-t vs-border pt-2"><p className="text-[10px] font-bold vs-text-sub uppercase tracking-wider">Partner (optional)</p></div>
            {partnerFields.map(field => (
              <div key={field.id}>
                <p className="text-[10px] font-semibold vs-text mb-1">{field.label}</p>
                <input type={field.type} value={inputs[field.id] || ''} onChange={e => setInput(field.id, e.target.value)} placeholder={field.placeholder || ''} className="w-full py-2 px-3 rounded-lg text-sm vs-text outline-none" style={{ background: 'var(--vs-bg)', border: '1px solid var(--vs-border)' }} />
              </div>
            ))}
          </>
        )}
        <button onClick={() => onStart(buildFortunePrompt(category, system, inputs))} disabled={!isValid()}
          className="vs-btn w-full py-2.5 rounded-xl text-xs font-bold mt-1" style={{ opacity: isValid() ? 1 : 0.4 }}>
          Read My Fortune
        </button>
      </div>
    </div>
  )
}

// ─── Builder Gate ─────────────────────────────────────────────────────────────

function BuilderGate({ onStart }) {
  const [step, setStep]       = useState('gate')
  const [type, setType]       = useState(null)
  const [qStep, setQStep]     = useState(0)
  const [answers, setAnswers] = useState({})
  const [textVal, setTextVal] = useState('')
  const qs = type ? BUILDER_QS[type] : []
  const currentQ = qs[qStep]

  function selectType(t) { setType(t); setStep('questions'); setQStep(0); setAnswers({}); setTextVal('') }
  function nextStep() {
    const val = currentQ.type === 'choice' ? answers[currentQ.id] : textVal.trim()
    if (!val) return
    const newA = { ...answers, [currentQ.id]: val }
    setAnswers(newA); setTextVal('')
    if (qStep < qs.length - 1) { setQStep(qStep + 1) }
    else {
      const msg = type === 'content'
        ? 'Build a Content System blueprint for:\n- Niche: ' + newA.niche + '\n- Platform: ' + newA.platform + '\n- Goal: ' + newA.goal
        : 'Build an App Spec blueprint for:\n- App: ' + newA.idea + '\n- Target user: ' + newA.user + '\n- Stack: ' + newA.stack
      onStart(msg)
    }
  }

  if (step === 'gate') return (
    <div className="mx-3 mb-3 rounded-2xl border vs-border overflow-hidden" style={{ background: 'var(--vs-card)' }}>
      <div className="px-4 pt-4 pb-3 border-b vs-border">
        <p className="text-xs font-bold vs-text-sub uppercase tracking-wider">Blueprint Engine v3.0</p>
        <p className="text-sm font-bold vs-text mt-1">What are you building today?</p>
      </div>
      <div className="grid grid-cols-2 gap-3 p-3">
        {[['content', Monitor, 'Content System', 'Channel, site, newsletter, brand'], ['app', Code2, 'App Spec', 'Web app, SaaS, UI tool']].map(([t, Icon, label, desc]) => (
          <button key={t} onClick={() => selectType(t)}
            className="rounded-xl border vs-border p-3 text-left transition-all hover:border-[var(--vs-accent)]" style={{ background: 'var(--vs-bg)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: 'var(--vs-bg2)' }}>
              <Icon size={16} style={{ color: 'var(--vs-text)' }} />
            </div>
            <p className="text-xs font-bold vs-text">{label}</p>
            <p className="text-[10px] vs-text-sub mt-1">{desc}</p>
          </button>
        ))}
      </div>
      <p className="text-[10px] vs-text-sub text-center pb-3">or just type directly below</p>
    </div>
  )

  return (
    <div className="mx-3 mb-3 rounded-2xl border vs-border overflow-hidden" style={{ background: 'var(--vs-card)' }}>
      <div className="px-4 pt-4 pb-3 border-b vs-border flex items-center justify-between">
        <div>
          <p className="text-xs font-bold vs-text-sub uppercase tracking-wider">{type === 'content' ? 'Content System' : 'App Spec'} &middot; {qStep+1}/{qs.length}</p>
          <p className="text-sm font-bold vs-text mt-0.5">{currentQ?.q}</p>
          {currentQ?.hint && <p className="text-[10px] vs-text-sub mt-0.5">{currentQ.hint}</p>}
        </div>
        <button onClick={() => setStep('gate')} className="vs-text-sub p-1.5 rounded-lg"><X size={14} /></button>
      </div>
      <div className="p-3">
        {currentQ?.type === 'choice'
          ? <div className="flex flex-col gap-1.5">{currentQ.opts.map(opt => (
              <button key={opt} onClick={() => setAnswers(a => ({ ...a, [currentQ.id]: opt }))}
                className="text-left px-3 py-2 rounded-lg text-xs border vs-border transition-all"
                style={{ background: answers[currentQ.id] === opt ? 'var(--vs-accent)' : 'var(--vs-bg)', color: answers[currentQ.id] === opt ? '#fff' : 'var(--vs-text)', borderColor: answers[currentQ.id] === opt ? 'var(--vs-accent)' : undefined }}>
                {opt}
              </button>
            ))}</div>
          : <textarea value={textVal} onChange={e => setTextVal(e.target.value)} placeholder={currentQ?.ph} rows={2}
              className="w-full py-2.5 px-3 rounded-xl text-sm vs-text outline-none resize-none"
              style={{ background: 'var(--vs-bg)', border: '1px solid var(--vs-border)' }} />
        }
        <button onClick={nextStep}
          disabled={currentQ?.type === 'choice' ? !answers[currentQ.id] : !textVal.trim()}
          className="mt-2.5 w-full py-2 rounded-xl text-xs font-bold"
          style={{ background: 'var(--vs-accent)', color: '#fff', opacity: (currentQ?.type === 'choice' ? !answers[currentQ.id] : !textVal.trim()) ? 0.4 : 1 }}>
          {qStep < qs.length - 1 ? 'Next' : 'Generate Blueprint'}
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function ChatPageInner() {
  const searchParams = useSearchParams()

  const [tab, setTab]         = useState('fortune')
  const [messages, setMessages] = useState({
    fortune: [makeWelcome('fortune')],
    story:   [makeWelcome('story')],
    builder: [makeWelcome('builder')],
  })
  const [sessionIds, setSessionIds] = useState({ fortune: null, story: null, builder: null })
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [balance, setBalance]       = useState(null)

  const [tabModels, setTabModels]         = useState({ ...TAB_DEFAULTS })
  const [liveModels, setLiveModels]       = useState(null)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)

  const [userKey, setUserKey]             = useState('')
  const [showKeyPopup, setShowKeyPopup]   = useState(false)
  const [keyInput, setKeyInput]           = useState('')
  const [keyReason, setKeyReason]         = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [showPaidPopup, setShowPaidPopup] = useState(false)
  const [showPollenPopup, setShowPollenPopup] = useState(false)

  const [savedIndicator, setSavedIndicator] = useState({ fortune: false, story: false, builder: false })
  const [copiedId, setCopiedId]             = useState(null)
  const [confirmClear, setConfirmClear]     = useState(false)
  const [libSelected, setLibSelected]       = useState(null)

  const endRef   = useRef(null)
  const inputRef = useRef(null)

  const activeModels = liveModels || TEXT_MODELS_FALLBACK

  function getTier(modelId) {
    const m = activeModels.find(x => x.id === modelId)
    if (!m) return 'key'
    if (m.paidOnly) return 'paid'
    if (TEXT_FREE_IDS.includes(modelId)) return 'free'
    return 'key'
  }

  useEffect(() => {
    const k = getUserKey(); setUserKey(k); fetchBalance(k)
    const sessionId = searchParams.get('session')
    if (sessionId) loadFromHistory(parseInt(sessionId))
    const t = searchParams.get('tab')
    if (t && ['fortune','story','builder','library'].includes(t)) setTab(t)
    loadLiveModels()
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading, tab])

  async function loadLiveModels(force) {
    if (force) clearModelsCache()
    setModelsLoading(true)
    const raw = await fetchTextModels(force)
    if (raw) setLiveModels(sortModels(raw).map(toDropdown))
    setModelsLoading(false)
  }

  async function fetchBalance(key) {
    try {
      const headers = {}
      if (key) headers['x-user-key'] = key
      const res = await fetch('/api/balance', { headers })
      const data = await res.json()
      setBalance(data.balance ?? 0)
    } catch { setBalance(null) }
  }

  async function loadFromHistory(id) {
    const session = await getSession(id)
    if (!session) return
    const tabId = session.type
    setTab(tabId)
    setMessages(prev => ({ ...prev, [tabId]: [makeWelcome(tabId), ...session.messages] }))
    setSessionIds(prev => ({ ...prev, [tabId]: id }))
    if (session.model) setTabModels(prev => ({ ...prev, [tabId]: session.model }))
  }

  function hasKey() { return !!getUserKey() }

  function openKeyPopup(reason, action) {
    const k = getUserKey()
    if (k) { if (action) action(k); return }
    setKeyReason(reason); setPendingAction(() => action); setKeyInput(''); setShowKeyPopup(true)
  }

  function handleKeySave() {
    if (!keyInput.trim()) return
    saveUserKey(keyInput.trim()); setUserKey(keyInput.trim())
    setShowKeyPopup(false)
    if (pendingAction) pendingAction(keyInput.trim())
    setPendingAction(null)
    fetchBalance(keyInput.trim())
  }

  function handleKeyClear() { clearUserKey(); setUserKey(''); fetchBalance('') }

  function selectModel(m) {
    const tier = m.paidOnly ? 'paid' : TEXT_FREE_IDS.includes(m.id) ? 'free' : 'key'
    if (tier === 'paid') { setShowPaidPopup(true); setShowModelPicker(false); return }
    if (tier === 'key' && !hasKey()) { openKeyPopup('model', () => { setTabModels(prev => ({ ...prev, [tab]: m.id })); setShowModelPicker(false) }); return }
    setTabModels(prev => ({ ...prev, [tab]: m.id }))
    setShowModelPicker(false)
  }

  function getModel() { return tabModels[tab] || TAB_DEFAULTS[tab] }

  async function handleSend(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading || tab === 'library') return
    const tier = getTier(getModel())
    if (tier === 'paid') { setShowPaidPopup(true); return }
    if (tier === 'key' && !hasKey()) { openKeyPopup('model', () => doSend(text)); return }
    doSend(text)
  }

  async function doSend(text) {
    const tabId = tab
    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages[tabId], userMsg]
    setMessages(prev => ({ ...prev, [tabId]: newMessages }))
    setInput(''); setLoading(true)

    const apiMessages = [
      { role: 'system', content: SYSTEM_MAP[tabId] },
      ...newMessages.filter(m => !m.isWelcome).map(m => ({ role: m.role, content: m.content })),
    ]

    try {
      const k = getUserKey()
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', messages: apiMessages, model: getModel(), ...(k && { userKey: k }) }),
      })
      const data = await res.json()
      if (data.error) {
        if (data.error === 'quota_exceeded') { setKeyReason('quota'); setShowKeyPopup(true) }
        setLoading(false); return
      }
      const assistantMsg = { role: 'assistant', content: data.result || 'No response. Try again?' }
      const finalMessages = [...newMessages, assistantMsg]
      setMessages(prev => ({ ...prev, [tabId]: finalMessages }))
      await autoSave(tabId, finalMessages)
      fetchBalance(k)
    } catch {
      setMessages(prev => ({ ...prev, [tabId]: [...newMessages, { role: 'assistant', content: 'Connection error. Try again?' }] }))
    }
    setLoading(false)
  }

  async function autoSave(tabId, msgs) {
    const saveable = msgs.filter(m => !m.isWelcome)
    if (saveable.length < 2) return
    const title = saveable.find(m => m.role === 'user')?.content?.slice(0, 60) || 'Untitled'
    if (sessionIds[tabId]) {
      await updateSession(sessionIds[tabId], { messages: saveable, title })
    } else {
      const id = await saveSession({ type: tabId, title, messages: saveable, model: getModel() })
      if (id) {
        setSessionIds(prev => ({ ...prev, [tabId]: id }))
        setSavedIndicator(prev => ({ ...prev, [tabId]: true }))
        setTimeout(() => setSavedIndicator(prev => ({ ...prev, [tabId]: false })), 2000)
      }
    }
  }

  function clearChat() {
    const tabId = tab
    setMessages(prev => ({ ...prev, [tabId]: [makeWelcome(tabId)] }))
    setSessionIds(prev => ({ ...prev, [tabId]: null }))
    setConfirmClear(false)
    inputRef.current?.focus()
  }

  async function copyMessage(content, id) {
    try { await navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); toast('Copied!') }
    catch { toast('Failed to copy') }
  }

  const fortuneHasUserMsg = tab === 'fortune' && messages.fortune.some(m => m.role === 'user')
  const builderHasUserMsg = tab === 'builder' && messages.builder.some(m => m.role === 'user')
  const currentMessages   = tab !== 'library' ? (messages[tab] || []) : []
  const currentModelLabel = activeModels.find(m => m.id === tabModels[tab])?.label || tabModels[tab] || ''

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 68px)' }}>

      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <h1 className="text-2xl font-black vs-text text-center mb-1">AI <span className="vs-gradient-text">Chat</span></h1>
        <p className="text-xs vs-text-sub text-center mb-3">smart conversations with artificial brainpower</p>

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full vs-card border vs-border text-[10px]">
            {balance !== null
              ? <button onClick={() => setShowPollenPopup(true)} className="vs-text-sub hover:underline">{balance > 0 ? balance.toFixed(3) + ' pollen' : 'pollen depleted'}</button>
              : <span className="vs-text-sub">Loading...</span>}
            {userKey
              ? <button onClick={() => { setKeyReason('manage'); setShowKeyPopup(true) }} className="text-[10px] font-semibold vs-text border-l vs-border pl-2 ml-1">key active</button>
              : <button onClick={() => openKeyPopup('add')} className="text-[10px] font-semibold vs-text border-l vs-border pl-2 ml-1">add key</button>}
          </div>
          <a href="/ai/create" className="flex items-center gap-1 px-3 py-1.5 rounded-full vs-card border vs-border text-[10px] font-semibold vs-text hover:opacity-75 transition-opacity">
            Create Tools <ArrowRight size={10} />
          </a>
        </div>

        <div className="flex gap-1 vs-card border vs-border rounded-xl p-1">
          {[...Object.entries(TAB_CONFIG), ['library', { label: 'Library' }]].map(([id, cfg]) => {
            const Icon = TAB_ICON_MAP[id]
            return (
              <button key={id} onClick={() => { setTab(id); setShowModelPicker(false) }}
                className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                style={{ backgroundColor: tab === id ? 'var(--vs-accent)' : 'transparent', color: tab === id ? '#fff' : 'var(--vs-text-sub)' }}>
                {Icon && <Icon size={11} />}{cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Model selector — all chat tabs */}
      {(tab === 'fortune' || tab === 'story' || tab === 'builder') && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl vs-card border vs-border text-xs vs-text">
              <Settings size={11} className="vs-text-sub shrink-0" />
              <span className="flex-1 text-left truncate">{currentModelLabel}</span>
              <TierBadge tier={getTier(tabModels[tab])} />
              <ChevronDown size={11} className="vs-text-sub shrink-0" style={{ transform: showModelPicker ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            <button onClick={() => loadLiveModels(true)} disabled={modelsLoading}
              className="p-1.5 rounded-xl vs-card border vs-border vs-text-sub">
              <RefreshCw size={13} className={modelsLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {showModelPicker && (
            <div className="mt-1 vs-card border vs-border rounded-xl max-h-52 overflow-y-auto">
              <div className="px-3 py-2 border-b vs-border flex items-center justify-between">
                <p className="text-[9px] vs-text-sub uppercase tracking-wider">Select model</p>
                {liveModels && <p className="text-[9px] vs-text-sub">{liveModels.length} models &middot; live</p>}
              </div>
              {modelsLoading
                ? <div className="flex items-center justify-center py-4 gap-2"><Loader2 size={14} className="animate-spin vs-text-sub" /><span className="text-xs vs-text-sub">Loading...</span></div>
                : activeModels.map(m => {
                    const tier = m.paidOnly ? 'paid' : TEXT_FREE_IDS.includes(m.id) ? 'free' : 'key'
                    return (
                      <button key={m.id} onClick={() => selectModel(m)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs vs-hover border-b vs-border last:border-b-0"
                        style={{ color: tabModels[tab] === m.id ? 'var(--vs-accent)' : 'var(--vs-text)' }}>
                        <span className="flex-1 text-left">{m.label}</span>
                        <TierBadge tier={tier} />
                      </button>
                    )
                  })
              }
            </div>
          )}

          <p className="text-[10px] vs-text-sub mt-1.5">
            <span style={{ color: '#22c55e' }}>free</span> no key &nbsp;&middot;&nbsp;
            <span style={{ color: 'var(--vs-accent)' }}>key</span> free member &nbsp;&middot;&nbsp;
            <span style={{ color: '#a855f7' }}>paid</span> subscriber
            {liveModels && <span className="ml-2 opacity-60">&middot; auto-updated</span>}
          </p>
        </div>
      )}

      {/* Messages */}
      {tab !== 'library' && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 py-2 pb-4">
            {tab === 'fortune' && !fortuneHasUserMsg && <FortuneGate onStart={text => doSend(text)} />}
            {tab === 'builder' && !builderHasUserMsg && <BuilderGate onStart={text => doSend(text)} />}

            {currentMessages.map((msg, i) => (
              <div key={i} className={'flex px-3 ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[88%] rounded-2xl text-sm ' + (msg.role === 'user' ? 'px-4 py-3 text-white rounded-br-sm' : 'px-4 py-3 rounded-bl-sm')}
                  style={msg.role === 'user' ? { backgroundColor: 'var(--vs-accent)' } : { backgroundColor: 'var(--vs-card)', border: '1px solid var(--vs-border)', color: 'var(--vs-text)' }}>
                  {msg.role === 'assistant'
                    ? <div className="leading-relaxed">{renderContent(msg.content)}</div>
                    : <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                  {msg.role === 'assistant' && !msg.isWelcome && (
                    <button onClick={() => copyMessage(msg.content, i)} className="mt-2 flex items-center gap-1 text-[10px] vs-text-sub">
                      {copiedId === i ? <Check size={10} /> : <Copy size={10} />}
                      {copiedId === i ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start px-3">
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ backgroundColor: 'var(--vs-card)', border: '1px solid var(--vs-border)' }}>
                  <Loader2 size={16} className="animate-spin vs-text-sub" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>
      )}

      {/* Library */}
      {tab === 'library' && (
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <p className="text-xs vs-text-sub text-center mb-4">Ready-to-use master prompts — copy and use in any AI</p>
          <div className="flex flex-col gap-3 pb-4">
            {LIBRARY_PROMPTS.map(p => (
              <div key={p.id} className="vs-card border vs-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: 'var(--vs-accent)' }}>Type {p.type}</span>
                  <span className="text-[9px] vs-text-sub">{p.category}</span>
                </div>
                <p className="text-sm font-bold vs-text mb-1">{p.title}</p>
                <p className="text-xs vs-text-sub leading-relaxed mb-3">{p.description}</p>
                <div className="flex gap-2">
                  <button onClick={() => setLibSelected(p)} className="flex-1 vs-btn-outline py-2 rounded-xl text-xs font-semibold gap-1 flex items-center justify-center">
                    <BookOpen size={12} /> Preview
                  </button>
                  <button onClick={() => copyMessage(p.prompt, p.id)} className="flex-1 vs-btn py-2 rounded-xl text-xs font-semibold gap-1 flex items-center justify-center">
                    {copiedId === p.id ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      {tab !== 'library' && (
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t vs-border">
          <div className="flex items-center gap-2 mb-2">
            {savedIndicator[tab] && <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--vs-accent)' }}><Check size={10} /> Saved</span>}
            <div className="flex-1" />
            <button onClick={() => setConfirmClear(true)} className="text-[10px] vs-text-sub flex items-center gap-1"><Trash2 size={10} /> Clear</button>
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder={tab === 'fortune' ? 'Ask about your fortune...' : tab === 'story' ? 'Continue the story...' : 'Describe what to build...'}
              className="flex-1 py-3 px-4 rounded-xl border text-sm vs-text outline-none"
              style={{ backgroundColor: 'var(--vs-card)', borderColor: 'var(--vs-border)' }} />
            <button type="submit" disabled={loading || !input.trim()} className="vs-btn w-11 h-11 rounded-xl flex-shrink-0" style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}>
              <Send size={16} />
            </button>
          </form>
          <p className="text-[9px] vs-text-sub mt-1.5 text-center">
            Auto-saved to <a href="/favorites?tab=chat" className="underline" style={{ color: 'var(--vs-accent)' }}>History</a>
          </p>
        </div>
      )}

      {/* Library preview */}
      {libSelected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-20" onClick={() => setLibSelected(null)}>
          <div className="vs-card rounded-2xl border vs-border w-full max-w-lg max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b vs-border flex-shrink-0">
              <div>
                <p className="text-sm font-bold vs-text">{libSelected.title}</p>
                <p className="text-[10px] vs-text-sub">Type {libSelected.type} &mdash; {libSelected.typeName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copyMessage(libSelected.prompt, libSelected.id)} className="vs-btn px-3 py-1.5 rounded-lg text-xs font-semibold gap-1 flex items-center">
                  {copiedId === libSelected.id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
                <button onClick={() => setLibSelected(null)} className="vs-text-sub p-1.5 vs-hover rounded-lg"><X size={16} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-xs vs-text leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>{libSelected.prompt}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Confirm clear */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setConfirmClear(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={e => e.stopPropagation()}>
            <Trash2 size={28} className="vs-text-sub mx-auto mb-3" />
            <h3 className="text-lg font-bold vs-text mb-2">Clear this chat?</h3>
            <p className="text-sm vs-text-sub mb-5">Current conversation will be cleared.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)} className="flex-1 vs-btn-outline px-4 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={clearChat} className="flex-1 vs-btn px-4 py-2.5 rounded-xl text-sm font-semibold">Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* Paid popup */}
      {showPaidPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setShowPaidPopup(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full border vs-border text-center" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#a855f722' }}>
              <span className="text-[18px]" style={{ color: '#a855f7' }}>P</span>
            </div>
            <h3 className="text-base font-bold vs-text mb-2">Premium Model</h3>
            <p className="text-xs vs-text-sub leading-relaxed mb-5">
              This model requires a paid subscription at Pollinations.ai. Upgrade your account to unlock access to premium models.
            </p>
            <a href="https://enter.pollinations.ai/" target="_blank" rel="noopener noreferrer"
              className="vs-btn w-full py-2.5 rounded-xl text-sm font-semibold mb-3 flex items-center justify-center gap-2">
              Upgrade at Pollinations <ExternalLink size={14} />
            </a>
            <button onClick={() => setShowPaidPopup(false)} className="w-full text-[10px] vs-text-sub hover:underline">Maybe later</button>
          </div>
        </div>
      )}

      {/* Pollen popup */}
      {showPollenPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => setShowPollenPopup(false)}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full text-center border vs-border" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold vs-text mb-2">{userKey ? 'Pollen' : 'Your Pollen Situation'}</h3>
            <div className="vs-card border vs-border rounded-xl p-3 mb-4" style={{ background: 'var(--vs-bg)' }}>
              <p className="text-2xl font-black vs-gradient-text">{balance !== null ? balance.toFixed(3) : '...'}</p>
              <p className="text-[10px] vs-text-sub mt-1">pollen {userKey ? 'in your tank' : 'remaining'}</p>
            </div>
            {!userKey && <p className="text-xs vs-text-sub leading-relaxed mb-4">Resets every hour. Add your own key to skip the wait and unlock more models.</p>}
            {userKey && <p className="text-[10px] vs-text-sub mb-4">Key active: {userKey.slice(0,8)}...</p>}
            {!userKey
              ? <button onClick={() => { setShowPollenPopup(false); setShowKeyPopup(true) }} className="vs-btn w-full py-2.5 rounded-xl text-sm font-semibold mb-3">Add API Key</button>
              : <button onClick={() => { setShowPollenPopup(false); setKeyReason('manage'); setShowKeyPopup(true) }} className="vs-btn-outline w-full py-2.5 rounded-xl text-sm font-semibold mb-3">Manage Key</button>}
            <button onClick={() => setShowPollenPopup(false)} className="w-full text-[10px] vs-text-sub hover:underline">{userKey ? 'Close' : 'Got it, I will wait'}</button>
          </div>
        </div>
      )}

      {/* Key popup */}
      {showKeyPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={() => { setShowKeyPopup(false); setPendingAction(null) }}>
          <div className="vs-card rounded-2xl p-6 max-w-sm w-full border vs-border" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold vs-text mb-1">{keyReason === 'quota' ? 'Pollen depleted' : userKey ? 'Manage API Key' : 'Add API Key'}</h3>
              <p className="text-xs vs-text-sub leading-relaxed">{keyReason === 'quota' ? 'Pollen is out. Add your own key to keep going.' : 'Your personal Pollinations API key.'}</p>
            </div>
            {(!userKey || keyReason !== 'manage') && (
              <input type="text" value={keyInput} onChange={e => setKeyInput(e.target.value)}
                placeholder="Paste your API key..." onKeyDown={e => e.key === 'Enter' && handleKeySave()}
                className="w-full py-3 px-4 rounded-xl border vs-border text-sm vs-text outline-none mb-4"
                style={{ backgroundColor: 'var(--vs-bg)' }} />
            )}
            {(!userKey || keyReason !== 'manage') && (
              <button onClick={handleKeySave} disabled={!keyInput.trim()} className="vs-btn w-full py-2.5 rounded-xl text-sm font-semibold mb-3" style={{ opacity: keyInput.trim() ? 1 : 0.5 }}>Save Key</button>
            )}
            <div className="text-center mb-3">
              <a href="https://enter.pollinations.ai/" target="_blank" rel="noopener noreferrer"
                className="vs-btn-outline px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1">
                Get key at Pollinations <ExternalLink size={12} />
              </a>
            </div>
            {userKey && (
              <div className="pt-3 border-t vs-border text-center">
                <p className="text-[10px] vs-text-sub mb-1">Key active &middot; {userKey.slice(0,8)}...</p>
                <button onClick={() => { handleKeyClear(); setShowKeyPopup(false) }} className="text-[10px] vs-text-sub hover:underline">Remove key</button>
              </div>
            )}
            <button onClick={() => { setShowKeyPopup(false); setPendingAction(null) }} className="w-full text-center text-[10px] vs-text-sub hover:underline mt-3">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin vs-text-sub" size={24} /></div>}>
      <ChatPageInner />
    </Suspense>
  )
}
