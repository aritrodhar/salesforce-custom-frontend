import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { mockAccounts, mockContacts, mockOpportunities, owners } from './mockData';
import type { Account, AccountInput, AccountPatch, Contact, ContactInput, DataMode, Opportunity, OpportunityInput, OpportunityPatch } from './types';

type Notice = { id: number; tone: 'success' | 'error'; message: string } | null;

interface SalesDataContextValue {
  mode: DataMode;
  accounts: Account[];
  contacts: Contact[];
  opportunities: Opportunity[];
  notice: Notice;
  dismissNotice: () => void;
  updateOpportunity: (id: string, patch: OpportunityPatch) => Promise<void>;
  createOpportunity: (input: OpportunityInput) => Promise<void>;
  updateAccount: (id: string, patch: AccountPatch) => Promise<void>;
  createAccount: (input: AccountInput) => Promise<void>;
  createContact: (input: ContactInput) => Promise<void>;
}

const SalesDataContext = createContext<SalesDataContextValue | null>(null);
const now = () => new Date().toISOString();

function stageFlags(stageName: Opportunity['stageName']) {
  return {
    isClosed: stageName === 'Closed Won' || stageName === 'Closed Lost',
    isWon: stageName === 'Closed Won',
  };
}

function nextProbability(stageName: Opportunity['stageName'], current: number) {
  const defaults: Record<Opportunity['stageName'], number> = {
    Prospecting: 10,
    Qualification: 25,
    'Needs Analysis': 35,
    'Value Proposition': 50,
    'Proposal/Price Quote': 65,
    'Negotiation/Review': 80,
    'Closed Won': 100,
    'Closed Lost': 0,
  };
  return current === 0 || current === 100 ? defaults[stageName] : Math.max(current, defaults[stageName]);
}

function applyAccountPatch(account: Account, patch: AccountPatch): Account {
  return {
    ...account,
    name: patch.name ?? account.name,
    industry: patch.industry === null ? '' : (patch.industry ?? account.industry),
    type: patch.type === null ? '' : (patch.type ?? account.type),
    billingCity: patch.billingCity === null ? '' : (patch.billingCity ?? account.billingCity),
    billingState: patch.billingState === null ? '' : (patch.billingState ?? account.billingState),
    phone: patch.phone === null ? '' : (patch.phone ?? account.phone),
    website: patch.website === null ? '' : (patch.website ?? account.website),
    annualRevenue: patch.annualRevenue === null ? 0 : (patch.annualRevenue ?? account.annualRevenue),
    employees: patch.employees === null ? 0 : (patch.employees ?? account.employees),
    lastModifiedDate: now(),
  };
}

export function SalesDataProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState(mockAccounts);
  const [contacts, setContacts] = useState(mockContacts);
  const [opportunities, setOpportunities] = useState(mockOpportunities);
  const [notice, setNotice] = useState<Notice>(null);
  const mode: DataMode = 'mock';

  const value = useMemo<SalesDataContextValue>(() => ({
    mode,
    accounts,
    contacts,
    opportunities,
    notice,
    dismissNotice: () => setNotice(null),
    updateOpportunity: async (id, patch) => {
      setOpportunities((current) => current.map((opportunity) => {
        if (opportunity.id !== id) return opportunity;
        const stageName = patch.stageName ?? opportunity.stageName;
        return {
          ...opportunity,
          ...patch,
          ...stageFlags(stageName),
          probability: patch.probability ?? (patch.stageName ? nextProbability(stageName, opportunity.probability) : opportunity.probability),
          lastModifiedDate: now(),
        };
      }));
      setNotice({ id: Date.now(), tone: 'success', message: 'Opportunity updated in demo data.' });
    },
    createOpportunity: async (input) => {
      const stage = input.stageName;
      const record: Opportunity = {
        ...input,
        id: `o-demo-${Date.now()}`,
        owner: owners[0],
        lastModifiedDate: now(),
        ...stageFlags(stage),
      };
      setOpportunities((current) => [record, ...current]);
      setNotice({ id: Date.now(), tone: 'success', message: 'Opportunity created in demo data.' });
    },
    updateAccount: async (id, patch) => {
      setAccounts((current) => current.map((account) => account.id === id ? applyAccountPatch(account, patch) : account));
      setNotice({ id: Date.now(), tone: 'success', message: 'Account updated in demo data.' });
    },
    createAccount: async (input) => {
      const record: Account = {
        id: `a-demo-${Date.now()}`,
        name: input.name,
        industry: input.industry ?? '',
        type: input.type ?? '',
        billingCity: input.billingCity ?? '',
        billingState: input.billingState ?? '',
        phone: input.phone ?? '',
        website: input.website ?? '',
        annualRevenue: input.annualRevenue ?? 0,
        employees: input.employees ?? 0,
        owner: owners[0],
        lastModifiedDate: now(),
      };
      setAccounts((current) => [record, ...current]);
      setNotice({ id: Date.now(), tone: 'success', message: 'Account created in demo data.' });
    },
    createContact: async (input) => {
      const record: Contact = { ...input, id: `c-demo-${Date.now()}`, owner: owners[0], lastModifiedDate: now() };
      setContacts((current) => [record, ...current]);
      setNotice({ id: Date.now(), tone: 'success', message: 'Contact created in demo data.' });
    },
  }), [accounts, contacts, opportunities, notice]);

  return <SalesDataContext.Provider value={value}>{children}</SalesDataContext.Provider>;
}

export function useSalesData() {
  const context = useContext(SalesDataContext);
  if (!context) throw new Error('useSalesData must be used inside SalesDataProvider');
  return context;
}
