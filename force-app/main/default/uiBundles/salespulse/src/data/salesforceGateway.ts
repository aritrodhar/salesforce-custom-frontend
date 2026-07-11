import { createDataSDK } from '@salesforce/platform-sdk';

/**
 * Live Salesforce data gateway for Sales Pulse.
 * Calls run in the current Salesforce user session when the UIBundle is hosted
 * by Salesforce. No OAuth token is handled in browser code.
 */
const salesPulseQuery = `
  query SalesPulseData {
    uiapi {
      query {
        Account(first: 50) {
          edges {
            node {
              Id
              Name @optional { value }
              Industry @optional { value }
              Type @optional { value }
              BillingCity @optional { value }
              BillingState @optional { value }
              Phone @optional { value }
              Website @optional { value }
              AnnualRevenue @optional { value }
              NumberOfEmployees @optional { value }
              LastModifiedDate @optional { value }
              Owner @optional { Name @optional { value } }
            }
          }
        }
        Opportunity(first: 100) {
          edges {
            node {
              Id
              Name @optional { value }
              StageName @optional { value displayValue }
              Amount @optional { value displayValue }
              Probability @optional { value }
              CloseDate @optional { value displayValue }
              NextStep @optional { value }
              Type @optional { value }
              LeadSource @optional { value }
              IsClosed @optional { value }
              IsWon @optional { value }
              LastModifiedDate @optional { value }
              Account @optional { Id Name @optional { value } }
              Owner @optional { Name @optional { value } }
            }
          }
        }
      }
    }
  }
`;

const updateOpportunityMutation = `
  mutation UpdateSalesPulseOpportunity($input: OpportunityUpdateInput!) {
    uiapi(input: { allOrNone: true }) {
      OpportunityUpdate(input: $input) { Record { Id } }
    }
  }
`;

export async function loadSalesforceSalesPulseData() {
  const sdk = await createDataSDK();
  const result = await sdk.graphql?.query({ query: salesPulseQuery });
  if (result?.errors?.length) throw new Error(result.errors.map((error: { message: string }) => error.message).join('; '));
  return result?.data;
}

/**
 * Deliberately not called until live writes are approved. Only allowlisted
 * Opportunity fields are sent; Salesforce still enforces CRUD/FLS/sharing.
 */
export async function updateSalesforceOpportunity(input: { id: string; stageName?: string; amount?: number; closeDate?: string; nextStep?: string }) {
  const values: Record<string, string | number> = {};
  if (input.stageName !== undefined) values.StageName = input.stageName;
  if (input.amount !== undefined) values.Amount = input.amount;
  if (input.closeDate !== undefined) values.CloseDate = input.closeDate;
  if (input.nextStep !== undefined) values.NextStep = input.nextStep;
  const sdk = await createDataSDK();
  const result = await sdk.graphql?.mutate({ mutation: updateOpportunityMutation, variables: { input: { Id: input.id, Opportunity: values } } });
  if (result?.errors?.length) throw new Error(result.errors.map((error: { message: string }) => error.message).join('; '));
  return result?.data;
}
