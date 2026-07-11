import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDataSDK } from '@salesforce/platform-sdk';
import {
  createSalesforceAccount,
  createSalesforceOpportunity,
  loadSalesforceSalesPulseData,
  updateSalesforceAccount,
  updateSalesforceOpportunity,
} from './salesforceGateway';

vi.mock('@salesforce/platform-sdk', () => ({
  createDataSDK: vi.fn(),
  gql: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce(
      (document, segment, index) => `${document}${segment}${String(values[index] ?? '')}`,
      '',
    ),
}));

const query = vi.fn();
const mutate = vi.fn();
const createDataSDKMock = vi.mocked(createDataSDK);

beforeEach(() => {
  vi.clearAllMocks();
  createDataSDKMock.mockResolvedValue({
    graphql: { query, mutate },
  } as unknown as Awaited<ReturnType<typeof createDataSDK>>);
});

describe('Salesforce Account mutations', () => {
  it('creates an Account while omitting blank optional fields', async () => {
    mutate.mockResolvedValue({
      data: { uiapi: { AccountCreate: { Record: { Id: '001-create' } } } },
    });

    const id = await createSalesforceAccount({
      name: '  Acme Labs  ',
      industry: '   ',
      billingCity: '  Pune ',
      annualRevenue: 0,
    });

    expect(id).toBe('001-create');
    expect(mutate).toHaveBeenCalledWith({
      mutation: expect.stringContaining('mutation CreateSalesPulseAccount'),
      variables: {
        input: {
          Account: {
            Name: 'Acme Labs',
            BillingCity: 'Pune',
            AnnualRevenue: 0,
          },
        },
      },
    });
  });

  it('updates only the supplied Account fields and preserves intentional clears', async () => {
    mutate.mockResolvedValue({
      data: { uiapi: { AccountUpdate: { Record: { Id: '001-update' } } } },
    });

    const id = await updateSalesforceAccount({
      id: '001-update',
      billingCity: '  Mumbai ',
      phone: null,
      employees: 42,
    });

    expect(id).toBe('001-update');
    expect(mutate).toHaveBeenCalledWith({
      mutation: expect.stringContaining('mutation UpdateSalesPulseAccount'),
      variables: {
        input: {
          Id: '001-update',
          Account: {
            BillingCity: 'Mumbai',
            Phone: null,
            NumberOfEmployees: 42,
          },
        },
      },
    });
  });

  it('surfaces Salesforce permission and validation errors', async () => {
    mutate.mockResolvedValue({
      data: undefined,
      errors: [{ message: 'Insufficient access to Account.Name' }],
    });

    await expect(
      updateSalesforceAccount({ id: '001-denied', name: 'Restricted' }),
    ).rejects.toThrow('Insufficient access to Account.Name');
  });

  it('fails clearly when GraphQL is unavailable', async () => {
    createDataSDKMock.mockResolvedValue(
      {} as Awaited<ReturnType<typeof createDataSDK>>,
    );

    await expect(createSalesforceAccount({ name: 'Unavailable' })).rejects.toThrow(
      'Salesforce GraphQL is unavailable',
    );
  });
});

describe('Salesforce Opportunity mutations', () => {
  it('preserves the existing Opportunity create payload', async () => {
    mutate.mockResolvedValue({
      data: { uiapi: { OpportunityCreate: { Record: { Id: '006-create' } } } },
    });

    const id = await createSalesforceOpportunity({
      name: 'Expansion',
      accountId: '001-account',
      stageName: 'Prospecting',
      amount: 125000,
      probability: 10,
      closeDate: '2026-09-30',
      nextStep: 'Discovery',
      type: 'New Customer',
      leadSource: 'Web',
      description: 'Not part of the existing create flow',
    });

    expect(id).toBe('006-create');
    expect(mutate).toHaveBeenCalledWith({
      mutation: expect.stringContaining('mutation CreateSalesPulseOpportunity'),
      variables: {
        input: {
          Opportunity: {
            Name: 'Expansion',
            AccountId: '001-account',
            StageName: 'Prospecting',
            Amount: 125000,
            CloseDate: '2026-09-30',
            NextStep: 'Discovery',
            Type: 'New Customer',
            LeadSource: 'Web',
          },
        },
      },
    });
  });

  it('preserves the existing Opportunity update allowlist', async () => {
    mutate.mockResolvedValue({
      data: { uiapi: { OpportunityUpdate: { Record: { Id: '006-update' } } } },
    });

    const id = await updateSalesforceOpportunity({
      id: '006-update',
      stageName: 'Qualification',
      amount: 95000,
      closeDate: '2026-10-15',
      nextStep: 'Technical review',
    });

    expect(id).toBe('006-update');
    expect(mutate).toHaveBeenCalledWith({
      mutation: expect.stringContaining('mutation UpdateSalesPulseOpportunity'),
      variables: {
        input: {
          Id: '006-update',
          Opportunity: {
            StageName: 'Qualification',
            Amount: 95000,
            CloseDate: '2026-10-15',
            NextStep: 'Technical review',
          },
        },
      },
    });
  });
});

describe('Salesforce record loading', () => {
  it('paginates Accounts and Opportunities without reloading a completed connection', async () => {
    query
      .mockResolvedValueOnce({
        data: {
          uiapi: {
            query: {
              Account: {
                edges: [],
                pageInfo: { hasNextPage: true, endCursor: 'account-cursor' },
              },
              Opportunity: {
                edges: [],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          uiapi: {
            query: {
              Account: {
                edges: [],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          uiapi: {
            objectInfos: [
              {
                ApiName: 'Account',
                defaultRecordTypeId: '012-default',
                fields: [
                  {
                    ApiName: 'Industry',
                    picklistValuesByRecordTypeIDs: [
                      {
                        recordTypeID: '012-default',
                        picklistValues: [
                          {
                            label: 'Food &amp; Beverage',
                            value: 'Food &amp; Beverage',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    ApiName: 'Type',
                    picklistValuesByRecordTypeIDs: [
                      {
                        recordTypeID: '012-default',
                        picklistValues: [
                          { label: 'Direct Customer', value: 'Customer - Direct' },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      });

    await expect(loadSalesforceSalesPulseData()).resolves.toEqual({
      accounts: [],
      opportunities: [],
      accountFieldOptions: {
        industry: [{ label: 'Food & Beverage', value: 'Food & Beverage' }],
        type: [{ label: 'Direct Customer', value: 'Customer - Direct' }],
      },
    });

    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        cacheControl: 'no-cache',
        variables: {
          accountAfter: undefined,
          opportunityAfter: undefined,
          skipAccounts: false,
          skipOpportunities: false,
        },
      }),
    );
    expect(query.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        cacheControl: 'no-cache',
        variables: {
          accountAfter: 'account-cursor',
          opportunityAfter: undefined,
          skipAccounts: false,
          skipOpportunities: true,
        },
      }),
    );
    expect(query.mock.calls[2]?.[0]).toEqual(
      expect.objectContaining({
        query: expect.stringContaining('query AccountFieldMetadata'),
        cacheControl: 'no-cache',
        variables: {
          inputs: [
            {
              apiName: 'Account',
              fieldNames: ['Industry', 'Type'],
            },
          ],
        },
      }),
    );
  });
});
