export type DataMode = 'mock' | 'salesforce-readonly' | 'salesforce-live';

/** Salesforce admins can configure custom StageName values. */
export type OpportunityStage = string;

export interface Owner {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  industry: string;
  type: string;
  billingCity: string;
  billingState: string;
  phone: string;
  website: string;
  annualRevenue: number;
  employees: number;
  owner: Owner;
  lastModifiedDate: string;
}

export interface PicklistOption {
  label: string;
  value: string;
}

export interface AccountFieldOptions {
  industry: PicklistOption[];
  type: PicklistOption[];
}

export type AccountWritableFields = Pick<Account, 'name' | 'industry' | 'type' | 'billingCity' | 'billingState' | 'phone' | 'website' | 'annualRevenue' | 'employees'>;
export type AccountInput = Pick<AccountWritableFields, 'name'> & Partial<Omit<AccountWritableFields, 'name'>>;

export interface Contact {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  owner: Owner;
  lastModifiedDate: string;
}

export interface Opportunity {
  id: string;
  accountId: string;
  name: string;
  stageName: OpportunityStage;
  amount: number;
  probability: number;
  closeDate: string;
  nextStep: string;
  type: string;
  leadSource: string;
  description: string;
  isClosed: boolean;
  isWon: boolean;
  owner: Owner;
  lastModifiedDate: string;
}

export type OpportunityInput = Omit<Opportunity, 'id' | 'owner' | 'lastModifiedDate' | 'isClosed' | 'isWon'>;
export type OpportunityPatch = Partial<Pick<Opportunity, 'name' | 'stageName' | 'amount' | 'probability' | 'closeDate' | 'nextStep' | 'type' | 'leadSource' | 'description'>>;
export type AccountPatch = Partial<{
  [Field in keyof AccountWritableFields]: AccountWritableFields[Field] | null;
}>;
export type ContactInput = Omit<Contact, 'id' | 'owner' | 'lastModifiedDate'>;

export const opportunityStages: OpportunityStage[] = [
  'Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition',
  'Proposal/Price Quote', 'Negotiation/Review', 'Closed Won', 'Closed Lost',
];
