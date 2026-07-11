import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createSalesforceAccount,
  createSalesforceOpportunity,
  loadSalesforceSalesPulseData,
  updateSalesforceAccount,
  updateSalesforceOpportunity,
} from './data/salesforceGateway';
import type {
  Account,
  AccountFieldOptions,
  AccountInput,
  AccountPatch,
  Opportunity,
  OpportunityInput,
  PicklistOption,
} from './data/types';
import { opportunityStages } from './data/types';
import { mockAccounts, mockOpportunities } from './data/mockData';
import './styles/sales-pulse.css';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

type View = 'opportunities' | 'accounts';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown Salesforce error';
}

function App() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [accountFieldOptions, setAccountFieldOptions] = useState<AccountFieldOptions>({
    industry: [],
    type: [],
  });
  const [view, setView] = useState<View>('opportunities');
  const [live, setLive] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('Loading Salesforce records…');
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [creatingOpportunity, setCreatingOpportunity] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

  async function refresh() {
    const data = await loadSalesforceSalesPulseData();
    setAccounts(data.accounts);
    setOpportunities(data.opportunities);
    setAccountFieldOptions(data.accountFieldOptions);
    setLive(true);
  }

  useEffect(() => {
    let active = true;

    loadSalesforceSalesPulseData()
      .then((data) => {
        if (!active) return;
        setAccounts(data.accounts);
        setOpportunities(data.opportunities);
        setAccountFieldOptions(data.accountFieldOptions);
        setLive(true);
        setNotice('Live Salesforce data loaded.');
      })
      .catch(() => {
        if (!active) return;
        setNotice('Preview mode: open this app inside Salesforce to use live records.');
      });

    return () => {
      active = false;
    };
  }, []);

  const accountNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOpportunities = useMemo(
    () =>
      opportunities.filter((opportunity) =>
        `${opportunity.name} ${accountNames.get(opportunity.accountId) ?? ''} ${opportunity.stageName}`
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [accountNames, normalizedQuery, opportunities],
  );
  const visibleAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        `${account.name} ${account.industry} ${account.type} ${account.billingCity} ${account.billingState}`
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [accounts, normalizedQuery],
  );
  const stageOptions = useMemo(
    () => [...new Set([...opportunityStages, ...opportunities.map(({ stageName }) => stageName)])],
    [opportunities],
  );

  async function refreshAfterWrite(successMessage: string) {
    try {
      await refresh();
      setNotice(successMessage);
    } catch (error) {
      setNotice(`${successMessage} Refresh failed: ${errorMessage(error)}`);
    }
  }

  async function saveOpportunity(
    opportunity: Opportunity,
    values: Pick<Opportunity, 'stageName' | 'amount' | 'closeDate' | 'nextStep'>,
  ) {
    if (!live) return;
    try {
      await updateSalesforceOpportunity({ id: opportunity.id, ...values });
    } catch (error) {
      setNotice(`Opportunity update failed: ${errorMessage(error)}`);
      return;
    }
    setEditingOpportunity(null);
    await refreshAfterWrite('Opportunity updated in Salesforce.');
  }

  async function createOpportunity(input: OpportunityInput) {
    if (!live) return;
    try {
      await createSalesforceOpportunity(input);
    } catch (error) {
      setNotice(`Opportunity create failed: ${errorMessage(error)}`);
      return;
    }
    setCreatingOpportunity(false);
    await refreshAfterWrite('Opportunity created in Salesforce.');
  }

  async function saveAccount(account: Account, patch: AccountPatch) {
    if (!live) return;
    if (Object.keys(patch).length === 0) {
      setEditingAccount(null);
      setNotice('No account changes to save.');
      return;
    }
    try {
      await updateSalesforceAccount({ id: account.id, ...patch });
    } catch (error) {
      setNotice(`Account update failed: ${errorMessage(error)}`);
      return;
    }
    setEditingAccount(null);
    await refreshAfterWrite('Account updated in Salesforce.');
  }

  async function createAccount(input: AccountInput) {
    if (!live) return;
    try {
      await createSalesforceAccount(input);
    } catch (error) {
      setNotice(`Account create failed: ${errorMessage(error)}`);
      return;
    }
    setCreatingAccount(false);
    await refreshAfterWrite('Account created in Salesforce.');
  }

  function closeOpportunityForm() {
    setEditingOpportunity(null);
    setCreatingOpportunity(false);
  }

  function closeAccountForm() {
    setEditingAccount(null);
    setCreatingAccount(false);
  }

  const relatedAccountOpportunities = editingAccount
    ? opportunities.filter(({ accountId }) => accountId === editingAccount.id)
    : [];

  return (
    <div className="sales-pulse-app">
      <aside className="side-rail">
        <div className="brand">Sales Pulse</div>
        <nav className="nav-list" aria-label="Sales Pulse views">
          <button
            type="button"
            className={`nav-item ${view === 'opportunities' ? 'active' : ''}`}
            onClick={() => setView('opportunities')}
          >
            Opportunities
          </button>
          <button
            type="button"
            className={`nav-item ${view === 'accounts' ? 'active' : ''}`}
            onClick={() => setView('accounts')}
          >
            Accounts
          </button>
        </nav>
        <div className="rail-bottom">
          <span className="live-dot" />
          {live ? 'Salesforce write mode' : 'Preview mode'}
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="breadcrumb">
            <b>Sales Pulse</b>
            <span> / {view === 'accounts' ? 'Accounts' : 'Opportunities'}</span>
          </div>
          <div className="top-actions">
            <label className="command-search">
              <span className="sr-only">Search {view}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${view}`}
              />
            </label>
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                view === 'opportunities'
                  ? setCreatingOpportunity(true)
                  : setCreatingAccount(true)
              }
            >
              {view === 'opportunities' ? 'New opportunity' : 'New account'}
            </button>
          </div>
        </header>

        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}>
              ×
            </button>
          </div>
        )}

        <div className="page-shell">
          {view === 'opportunities' ? (
            <OpportunityTable
              rows={visibleOpportunities}
              accountName={(id) => accountNames.get(id) ?? 'Unassigned account'}
              live={live}
              onOpen={setEditingOpportunity}
            />
          ) : (
            <AccountTable
              accounts={visibleAccounts}
              opportunities={opportunities}
              live={live}
              onOpen={setEditingAccount}
            />
          )}
        </div>
      </main>

      {(editingOpportunity || creatingOpportunity) && (
        <OpportunityForm
          key={editingOpportunity?.id ?? 'new-opportunity'}
          opportunity={editingOpportunity}
          accounts={accounts}
          stages={stageOptions}
          live={live}
          onClose={closeOpportunityForm}
          onSave={saveOpportunity}
          onCreate={createOpportunity}
        />
      )}

      {(editingAccount || creatingAccount) && (
        <AccountForm
          key={editingAccount?.id ?? 'new-account'}
          account={editingAccount}
          opportunities={relatedAccountOpportunities}
          industryOptions={accountFieldOptions.industry}
          typeOptions={accountFieldOptions.type}
          live={live}
          onClose={closeAccountForm}
          onOpenOpportunity={setEditingOpportunity}
          onSave={saveAccount}
          onCreate={createAccount}
        />
      )}
    </div>
  );
}

function OpportunityTable({
  rows,
  accountName,
  live,
  onOpen,
}: {
  rows: Opportunity[];
  accountName: (id: string) => string;
  live: boolean;
  onOpen: (opportunity: Opportunity) => void;
}) {
  return (
    <>
      <section className="hero-row">
        <div>
          <p className="eyebrow">SALESFORCE RECORD WORKSPACE</p>
          <h1>Opportunity Register</h1>
          <p className="hero-subtitle">
            Create and update Salesforce opportunities directly from this workspace.
          </p>
        </div>
      </section>
      <section className="panel data-table-panel">
        <div className="table-toolbar">
          <div>
            <h2>Opportunities</h2>
            <span>
              {live
                ? `${rows.length} records available for update`
                : 'Live writes require Salesforce hosting'}
            </span>
          </div>
        </div>
        <div className="responsive-table">
          <div className="table-head">
            <span>Opportunity</span>
            <span>Account</span>
            <span>Stage</span>
            <span>Close date</span>
            <span>Amount</span>
          </div>
          {rows.map((opportunity) => (
            <button
              type="button"
              className="table-row"
              key={opportunity.id}
              onClick={() => onOpen(opportunity)}
            >
              <span className="table-account">
                <i>OP</i>
                <span>
                  <b>{opportunity.name}</b>
                  <small>{opportunity.nextStep || 'No next step'}</small>
                </span>
              </span>
              <span>{accountName(opportunity.accountId)}</span>
              <span>{opportunity.stageName}</span>
              <span>{opportunity.closeDate}</span>
              <strong>{money.format(opportunity.amount)}</strong>
            </button>
          ))}
          {rows.length === 0 && <div className="empty-state">No opportunities match this search.</div>}
        </div>
      </section>
    </>
  );
}

function AccountTable({
  accounts,
  opportunities,
  live,
  onOpen,
}: {
  accounts: Account[];
  opportunities: Opportunity[];
  live: boolean;
  onOpen: (account: Account) => void;
}) {
  return (
    <>
      <section className="hero-row">
        <div>
          <p className="eyebrow">SALESFORCE RECORD WORKSPACE</p>
          <h1>Account Register</h1>
          <p className="hero-subtitle">
            Create and update Salesforce accounts while reviewing their related pipeline.
          </p>
        </div>
      </section>
      <section className="panel data-table-panel">
        <div className="table-toolbar">
          <div>
            <h2>Accounts</h2>
            <span>
              {live
                ? `${accounts.length} records available for update`
                : 'Live writes require Salesforce hosting'}
            </span>
          </div>
        </div>
        <div className="responsive-table">
          <div className="table-head">
            <span>Account</span>
            <span>Industry</span>
            <span>Location</span>
            <span>Open pipeline</span>
            <span>Owner</span>
          </div>
          {accounts.map((account) => {
            const pipeline = opportunities
              .filter(
                (opportunity) =>
                  opportunity.accountId === account.id && !opportunity.isClosed,
              )
              .reduce((total, opportunity) => total + opportunity.amount, 0);
            return (
              <button
                type="button"
                className="table-row"
                key={account.id}
                onClick={() => onOpen(account)}
              >
                <span className="table-account">
                  <i>AC</i>
                  <span>
                    <b>{account.name}</b>
                    <small>{account.type || 'Account'}</small>
                  </span>
                </span>
                <span>{account.industry || '—'}</span>
                <span>
                  {[account.billingCity, account.billingState].filter(Boolean).join(', ') || '—'}
                </span>
                <strong>{money.format(pipeline)}</strong>
                <span>{account.owner.name}</span>
              </button>
            );
          })}
          {accounts.length === 0 && <div className="empty-state">No accounts match this search.</div>}
        </div>
      </section>
    </>
  );
}

function optionsWithCurrentValue(
  options: PicklistOption[],
  currentValue: string,
): PicklistOption[] {
  if (!currentValue || options.some(({ value }) => value === currentValue)) return options;
  return [{ label: `${currentValue} (current value)`, value: currentValue }, ...options];
}

function AccountForm({
  account,
  opportunities,
  industryOptions,
  typeOptions,
  live,
  onClose,
  onOpenOpportunity,
  onSave,
  onCreate,
}: {
  account: Account | null;
  opportunities: Opportunity[];
  industryOptions: PicklistOption[];
  typeOptions: PicklistOption[];
  live: boolean;
  onClose: () => void;
  onOpenOpportunity: (opportunity: Opportunity) => void;
  onSave: (account: Account, patch: AccountPatch) => Promise<void>;
  onCreate: (input: AccountInput) => Promise<void>;
}) {
  const [name, setName] = useState(account?.name ?? '');
  const [industry, setIndustry] = useState(account?.industry ?? '');
  const [type, setType] = useState(account?.type ?? '');
  const [billingCity, setBillingCity] = useState(account?.billingCity ?? '');
  const [billingState, setBillingState] = useState(account?.billingState ?? '');
  const [phone, setPhone] = useState(account?.phone ?? '');
  const [website, setWebsite] = useState(account?.website ?? '');
  const [annualRevenue, setAnnualRevenue] = useState(
    account ? String(account.annualRevenue) : '',
  );
  const [employees, setEmployees] = useState(account ? String(account.employees) : '');
  const [submitting, setSubmitting] = useState(false);
  const availableIndustryOptions = useMemo(
    () => optionsWithCurrentValue(industryOptions, industry),
    [industry, industryOptions],
  );
  const availableTypeOptions = useMemo(
    () => optionsWithCurrentValue(typeOptions, type),
    [type, typeOptions],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (account) {
        const patch: AccountPatch = {};
        const normalizedName = name.trim();
        const normalizedIndustry = industry.trim();
        const normalizedType = type.trim();
        const normalizedBillingCity = billingCity.trim();
        const normalizedBillingState = billingState.trim();
        const normalizedPhone = phone.trim();
        const normalizedWebsite = website.trim();
        const normalizedRevenue = annualRevenue === '' ? null : Number(annualRevenue);
        const normalizedEmployees = employees === '' ? null : Number(employees);

        if (name !== account.name) patch.name = normalizedName;
        if (industry !== account.industry) {
          patch.industry = normalizedIndustry || null;
        }
        if (type !== account.type) patch.type = normalizedType || null;
        if (billingCity !== account.billingCity) {
          patch.billingCity = normalizedBillingCity || null;
        }
        if (billingState !== account.billingState) {
          patch.billingState = normalizedBillingState || null;
        }
        if (phone !== account.phone) patch.phone = normalizedPhone || null;
        if (website !== account.website) patch.website = normalizedWebsite || null;
        if (normalizedRevenue !== account.annualRevenue) {
          patch.annualRevenue = normalizedRevenue;
        }
        if (normalizedEmployees !== account.employees) patch.employees = normalizedEmployees;

        await onSave(account, patch);
      } else {
        const input: AccountInput = {
          name: name.trim(),
          ...(industry.trim() ? { industry: industry.trim() } : {}),
          ...(type.trim() ? { type: type.trim() } : {}),
          ...(billingCity.trim() ? { billingCity: billingCity.trim() } : {}),
          ...(billingState.trim() ? { billingState: billingState.trim() } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          ...(website.trim() ? { website: website.trim() } : {}),
          ...(annualRevenue === '' ? {} : { annualRevenue: Number(annualRevenue) }),
          ...(employees === '' ? {} : { employees: Number(employees) }),
        };
        await onCreate(input);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-scrim">
      <form className="opportunity-modal account-modal" onSubmit={handleSubmit}>
        <header>
          <div>
            <p className="eyebrow">{account ? 'EDIT ACCOUNT' : 'NEW ACCOUNT'}</p>
            <h2>{account ? account.name : 'Create account'}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="form-grid">
          <label className="field field-wide">
            Name
            <input required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field">
            Industry
            {availableIndustryOptions.length ? (
              <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                <option value="">— None —</option>
                {availableIndustryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input value={industry} onChange={(event) => setIndustry(event.target.value)} />
            )}
          </label>
          <label className="field">
            Type
            {availableTypeOptions.length ? (
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="">— None —</option>
                {availableTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input value={type} onChange={(event) => setType(event.target.value)} />
            )}
          </label>
          <label className="field">
            Billing city
            <input value={billingCity} onChange={(event) => setBillingCity(event.target.value)} />
          </label>
          <label className="field">
            Billing state
            <input value={billingState} onChange={(event) => setBillingState(event.target.value)} />
          </label>
          <label className="field">
            Phone
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label className="field">
            Website
            <input value={website} onChange={(event) => setWebsite(event.target.value)} />
          </label>
          <label className="field">
            Annual revenue
            <input
              type="number"
              step="0.01"
              value={annualRevenue}
              onChange={(event) => setAnnualRevenue(event.target.value)}
            />
          </label>
          <label className="field">
            Employees
            <input
              type="number"
              min="0"
              step="1"
              value={employees}
              onChange={(event) => setEmployees(event.target.value)}
            />
          </label>

          {account && (
            <div className="field">
              <span>Owner</span>
              <strong className="readonly-value">{account.owner.name}</strong>
            </div>
          )}

          <div className="field field-wide related-records">
            <span>Related opportunities</span>
            {account ? (
              opportunities.length ? (
                opportunities.map((opportunity) => (
                  <button
                    type="button"
                    className="text-link"
                    key={opportunity.id}
                    onClick={() => {
                      onClose();
                      onOpenOpportunity(opportunity);
                    }}
                  >
                    {opportunity.name} · {money.format(opportunity.amount)}
                  </button>
                ))
              ) : (
                <strong className="readonly-value">None</strong>
              )
            ) : (
              <strong className="readonly-value">Available after account creation</strong>
            )}
          </div>
        </div>

        <footer>
          <span className="write-status">
            <span className="live-dot" />
            {live ? 'Salesforce permissions and validation apply' : 'Preview mode'}
          </span>
          <div>
            <button
              type="button"
              className="secondary-button"
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={!live || submitting}>
              {submitting ? 'Saving…' : account ? 'Save account' : 'Create account'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function OpportunityForm({
  opportunity,
  accounts,
  stages,
  live,
  onClose,
  onSave,
  onCreate,
}: {
  opportunity: Opportunity | null;
  accounts: Account[];
  stages: string[];
  live: boolean;
  onClose: () => void;
  onSave: (
    opportunity: Opportunity,
    values: Pick<Opportunity, 'stageName' | 'amount' | 'closeDate' | 'nextStep'>,
  ) => Promise<void>;
  onCreate: (input: OpportunityInput) => Promise<void>;
}) {
  const [name, setName] = useState(opportunity?.name ?? '');
  const [accountId, setAccountId] = useState(opportunity?.accountId ?? accounts[0]?.id ?? '');
  const [stageName, setStageName] = useState(opportunity?.stageName ?? stages[0]);
  const [amount, setAmount] = useState(opportunity?.amount ?? 0);
  const [closeDate, setCloseDate] = useState(opportunity?.closeDate ?? '');
  const [nextStep, setNextStep] = useState(opportunity?.nextStep ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (opportunity) {
        await onSave(opportunity, {
          stageName,
          amount: Number(amount),
          closeDate,
          nextStep,
        });
      } else {
        await onCreate({
          name,
          accountId,
          stageName,
          amount: Number(amount),
          probability: 0,
          closeDate,
          nextStep,
          type: '',
          leadSource: '',
          description: '',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-scrim">
      <form className="opportunity-modal" onSubmit={handleSubmit}>
        <header>
          <div>
            <p className="eyebrow">
              {opportunity ? 'EDIT OPPORTUNITY' : 'NEW OPPORTUNITY'}
            </p>
            <h2>{opportunity ? opportunity.name : 'Create opportunity'}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="form-grid">
          <label className="field field-wide">
            Name
            <input
              required
              disabled={Boolean(opportunity)}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="field">
            Account
            <select
              required
              disabled={Boolean(opportunity)}
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
            >
              {accounts.map((account) => (
                <option value={account.id} key={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Stage
            <select value={stageName} onChange={(event) => setStageName(event.target.value)}>
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Amount
            <input
              required
              type="number"
              min="0"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>
          <label className="field">
            Close date
            <input
              required
              type="date"
              value={closeDate}
              onChange={(event) => setCloseDate(event.target.value)}
            />
          </label>
          <label className="field field-wide">
            Next step
            <input value={nextStep} onChange={(event) => setNextStep(event.target.value)} />
          </label>
        </div>
        <footer>
          <span className="write-status">
            <span className="live-dot" />
            {live ? 'Salesforce permissions and validation apply' : 'Preview mode'}
          </span>
          <div>
            <button
              type="button"
              className="secondary-button"
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={!live || submitting}>
              {submitting ? 'Saving…' : opportunity ? 'Save changes' : 'Create opportunity'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
