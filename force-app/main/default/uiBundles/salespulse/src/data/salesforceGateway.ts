import { createDataSDK } from '@salesforce/platform-sdk';
import type { Account, Opportunity, OpportunityInput, Owner } from './types';

const salesPulseQuery = `query SalesPulseData { uiapi { query {
  Account(first: 50) { edges { node { Id Name @optional { value } Industry @optional { value } Type @optional { value } BillingCity @optional { value } BillingState @optional { value } Phone @optional { value } Website @optional { value } AnnualRevenue @optional { value } NumberOfEmployees @optional { value } LastModifiedDate @optional { value } Owner @optional { Name @optional { value } } } } }
  Opportunity(first: 100) { edges { node { Id Name @optional { value } StageName @optional { value } Amount @optional { value } Probability @optional { value } CloseDate @optional { value } NextStep @optional { value } Type @optional { value } LeadSource @optional { value } IsClosed @optional { value } IsWon @optional { value } LastModifiedDate @optional { value } Account @optional { Id } Owner @optional { Name @optional { value } } } } }
} } }`;

const updateOpportunityMutation = `mutation UpdateSalesPulseOpportunity($input: OpportunityUpdateInput!) { uiapi(input: { allOrNone: true }) { OpportunityUpdate(input: $input) { Record { Id } } } }`;
const createOpportunityMutation = `mutation CreateSalesPulseOpportunity($input: OpportunityCreateInput!) { uiapi(input: { allOrNone: true }) { OpportunityCreate(input: $input) { Record { Id } } } }`;

const field = (value: unknown) => value && typeof value === 'object' && 'value' in value ? (value as { value?: unknown }).value : value;
const owner = (node: any): Owner => { const name = String(field(node?.Owner?.Name) ?? 'Unassigned'); return { id: 'owner', name, initials: name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'SF', color: '#386b91' }; };
const assertResult = (result: any) => { if (result?.errors?.length) throw new Error(result.errors.map((error: { message: string }) => error.message).join('; ')); };

export async function loadSalesforceSalesPulseData(): Promise<{ accounts: Account[]; opportunities: Opportunity[] }> {
  const sdk = await createDataSDK(); const result = await sdk.graphql?.query({ query: salesPulseQuery }); assertResult(result);
  const data: any = result?.data;
  const accounts = (data?.uiapi?.query?.Account?.edges ?? []).map(({ node }: any): Account => ({ id: node.Id, name: String(field(node.Name) ?? 'Unnamed account'), industry: String(field(node.Industry) ?? ''), type: String(field(node.Type) ?? ''), billingCity: String(field(node.BillingCity) ?? ''), billingState: String(field(node.BillingState) ?? ''), phone: String(field(node.Phone) ?? ''), website: String(field(node.Website) ?? ''), annualRevenue: Number(field(node.AnnualRevenue) ?? 0), employees: Number(field(node.NumberOfEmployees) ?? 0), owner: owner(node), lastModifiedDate: String(field(node.LastModifiedDate) ?? '') }));
  const opportunities = (data?.uiapi?.query?.Opportunity?.edges ?? []).map(({ node }: any): Opportunity => ({ id: node.Id, accountId: String(node.Account?.Id ?? ''), name: String(field(node.Name) ?? 'Untitled opportunity'), stageName: String(field(node.StageName) ?? 'Prospecting'), amount: Number(field(node.Amount) ?? 0), probability: Number(field(node.Probability) ?? 0), closeDate: String(field(node.CloseDate) ?? ''), nextStep: String(field(node.NextStep) ?? ''), type: String(field(node.Type) ?? ''), leadSource: String(field(node.LeadSource) ?? ''), description: '', isClosed: Boolean(field(node.IsClosed)), isWon: Boolean(field(node.IsWon)), owner: owner(node), lastModifiedDate: String(field(node.LastModifiedDate) ?? '') }));
  return { accounts, opportunities };
}

export async function updateSalesforceOpportunity(input: { id: string; stageName?: string; amount?: number; closeDate?: string; nextStep?: string }) {
  const values: Record<string, string | number> = {}; if (input.stageName !== undefined) values.StageName = input.stageName; if (input.amount !== undefined) values.Amount = input.amount; if (input.closeDate !== undefined) values.CloseDate = input.closeDate; if (input.nextStep !== undefined) values.NextStep = input.nextStep;
  const sdk = await createDataSDK(); const result = await sdk.graphql?.mutate({ mutation: updateOpportunityMutation, variables: { input: { Id: input.id, Opportunity: values } } }); assertResult(result); return result?.data;
}

export async function createSalesforceOpportunity(input: OpportunityInput) {
  const sdk = await createDataSDK(); const result = await sdk.graphql?.mutate({ mutation: createOpportunityMutation, variables: { input: { Opportunity: { Name: input.name, AccountId: input.accountId, StageName: input.stageName, Amount: input.amount, CloseDate: input.closeDate, NextStep: input.nextStep, Type: input.type || undefined, LeadSource: input.leadSource || undefined } } } }); assertResult(result); return result?.data;
}
