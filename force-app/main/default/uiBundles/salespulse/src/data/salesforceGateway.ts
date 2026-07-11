import {
  createDataSDK,
  gql,
  type DataSDKGraphQL,
  type GraphQLError,
  type QueryResult,
} from '@salesforce/platform-sdk';
import type {
  Account,
  AccountFieldOptions,
  AccountInput,
  AccountPatch,
  Opportunity,
  OpportunityInput,
  Owner,
  PicklistOption,
} from './types';

const salesPulseQuery = gql`
  query SalesPulseData(
    $accountAfter: String
    $opportunityAfter: String
    $skipAccounts: Boolean!
    $skipOpportunities: Boolean!
  ) {
    uiapi {
      query {
        Account(first: 200, after: $accountAfter) @skip(if: $skipAccounts) {
          edges {
            node {
              Id
              Name @optional {
                value
              }
              Industry @optional {
                value
              }
              Type @optional {
                value
              }
              BillingCity @optional {
                value
              }
              BillingState @optional {
                value
              }
              Phone @optional {
                value
              }
              Website @optional {
                value
              }
              AnnualRevenue @optional {
                value
              }
              NumberOfEmployees @optional {
                value
              }
              LastModifiedDate @optional {
                value
              }
              Owner @optional {
                Name @optional {
                  value
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
        Opportunity(first: 200, after: $opportunityAfter) @skip(if: $skipOpportunities) {
          edges {
            node {
              Id
              Name @optional {
                value
              }
              StageName @optional {
                value
              }
              Amount @optional {
                value
              }
              Probability @optional {
                value
              }
              CloseDate @optional {
                value
              }
              NextStep @optional {
                value
              }
              Type @optional {
                value
              }
              LeadSource @optional {
                value
              }
              Description @optional {
                value
              }
              IsClosed @optional {
                value
              }
              IsWon @optional {
                value
              }
              LastModifiedDate @optional {
                value
              }
              Account @optional {
                Id
              }
              Owner @optional {
                Name @optional {
                  value
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }
`;

const accountFieldMetadataQuery = gql`
  query AccountFieldMetadata($inputs: [ObjectInfoInput!]) {
    uiapi {
      objectInfos(objectInfoInputs: $inputs) {
        ApiName
        defaultRecordTypeId
        fields {
          ApiName
          ... on PicklistField {
            picklistValuesByRecordTypeIDs {
              recordTypeID
              picklistValues {
                label
                value
              }
            }
          }
        }
      }
    }
  }
`;

const updateOpportunityMutation = gql`
  mutation UpdateSalesPulseOpportunity($input: OpportunityUpdateInput!) {
    uiapi(input: { allOrNone: true }) {
      OpportunityUpdate(input: $input) {
        Record {
          Id
        }
      }
    }
  }
`;

const createOpportunityMutation = gql`
  mutation CreateSalesPulseOpportunity($input: OpportunityCreateInput!) {
    uiapi(input: { allOrNone: true }) {
      OpportunityCreate(input: $input) {
        Record {
          Id
        }
      }
    }
  }
`;

const updateAccountMutation = gql`
  mutation UpdateSalesPulseAccount($input: AccountUpdateInput!) {
    uiapi(input: { allOrNone: true }) {
      AccountUpdate(input: $input) {
        Record {
          Id
        }
      }
    }
  }
`;

const createAccountMutation = gql`
  mutation CreateSalesPulseAccount($input: AccountCreateInput!) {
    uiapi(input: { allOrNone: true }) {
      AccountCreate(input: $input) {
        Record {
          Id
        }
      }
    }
  }
`;

type SalesforceField<T> = T | { value?: T | null } | null | undefined;

interface SalesforceOwnerNode {
  Owner?: {
    Name?: SalesforceField<string>;
  } | null;
}

interface SalesforceAccountNode extends SalesforceOwnerNode {
  Id: string;
  Name?: SalesforceField<string>;
  Industry?: SalesforceField<string>;
  Type?: SalesforceField<string>;
  BillingCity?: SalesforceField<string>;
  BillingState?: SalesforceField<string>;
  Phone?: SalesforceField<string>;
  Website?: SalesforceField<string>;
  AnnualRevenue?: SalesforceField<number>;
  NumberOfEmployees?: SalesforceField<number>;
  LastModifiedDate?: SalesforceField<string>;
}

interface SalesforceOpportunityNode extends SalesforceOwnerNode {
  Id: string;
  Name?: SalesforceField<string>;
  StageName?: SalesforceField<string>;
  Amount?: SalesforceField<number>;
  Probability?: SalesforceField<number>;
  CloseDate?: SalesforceField<string>;
  NextStep?: SalesforceField<string>;
  Type?: SalesforceField<string>;
  LeadSource?: SalesforceField<string>;
  Description?: SalesforceField<string>;
  IsClosed?: SalesforceField<boolean>;
  IsWon?: SalesforceField<boolean>;
  LastModifiedDate?: SalesforceField<string>;
  Account?: { Id?: string | null } | null;
}

interface SalesforceConnection<T> {
  edges?: Array<{ node: T }> | null;
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: string | null;
  };
}

interface SalesPulseQueryVariables {
  accountAfter?: string;
  opportunityAfter?: string;
  skipAccounts: boolean;
  skipOpportunities: boolean;
}

interface SalesPulseQueryData {
  uiapi?: {
    query?: {
      Account?: SalesforceConnection<SalesforceAccountNode> | null;
      Opportunity?: SalesforceConnection<SalesforceOpportunityNode> | null;
    } | null;
  } | null;
}

type SalesPulseRecordQuery = NonNullable<NonNullable<SalesPulseQueryData['uiapi']>['query']>;

interface SalesforcePicklistMetadataField {
  ApiName?: string | null;
  picklistValuesByRecordTypeIDs?: Array<{
    recordTypeID: string;
    picklistValues?: Array<{
      label?: string | null;
      value?: string | null;
    }> | null;
  }> | null;
}

interface AccountFieldMetadataQueryData {
  uiapi?: {
    objectInfos?: Array<{
      ApiName?: string | null;
      defaultRecordTypeId?: string | null;
      fields?: SalesforcePicklistMetadataField[] | null;
    } | null> | null;
  } | null;
}

interface UpdateOpportunityMutationData {
  uiapi?: {
    OpportunityUpdate?: { Record?: { Id?: string | null } | null } | null;
  } | null;
}

interface CreateOpportunityMutationData {
  uiapi?: {
    OpportunityCreate?: { Record?: { Id?: string | null } | null } | null;
  } | null;
}

interface UpdateAccountMutationData {
  uiapi?: {
    AccountUpdate?: { Record?: { Id?: string | null } | null } | null;
  } | null;
}

interface CreateAccountMutationData {
  uiapi?: {
    AccountCreate?: { Record?: { Id?: string | null } | null } | null;
  } | null;
}

type AccountWriteValues = {
  Name?: string | null;
  Industry?: string | null;
  Type?: string | null;
  BillingCity?: string | null;
  BillingState?: string | null;
  Phone?: string | null;
  Website?: string | null;
  AnnualRevenue?: number | null;
  NumberOfEmployees?: number | null;
};

function field<T>(value: SalesforceField<T>): T | undefined {
  if (value !== null && typeof value === 'object' && 'value' in value) {
    return value.value ?? undefined;
  }
  return (value ?? undefined) as T | undefined;
}

function owner(node: SalesforceOwnerNode): Owner {
  const name = String(field(node.Owner?.Name) ?? 'Unassigned');
  return {
    id: `owner-${name}`,
    name,
    initials:
      name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'SF',
    color: '#386b91',
  };
}

function assertResult(
  result: { errors?: GraphQLError[] } | undefined,
  operation: string,
): void {
  if (!result) {
    throw new Error(`${operation} did not return a Salesforce response.`);
  }
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join('; '));
  }
}

function assertRecordId(id: string | null | undefined, operation: string): string {
  if (!id) {
    throw new Error(`${operation} completed without returning a record ID.`);
  }
  return id;
}

async function getGraphql(): Promise<DataSDKGraphQL> {
  const sdk = await createDataSDK();
  if (!sdk.graphql) {
    throw new Error('Salesforce GraphQL is unavailable outside a supported Salesforce host.');
  }
  return sdk.graphql;
}

function textValue(
  value: string | null | undefined,
  clearEmpty: boolean,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return clearEmpty ? null : undefined;
  const trimmed = value.trim();
  return trimmed || (clearEmpty ? null : undefined);
}

function accountValues(input: AccountPatch, clearEmpty: boolean): AccountWriteValues {
  const values: AccountWriteValues = {};
  const name = textValue(input.name, clearEmpty);
  const industry = textValue(input.industry, clearEmpty);
  const type = textValue(input.type, clearEmpty);
  const billingCity = textValue(input.billingCity, clearEmpty);
  const billingState = textValue(input.billingState, clearEmpty);
  const phone = textValue(input.phone, clearEmpty);
  const website = textValue(input.website, clearEmpty);

  if (name !== undefined) values.Name = name;
  if (industry !== undefined) values.Industry = industry;
  if (type !== undefined) values.Type = type;
  if (billingCity !== undefined) values.BillingCity = billingCity;
  if (billingState !== undefined) values.BillingState = billingState;
  if (phone !== undefined) values.Phone = phone;
  if (website !== undefined) values.Website = website;
  if (input.annualRevenue !== undefined) values.AnnualRevenue = input.annualRevenue;
  if (input.employees !== undefined) values.NumberOfEmployees = input.employees;

  return values;
}

const namedHtmlEntities: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
};

function decodeHtmlEntities(value: string): string {
  return value.replace(
    /&(#(?:x[\da-f]+|\d+)|[a-z]+);/gi,
    (entity, code: string) => {
      if (code.startsWith('#')) {
        const hexadecimal = code[1]?.toLowerCase() === 'x';
        const numericValue = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
        return Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 0x10ffff
          ? String.fromCodePoint(numericValue)
          : entity;
      }
      return namedHtmlEntities[code.toLowerCase()] ?? entity;
    },
  );
}

function picklistOptions(
  fieldMetadata: SalesforcePicklistMetadataField | undefined,
  defaultRecordTypeId: string | null | undefined,
): PicklistOption[] {
  const entries = fieldMetadata?.picklistValuesByRecordTypeIDs ?? [];
  const entry =
    entries.find(({ recordTypeID }) => recordTypeID === defaultRecordTypeId) ?? entries[0];
  const options = new Map<string, PicklistOption>();

  for (const option of entry?.picklistValues ?? []) {
    if (!option.value) continue;
    const value = decodeHtmlEntities(option.value);
    options.set(value, {
      value,
      label: decodeHtmlEntities(option.label || option.value),
    });
  }

  return [...options.values()].sort((left, right) => left.label.localeCompare(right.label));
}

async function loadAccountFieldOptions(graphql: DataSDKGraphQL): Promise<AccountFieldOptions> {
  const result = await graphql.query<
    AccountFieldMetadataQueryData,
    { inputs: Array<{ apiName: string; fieldNames: string[] }> }
  >({
    query: accountFieldMetadataQuery,
    variables: {
      inputs: [
        {
          apiName: 'Account',
          fieldNames: ['Industry', 'Type'],
        },
      ],
    },
    cacheControl: 'no-cache',
  });
  assertResult(result, 'Loading Account field metadata');

  const objectInfo = result.data?.uiapi?.objectInfos?.find(
    (candidate) => candidate?.ApiName === 'Account',
  );
  const fields = objectInfo?.fields ?? [];

  return {
    industry: picklistOptions(
      fields.find(({ ApiName }) => ApiName === 'Industry'),
      objectInfo?.defaultRecordTypeId,
    ),
    type: picklistOptions(
      fields.find(({ ApiName }) => ApiName === 'Type'),
      objectInfo?.defaultRecordTypeId,
    ),
  };
}

export async function loadSalesforceSalesPulseData(): Promise<{
  accounts: Account[];
  opportunities: Opportunity[];
  accountFieldOptions: AccountFieldOptions;
}> {
  const graphql = await getGraphql();
  const accountNodes: SalesforceAccountNode[] = [];
  const opportunityNodes: SalesforceOpportunityNode[] = [];
  let accountAfter: string | undefined;
  let opportunityAfter: string | undefined;
  let accountsComplete = false;
  let opportunitiesComplete = false;
  let pageCount = 0;

  while (!accountsComplete || !opportunitiesComplete) {
    pageCount += 1;
    if (pageCount > 50) {
      throw new Error('Loading Sales Pulse data exceeded the pagination safety limit.');
    }

    const result: QueryResult<SalesPulseQueryData> = await graphql.query<
      SalesPulseQueryData,
      SalesPulseQueryVariables
    >({
      query: salesPulseQuery,
      variables: {
        accountAfter,
        opportunityAfter,
        skipAccounts: accountsComplete,
        skipOpportunities: opportunitiesComplete,
      },
      cacheControl: 'no-cache',
    });
    assertResult(result, 'Loading Sales Pulse data');
    const queryData: SalesPulseRecordQuery | null | undefined = result.data?.uiapi?.query;
    if (!queryData) {
      throw new Error('Loading Sales Pulse data completed without returning query data.');
    }

    if (!accountsComplete) {
      const connection: SalesforceConnection<SalesforceAccountNode> | null | undefined =
        queryData.Account;
      if (!connection) {
        throw new Error('Loading Sales Pulse data did not return the Account connection.');
      }
      accountNodes.push(...(connection.edges ?? []).map(({ node }) => node));
      accountsComplete = !connection.pageInfo.hasNextPage;
      if (!accountsComplete) {
        if (!connection.pageInfo.endCursor) {
          throw new Error('Loading Accounts returned an invalid pagination cursor.');
        }
        accountAfter = connection.pageInfo.endCursor;
      }
    }

    if (!opportunitiesComplete) {
      const connection: SalesforceConnection<SalesforceOpportunityNode> | null | undefined =
        queryData.Opportunity;
      if (!connection) {
        throw new Error('Loading Sales Pulse data did not return the Opportunity connection.');
      }
      opportunityNodes.push(...(connection.edges ?? []).map(({ node }) => node));
      opportunitiesComplete = !connection.pageInfo.hasNextPage;
      if (!opportunitiesComplete) {
        if (!connection.pageInfo.endCursor) {
          throw new Error('Loading Opportunities returned an invalid pagination cursor.');
        }
        opportunityAfter = connection.pageInfo.endCursor;
      }
    }
  }

  const accounts = accountNodes.map(
    (node): Account => ({
      id: node.Id,
      name: String(field(node.Name) ?? 'Unnamed account'),
      industry: String(field(node.Industry) ?? ''),
      type: String(field(node.Type) ?? ''),
      billingCity: String(field(node.BillingCity) ?? ''),
      billingState: String(field(node.BillingState) ?? ''),
      phone: String(field(node.Phone) ?? ''),
      website: String(field(node.Website) ?? ''),
      annualRevenue: Number(field(node.AnnualRevenue) ?? 0),
      employees: Number(field(node.NumberOfEmployees) ?? 0),
      owner: owner(node),
      lastModifiedDate: String(field(node.LastModifiedDate) ?? ''),
    }),
  );

  const opportunities = opportunityNodes.map(
    (node): Opportunity => ({
      id: node.Id,
      accountId: String(node.Account?.Id ?? ''),
      name: String(field(node.Name) ?? 'Untitled opportunity'),
      stageName: String(field(node.StageName) ?? 'Prospecting'),
      amount: Number(field(node.Amount) ?? 0),
      probability: Number(field(node.Probability) ?? 0),
      closeDate: String(field(node.CloseDate) ?? ''),
      nextStep: String(field(node.NextStep) ?? ''),
      type: String(field(node.Type) ?? ''),
      leadSource: String(field(node.LeadSource) ?? ''),
      description: String(field(node.Description) ?? ''),
      isClosed: Boolean(field(node.IsClosed)),
      isWon: Boolean(field(node.IsWon)),
      owner: owner(node),
      lastModifiedDate: String(field(node.LastModifiedDate) ?? ''),
    }),
  );

  const accountFieldOptions = await loadAccountFieldOptions(graphql);
  return { accounts, opportunities, accountFieldOptions };
}

export async function updateSalesforceOpportunity(input: {
  id: string;
  stageName?: string;
  amount?: number;
  closeDate?: string;
  nextStep?: string;
}): Promise<string> {
  const values: Record<string, string | number> = {};
  if (input.stageName !== undefined) values.StageName = input.stageName;
  if (input.amount !== undefined) values.Amount = input.amount;
  if (input.closeDate !== undefined) values.CloseDate = input.closeDate;
  if (input.nextStep !== undefined) values.NextStep = input.nextStep;

  const graphql = await getGraphql();
  const result = await graphql.mutate<UpdateOpportunityMutationData>({
    mutation: updateOpportunityMutation,
    variables: { input: { Id: input.id, Opportunity: values } },
  });
  assertResult(result, 'Updating the opportunity');
  return assertRecordId(
    result.data?.uiapi?.OpportunityUpdate?.Record?.Id,
    'Updating the opportunity',
  );
}

export async function createSalesforceOpportunity(input: OpportunityInput): Promise<string> {
  const graphql = await getGraphql();
  const result = await graphql.mutate<CreateOpportunityMutationData>({
    mutation: createOpportunityMutation,
    variables: {
      input: {
        Opportunity: {
          Name: input.name,
          AccountId: input.accountId,
          StageName: input.stageName,
          Amount: input.amount,
          CloseDate: input.closeDate,
          NextStep: input.nextStep,
          Type: input.type || undefined,
          LeadSource: input.leadSource || undefined,
        },
      },
    },
  });
  assertResult(result, 'Creating the opportunity');
  return assertRecordId(
    result.data?.uiapi?.OpportunityCreate?.Record?.Id,
    'Creating the opportunity',
  );
}

export async function updateSalesforceAccount(
  input: { id: string } & AccountPatch,
): Promise<string> {
  const graphql = await getGraphql();
  const result = await graphql.mutate<UpdateAccountMutationData>({
    mutation: updateAccountMutation,
    variables: {
      input: {
        Id: input.id,
        Account: accountValues(input, true),
      },
    },
  });
  assertResult(result, 'Updating the account');
  return assertRecordId(
    result.data?.uiapi?.AccountUpdate?.Record?.Id,
    'Updating the account',
  );
}

export async function createSalesforceAccount(input: AccountInput): Promise<string> {
  const graphql = await getGraphql();
  const result = await graphql.mutate<CreateAccountMutationData>({
    mutation: createAccountMutation,
    variables: {
      input: {
        Account: accountValues(input, false),
      },
    },
  });
  assertResult(result, 'Creating the account');
  return assertRecordId(
    result.data?.uiapi?.AccountCreate?.Record?.Id,
    'Creating the account',
  );
}
