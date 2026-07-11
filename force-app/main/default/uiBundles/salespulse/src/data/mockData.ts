import type { Account, Contact, Opportunity, Owner } from './types';

export const owners: Owner[] = [
  { id: 'u-maya', name: 'Maya Chen', initials: 'MC', color: '#818cf8' },
  { id: 'u-priya', name: 'Priya Shah', initials: 'PS', color: '#22d3ee' },
  { id: 'u-jordan', name: 'Jordan Lee', initials: 'JL', color: '#f59e0b' },
  { id: 'u-daniel', name: 'Daniel Brooks', initials: 'DB', color: '#f472b6' },
];

const maya = owners[0];
const priya = owners[1];
const jordan = owners[2];
const daniel = owners[3];

export const mockAccounts: Account[] = [
  { id: 'a-northstar', name: 'Northstar Health', industry: 'Healthcare', type: 'Customer', billingCity: 'Austin', billingState: 'TX', phone: '(512) 555-0142', website: 'northstarhealth.example', annualRevenue: 84000000, employees: 1240, owner: maya, lastModifiedDate: '2026-07-10T14:20:00Z' },
  { id: 'a-redwood', name: 'Redwood Logistics', industry: 'Transportation', type: 'Prospect', billingCity: 'Denver', billingState: 'CO', phone: '(303) 555-0188', website: 'redwoodlogistics.example', annualRevenue: 46000000, employees: 680, owner: priya, lastModifiedDate: '2026-07-10T11:20:00Z' },
  { id: 'a-heliogrid', name: 'HelioGrid Energy', industry: 'Energy', type: 'Prospect', billingCity: 'Phoenix', billingState: 'AZ', phone: '(602) 555-0194', website: 'heliogrid.example', annualRevenue: 115000000, employees: 2080, owner: maya, lastModifiedDate: '2026-07-09T16:15:00Z' },
  { id: 'a-atlas', name: 'Atlas Robotics', industry: 'Manufacturing', type: 'Customer', billingCity: 'Boston', billingState: 'MA', phone: '(617) 555-0116', website: 'atlasrobotics.example', annualRevenue: 62000000, employees: 940, owner: jordan, lastModifiedDate: '2026-07-09T13:10:00Z' },
  { id: 'a-juniper', name: 'Juniper Foods', industry: 'Consumer Goods', type: 'Prospect', billingCity: 'Chicago', billingState: 'IL', phone: '(312) 555-0162', website: 'juniperfoods.example', annualRevenue: 37000000, employees: 510, owner: priya, lastModifiedDate: '2026-07-08T18:35:00Z' },
  { id: 'a-cascade', name: 'Cascade Financial', industry: 'Financial Services', type: 'Customer', billingCity: 'Seattle', billingState: 'WA', phone: '(206) 555-0154', website: 'cascadefinancial.example', annualRevenue: 91000000, employees: 1560, owner: daniel, lastModifiedDate: '2026-07-08T12:05:00Z' },
  { id: 'a-vertex', name: 'Vertex Systems', industry: 'Technology', type: 'Prospect', billingCity: 'San Francisco', billingState: 'CA', phone: '(415) 555-0127', website: 'vertexsystems.example', annualRevenue: 73000000, employees: 820, owner: maya, lastModifiedDate: '2026-07-07T09:45:00Z' },
];

export const mockContacts: Contact[] = [
  { id: 'c-1', accountId: 'a-northstar', firstName: 'Elena', lastName: 'Morales', title: 'VP, Operations', email: 'elena.morales@northstar.example', phone: '(512) 555-0101', owner: maya, lastModifiedDate: '2026-07-10T12:00:00Z' },
  { id: 'c-2', accountId: 'a-northstar', firstName: 'Marcus', lastName: 'Wright', title: 'Director, Analytics', email: 'marcus.wright@northstar.example', phone: '(512) 555-0102', owner: maya, lastModifiedDate: '2026-07-08T12:00:00Z' },
  { id: 'c-3', accountId: 'a-redwood', firstName: 'Tessa', lastName: 'Cole', title: 'COO', email: 'tessa.cole@redwood.example', phone: '(303) 555-0103', owner: priya, lastModifiedDate: '2026-07-09T12:00:00Z' },
  { id: 'c-4', accountId: 'a-heliogrid', firstName: 'Andre', lastName: 'Singh', title: 'VP, Transformation', email: 'andre.singh@heliogrid.example', phone: '(602) 555-0104', owner: maya, lastModifiedDate: '2026-07-09T12:00:00Z' },
  { id: 'c-5', accountId: 'a-atlas', firstName: 'Hannah', lastName: 'Park', title: 'Head of Product', email: 'hannah.park@atlas.example', phone: '(617) 555-0105', owner: jordan, lastModifiedDate: '2026-07-08T12:00:00Z' },
  { id: 'c-6', accountId: 'a-juniper', firstName: 'Liam', lastName: 'Ross', title: 'VP, Finance', email: 'liam.ross@juniper.example', phone: '(312) 555-0106', owner: priya, lastModifiedDate: '2026-07-07T12:00:00Z' },
  { id: 'c-7', accountId: 'a-cascade', firstName: 'Noor', lastName: 'Patel', title: 'Chief Data Officer', email: 'noor.patel@cascade.example', phone: '(206) 555-0107', owner: daniel, lastModifiedDate: '2026-07-06T12:00:00Z' },
];

export const mockOpportunities: Opportunity[] = [
  { id: 'o-1', accountId: 'a-northstar', name: 'Northstar Analytics Expansion', stageName: 'Negotiation/Review', amount: 420000, probability: 80, closeDate: '2026-07-24', nextStep: 'Confirm security terms', type: 'Existing Customer - Upgrade', leadSource: 'Referral', description: 'Expand analytics footprint across three regional teams.', isClosed: false, isWon: false, owner: maya, lastModifiedDate: '2026-07-10T14:20:00Z' },
  { id: 'o-2', accountId: 'a-redwood', name: 'Redwood Fleet Modernization', stageName: 'Proposal/Price Quote', amount: 285000, probability: 65, closeDate: '2026-07-18', nextStep: 'Review commercial proposal', type: 'New Customer', leadSource: 'Web', description: 'Modernize dispatch intelligence and planning.', isClosed: false, isWon: false, owner: priya, lastModifiedDate: '2026-07-10T11:20:00Z' },
  { id: 'o-3', accountId: 'a-heliogrid', name: 'HelioGrid Enterprise Rollout', stageName: 'Needs Analysis', amount: 640000, probability: 35, closeDate: '2026-08-14', nextStep: 'Map regional requirements', type: 'New Customer', leadSource: 'Partner', description: 'Enterprise rollout across renewable operations.', isClosed: false, isWon: false, owner: maya, lastModifiedDate: '2026-07-09T16:15:00Z' },
  { id: 'o-4', accountId: 'a-atlas', name: 'Atlas Vision Platform Renewal', stageName: 'Closed Won', amount: 190000, probability: 100, closeDate: '2026-07-05', nextStep: '', type: 'Existing Customer - Upgrade', leadSource: 'Existing Customer', description: 'Annual renewal with expanded production seats.', isClosed: true, isWon: true, owner: jordan, lastModifiedDate: '2026-07-09T13:10:00Z' },
  { id: 'o-5', accountId: 'a-juniper', name: 'Juniper Demand Forecasting', stageName: 'Qualification', amount: 155000, probability: 30, closeDate: '2026-07-15', nextStep: 'Schedule discovery workshop', type: 'New Customer', leadSource: 'Trade Show', description: 'Forecasting pilot for seasonal inventory.', isClosed: false, isWon: false, owner: priya, lastModifiedDate: '2026-07-08T18:35:00Z' },
  { id: 'o-6', accountId: 'a-cascade', name: 'Cascade Risk Intelligence', stageName: 'Value Proposition', amount: 360000, probability: 50, closeDate: '2026-08-02', nextStep: 'Align executive sponsor', type: 'Existing Customer - Upgrade', leadSource: 'Referral', description: 'Risk intelligence workspace for wealth teams.', isClosed: false, isWon: false, owner: daniel, lastModifiedDate: '2026-07-08T12:05:00Z' },
  { id: 'o-7', accountId: 'a-vertex', name: 'Vertex Data Foundation', stageName: 'Prospecting', amount: 210000, probability: 10, closeDate: '2026-09-12', nextStep: 'Qualify business case', type: 'New Customer', leadSource: 'Outbound', description: 'Data foundation for product telemetry.', isClosed: false, isWon: false, owner: maya, lastModifiedDate: '2026-07-07T09:45:00Z' },
  { id: 'o-8', accountId: 'a-northstar', name: 'Northstar Mobile Care', stageName: 'Qualification', amount: 120000, probability: 25, closeDate: '2026-08-28', nextStep: '', type: 'Existing Customer - Upgrade', leadSource: 'Existing Customer', description: 'Mobile workflows for care coordinators.', isClosed: false, isWon: false, owner: maya, lastModifiedDate: '2026-07-07T08:45:00Z' },
  { id: 'o-9', accountId: 'a-redwood', name: 'Redwood Service Hub', stageName: 'Closed Lost', amount: 95000, probability: 0, closeDate: '2026-06-28', nextStep: '', type: 'New Customer', leadSource: 'Web', description: 'Service hub evaluation.', isClosed: true, isWon: false, owner: priya, lastModifiedDate: '2026-06-28T17:00:00Z' },
  { id: 'o-10', accountId: 'a-heliogrid', name: 'HelioGrid Field Intelligence', stageName: 'Value Proposition', amount: 225000, probability: 50, closeDate: '2026-07-12', nextStep: 'Present ROI model', type: 'New Customer', leadSource: 'Partner', description: 'Field intelligence design engagement.', isClosed: false, isWon: false, owner: maya, lastModifiedDate: '2026-07-08T09:00:00Z' },
];
