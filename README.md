# Sales Pulse — React UI inside Salesforce

Sales Pulse is a portfolio project demonstrating a custom React experience hosted natively inside Salesforce. It uses a Salesforce **UI Bundle** and the Salesforce Data SDK rather than an external embedded app.

## Highlights

- React, TypeScript, Vite, and Salesforce UI Bundle
- Native Salesforce app: **Sales Pulse — Quiet Operator**
- Live Account and Opportunity reads through Salesforce GraphQL UI API
- Direct Opportunity create and update actions, governed by the signed-in user's Salesforce CRUD, field permissions, sharing, and validation rules
- A custom command-center visual system; no Lightning Web Components are used for the application UI

## Architecture

```text
Salesforce Custom Application
        │
        ▼
React UI Bundle (salespulse)
        │
        ▼
Salesforce Data SDK → GraphQL UI API → Account / Opportunity
```

No credentials, access tokens, or Salesforce record data are stored in this repository.

## Run locally

```bash
npm install
cd force-app/main/default/uiBundles/salespulse
npm install
npm run build
```

The local view uses preview data. Live Salesforce operations run only when the UI Bundle is hosted inside an authenticated Salesforce org.

## Deploy

```bash
cd force-app/main/default/uiBundles/salespulse
npm run build
cd ../../../..
sf project deploy start --source-dir force-app --target-org <org-alias>
```

Then open **Sales Pulse — Quiet Operator** from Salesforce App Launcher.

## Write behavior

Sales Pulse creates Opportunities and updates their stage, amount, close date, and next step. Every request is made in the active Salesforce user session; Salesforce remains the authority for permissions and validation.

## Project structure

```text
force-app/main/default/
├── applications/salespulse.app-meta.xml
└── uiBundles/salespulse/
    ├── src/main.tsx                 # React workspace
    ├── src/data/salesforceGateway.ts # Data SDK / GraphQL gateway
    └── src/styles/sales-pulse.css   # Custom visual system
```
