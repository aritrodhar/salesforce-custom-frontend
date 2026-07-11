import { useMemo, useState, type DragEvent, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight, Bell, Building2, CalendarDays, ChevronRight,
  CircleDollarSign, Command, GripVertical, LayoutDashboard, Plus, Search,
  Sparkles, Target, TrendingUp, Users, X
} from 'lucide-react';
import { mockAccounts, mockContacts, mockOpportunities, owners } from './data/mockData';
import type { Opportunity, OpportunityInput, OpportunityStage } from './data/types';
import './styles/sales-pulse.css';

const stages: OpportunityStage[] = [
  'Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition',
  'Proposal/Price Quote', 'Negotiation/Review', 'Closed Won'
];

const stageProbability: Record<OpportunityStage, number> = {
  Prospecting: 10, Qualification: 25, 'Needs Analysis': 35, 'Value Proposition': 50,
  'Proposal/Price Quote': 65, 'Negotiation/Review': 80, 'Closed Won': 100, 'Closed Lost': 0,
};

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });

function isRisky(opportunity: Opportunity) {
  const today = '2026-07-11';
  return (!opportunity.isClosed && opportunity.closeDate < today) || !opportunity.nextStep || opportunity.probability < 35;
}

function stageClass(stage: OpportunityStage) {
  return `stage-${stage.toLowerCase().replace(/[^a-z]+/g, '-')}`;
}

function App() {
  const [view, setView] = useState<'overview' | 'pipeline' | 'accounts'>('overview');
  const [opportunities, setOpportunities] = useState(mockOpportunities);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  const openOpportunities = opportunities.filter((opportunity) => !opportunity.isClosed);
  const metrics = useMemo(() => {
    const openPipeline = openOpportunities.reduce((sum, opportunity) => sum + opportunity.amount, 0);
    const weightedPipeline = openOpportunities.reduce((sum, opportunity) => sum + opportunity.amount * opportunity.probability / 100, 0);
    const closed = opportunities.filter((opportunity) => opportunity.isClosed);
    const won = closed.filter((opportunity) => opportunity.isWon).length;
    return { openPipeline, weightedPipeline, winRate: closed.length ? Math.round(won / closed.length * 100) : 0, closingSoon: openOpportunities.filter((opportunity) => opportunity.closeDate <= '2026-07-31').reduce((sum, opportunity) => sum + opportunity.amount, 0) };
  }, [opportunities]);

  const accountName = (id: string) => mockAccounts.find((account) => account.id === id)?.name ?? 'Unassigned account';
  const saveOpportunity = (id: string, patch: Partial<Opportunity>) => {
    setOpportunities((current) => current.map((opportunity) => opportunity.id === id ? { ...opportunity, ...patch, lastModifiedDate: new Date().toISOString() } : opportunity));
    setSelected(null);
    setNotice('Saved in demo mode. Live writes can use the same interaction once approved.');
  };
  const moveOpportunity = (id: string, stageName: OpportunityStage) => {
    saveOpportunity(id, { stageName, probability: stageProbability[stageName], isClosed: stageName === 'Closed Won' || stageName === 'Closed Lost', isWon: stageName === 'Closed Won' });
  };
  const createOpportunity = (input: OpportunityInput) => {
    const stageName = input.stageName;
    const opportunity: Opportunity = { ...input, id: `o-demo-${Date.now()}`, owner: owners[0], probability: input.probability || stageProbability[stageName], isClosed: stageName === 'Closed Won' || stageName === 'Closed Lost', isWon: stageName === 'Closed Won', lastModifiedDate: new Date().toISOString() };
    setOpportunities((current) => [opportunity, ...current]);
    setCreating(false);
    setNotice('New opportunity created in demo mode.');
  };

  return (
    <div className="sales-pulse-app">
      <aside className="side-rail">
        <div className="brand"><span className="brand-mark"><Sparkles size={18} /></span><span>Sales Pulse</span></div>
        <div className="brand-caption">REVENUE COMMAND CENTER</div>
        <nav className="nav-list">
          <NavItem active={view === 'overview'} icon={<LayoutDashboard size={18} />} label="Overview" onClick={() => setView('overview')} />
          <NavItem active={view === 'pipeline'} icon={<TrendingUp size={18} />} label="Pipeline" onClick={() => setView('pipeline')} />
          <NavItem active={view === 'accounts'} icon={<Building2 size={18} />} label="Accounts" onClick={() => setView('accounts')} />
        </nav>
        <div className="rail-bottom"><div className="demo-note"><span className="live-dot" /> Demo workspace<br /><small>React on Salesforce</small></div><div className="user-chip"><span className="avatar avatar-maya">MC</span><span><b>Maya Chen</b><small>Sales Director</small></span></div></div>
      </aside>
      <main className="main-canvas">
        <header className="topbar">
          <div className="breadcrumb"><span>Sales Pulse</span><ChevronRight size={15} /><b>{view === 'overview' ? 'Overview' : view === 'pipeline' ? 'Pipeline' : 'Accounts'}</b></div>
          <div className="top-actions"><label className="command-search"><Search size={16} /><input placeholder="Search command center" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd><Command size={11} />K</kbd></label><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><button className="primary-button" onClick={() => setCreating(true)}><Plus size={17} /> New opportunity</button></div>
        </header>
        {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
        {view === 'overview' && <Overview metrics={metrics} opportunities={opportunities} accountName={accountName} onOpen={setSelected} onViewPipeline={() => setView('pipeline')} />}
        {view === 'pipeline' && <Pipeline opportunities={opportunities} accountName={accountName} query={query} onOpen={setSelected} onMove={moveOpportunity} />}
        {view === 'accounts' && <Accounts opportunities={opportunities} query={query} onOpenOpportunity={setSelected} />}
      </main>
      {selected && <OpportunityModal opportunity={selected} accountName={accountName(selected.accountId)} onClose={() => setSelected(null)} onSave={(patch) => saveOpportunity(selected.id, patch)} />}
      {creating && <OpportunityModal accountName="" onClose={() => setCreating(false)} onCreate={createOpportunity} />}
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function Metric({ label, value, delta, icon }: { label: string; value: string; delta: string; icon: React.ReactNode }) {
  return <section className="metric-card"><div className="metric-icon">{icon}</div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small><ArrowUpRight size={13} /> {delta}</small></div></section>;
}

function Overview({ metrics, opportunities, accountName, onOpen, onViewPipeline }: { metrics: { openPipeline: number; weightedPipeline: number; winRate: number; closingSoon: number }; opportunities: Opportunity[]; accountName: (id: string) => string; onOpen: (opportunity: Opportunity) => void; onViewPipeline: () => void }) {
  const open = opportunities.filter((opportunity) => !opportunity.isClosed);
  const attention = open.filter(isRisky).slice(0, 4);
  const maxStageAmount = Math.max(...stages.map((stage) => open.filter((opportunity) => opportunity.stageName === stage).reduce((sum, opportunity) => sum + opportunity.amount, 0)));
  const topAccounts = mockAccounts.map((account) => ({ account, value: open.filter((opportunity) => opportunity.accountId === account.id).reduce((sum, opportunity) => sum + opportunity.amount, 0) })).sort((a, b) => b.value - a.value).slice(0, 4);
  return <div className="page-shell">
    <section className="hero-row"><div><p className="eyebrow">FRIDAY, JULY 11</p><h1>Good morning, Maya.</h1><p className="hero-subtitle">A clear view of what is moving, what needs attention, and where to focus next.</p></div><button className="text-button" onClick={onViewPipeline}>Open pipeline <ChevronRight size={16} /></button></section>
    <section className="metrics-grid"><Metric label="Open pipeline" value={compactCurrency.format(metrics.openPipeline)} delta="12.4% vs. last month" icon={<CircleDollarSign size={20} />} /><Metric label="Weighted pipeline" value={compactCurrency.format(metrics.weightedPipeline)} delta="8.7% coverage gain" icon={<Target size={20} />} /><Metric label="Win rate" value={`${metrics.winRate}%`} delta="4.2% above baseline" icon={<TrendingUp size={20} />} /><Metric label="Closing this month" value={compactCurrency.format(metrics.closingSoon)} delta="5 active opportunities" icon={<CalendarDays size={20} />} /></section>
    <section className="dashboard-grid"><section className="panel pipeline-panel"><div className="panel-heading"><div><p className="eyebrow">PIPELINE HEALTH</p><h2>Momentum by stage</h2></div><span className="chip">{open.length} open deals</span></div><div className="funnel-list">{stages.slice(0, 6).map((stage, index) => { const total = open.filter((opportunity) => opportunity.stageName === stage).reduce((sum, opportunity) => sum + opportunity.amount, 0); return <div className="funnel-row" key={stage}><div className="funnel-label"><span className={`stage-dot ${stageClass(stage)}`} />{stage}</div><div className="funnel-track"><div className={`funnel-value ${stageClass(stage)}`} style={{ width: `${maxStageAmount ? Math.max(8, total / maxStageAmount * 100) : 0}%` }} /></div><b>{compactCurrency.format(total)}</b><small>{index + 1}</small></div>; })}</div><div className="panel-footer"><span>Conversion is strongest after proposal.</span><button onClick={onViewPipeline}>Explore board <ArrowUpRight size={14} /></button></div></section>
    <section className="panel focus-panel"><div className="panel-heading"><div><p className="eyebrow">FOCUS QUEUE</p><h2>Needs attention</h2></div><span className="attention-count">{attention.length}</span></div><div className="focus-list">{attention.map((opportunity) => <button className="focus-item" key={opportunity.id} onClick={() => onOpen(opportunity)}><span className="risk-ring" /><span><b>{opportunity.name}</b><small>{accountName(opportunity.accountId)} · closes {opportunity.closeDate}</small></span><span className="focus-amount">{compactCurrency.format(opportunity.amount)}</span></button>)}</div><button className="full-width-button" onClick={onViewPipeline}>Review risk signals <ArrowUpRight size={15} /></button></section></section>
    <section className="dashboard-grid lower-grid"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">UPCOMING CLOSES</p><h2>Keep deals moving</h2></div><button className="quiet-button" onClick={onViewPipeline}>View all</button></div><div className="deal-list">{open.sort((a, b) => a.closeDate.localeCompare(b.closeDate)).slice(0, 5).map((opportunity) => <button className="deal-row" key={opportunity.id} onClick={() => onOpen(opportunity)}><span className={`stage-marker ${stageClass(opportunity.stageName)}`} /><span><b>{opportunity.name}</b><small>{accountName(opportunity.accountId)} · {opportunity.stageName}</small></span><span><b>{currency.format(opportunity.amount)}</b><small>{opportunity.closeDate}</small></span></button>)}</div></section>
    <section className="panel accounts-panel"><div className="panel-heading"><div><p className="eyebrow">ACCOUNT SIGNALS</p><h2>Top accounts by pipeline</h2></div><Building2 size={19} /></div><div className="account-list">{topAccounts.map(({ account, value }, index) => <div className="account-row" key={account.id}><span className="rank">0{index + 1}</span><span className="account-avatar">{account.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span><span><b>{account.name}</b><small>{account.industry}</small></span><strong>{compactCurrency.format(value)}</strong></div>)}</div></section></section>
  </div>;
}

function Pipeline({ opportunities, accountName, query, onOpen, onMove }: { opportunities: Opportunity[]; accountName: (id: string) => string; query: string; onOpen: (opportunity: Opportunity) => void; onMove: (id: string, stage: OpportunityStage) => void }) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const activeStages = stages.slice(0, 6);
  const matches = (opportunity: Opportunity) => `${opportunity.name} ${accountName(opportunity.accountId)}`.toLowerCase().includes(query.toLowerCase());
  return <div className="page-shell pipeline-page"><section className="hero-row"><div><p className="eyebrow">ACTIVE REVENUE</p><h1>Pipeline control room</h1><p className="hero-subtitle">Move deals with intent. Every change is permission-aware when connected to Salesforce.</p></div><span className="chip">Drag or use the stage menu</span></section><div className="board">{activeStages.map((stage) => { const deals = opportunities.filter((opportunity) => !opportunity.isClosed && opportunity.stageName === stage && matches(opportunity)); const total = deals.reduce((sum, opportunity) => sum + opportunity.amount, 0); return <section className="board-column" key={stage} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) onMove(draggedId, stage); setDraggedId(null); }}><header><span className={`stage-dot ${stageClass(stage)}`} /><b>{stage}</b><small>{deals.length}</small><strong>{compactCurrency.format(total)}</strong></header><div className="board-cards">{deals.map((opportunity) => <article className="deal-card" key={opportunity.id} draggable onDragStart={(event: DragEvent) => { event.dataTransfer.setData('text/plain', opportunity.id); setDraggedId(opportunity.id); }}><button className="deal-card-open" onClick={() => onOpen(opportunity)}><span className="deal-card-top"><span className="owner-avatar" style={{ background: opportunity.owner.color }}>{opportunity.owner.initials}</span>{isRisky(opportunity) && <span className="risk-pill">At risk</span>}</span><b>{opportunity.name}</b><small>{accountName(opportunity.accountId)}</small><div className="deal-card-metrics"><strong>{currency.format(opportunity.amount)}</strong><span>{opportunity.probability}%</span></div><div className="deal-card-footer"><span><CalendarDays size={13} /> {opportunity.closeDate.slice(5)}</span><GripVertical size={15} /></div></button><label className="stage-select"><span className="sr-only">Move {opportunity.name}</span><select value={opportunity.stageName} onChange={(event) => onMove(opportunity.id, event.target.value as OpportunityStage)}>{activeStages.map((option) => <option key={option}>{option}</option>)}</select></label></article>)}</div></section>; })}</div></div>;
}

function Accounts({ opportunities, query, onOpenOpportunity }: { opportunities: Opportunity[]; query: string; onOpenOpportunity: (opportunity: Opportunity) => void }) {
  const filteredAccounts = mockAccounts.filter((account) => `${account.name} ${account.industry} ${account.type}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page-shell"><section className="hero-row"><div><p className="eyebrow">CUSTOMER LANDSCAPE</p><h1>Account intelligence</h1><p className="hero-subtitle">A dense, useful account view that feels like a product - not a standard object list.</p></div><span className="chip"><Users size={14} /> {mockContacts.length} contacts</span></section><section className="panel data-table-panel"><div className="table-toolbar"><div><h2>Accounts</h2><span>Search with the command field above</span></div><button className="quiet-button">Industry: all</button></div><div className="responsive-table"><div className="table-head"><span>Account</span><span>Location</span><span>Open pipeline</span><span>Contacts</span><span>Owner</span></div>{filteredAccounts.map((account) => { const accountOpportunities = opportunities.filter((opportunity) => opportunity.accountId === account.id); const openValue = accountOpportunities.filter((opportunity) => !opportunity.isClosed).reduce((sum, opportunity) => sum + opportunity.amount, 0); const newest = accountOpportunities[0]; return <button className="table-row" key={account.id} onClick={() => newest && onOpenOpportunity(newest)}><span className="table-account"><i>{account.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</i><span><b>{account.name}</b><small>{account.industry} · {account.type}</small></span></span><span>{account.billingCity}, {account.billingState}</span><strong>{compactCurrency.format(openValue)}</strong><span>{mockContacts.filter((contact) => contact.accountId === account.id).length}</span><span className="owner-cell"><i style={{ background: account.owner.color }}>{account.owner.initials}</i>{account.owner.name}</span></button>; })}</div></section></div>;
}

function OpportunityModal({ opportunity, accountName, onClose, onSave, onCreate }: { opportunity?: Opportunity; accountName: string; onClose: () => void; onSave?: (patch: Partial<Opportunity>) => void; onCreate?: (input: OpportunityInput) => void }) {
  const [name, setName] = useState(opportunity?.name ?? '');
  const [stageName, setStageName] = useState<OpportunityStage>(opportunity?.stageName ?? 'Prospecting');
  const [amount, setAmount] = useState(opportunity?.amount ?? 50000);
  const [closeDate, setCloseDate] = useState(opportunity?.closeDate ?? '2026-08-15');
  const [nextStep, setNextStep] = useState(opportunity?.nextStep ?? '');
  const submit = (event: FormEvent) => { event.preventDefault(); if (!name.trim()) return; if (opportunity && onSave) onSave({ name, stageName, amount: Number(amount), closeDate, nextStep, probability: stageProbability[stageName] }); if (!opportunity && onCreate) onCreate({ name, accountId: mockAccounts[0].id, stageName, amount: Number(amount), probability: stageProbability[stageName], closeDate, nextStep, type: 'New Customer', leadSource: 'Web', description: '' }); };
  return <div className="modal-scrim" role="presentation"><form className="opportunity-modal" onSubmit={submit}><header><div><p className="eyebrow">{opportunity ? 'EDIT OPPORTUNITY' : 'NEW OPPORTUNITY'}</p><h2>{opportunity ? opportunity.name : 'Create an opportunity'}</h2>{accountName && <span>{accountName}</span>}</div><button type="button" className="icon-button" onClick={onClose}><X size={18} /></button></header><div className="form-grid"><label className="field field-wide">Opportunity name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Northstar expansion" /></label><label className="field">Stage<select value={stageName} onChange={(event) => setStageName(event.target.value as OpportunityStage)}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label><label className="field">Amount<input type="number" min="0" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label><label className="field">Close date<input type="date" value={closeDate} onChange={(event) => setCloseDate(event.target.value)} /></label><label className="field">Probability<input value={`${stageProbability[stageName]}%`} disabled /></label><label className="field field-wide">Next step<input value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="Describe the next customer action" /></label></div><footer><span className="write-status"><span className="live-dot" /> Demo write enabled</span><div><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">{opportunity ? 'Save changes' : 'Create opportunity'}</button></div></footer></form></div>;
}

createRoot(document.getElementById('root')!).render(<App />);

