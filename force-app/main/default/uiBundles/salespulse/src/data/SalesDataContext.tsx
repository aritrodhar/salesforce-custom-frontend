import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { mockAccounts, mockContacts, mockOpportunities, owners } from './mockData';
import type { Account, AccountPatch, Contact, ContactInput, DataMode, Opportunity, OpportunityInput, OpportunityPatch } from './types';

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
      setAccounts((current) => current.map((account) => account.id === id ? { ...account, ...patch, lastModifiedDate: now() } : account));
      setNotice({ id: Date.now(), tone: 'success', message: 'Account updated in demo data.' });
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
