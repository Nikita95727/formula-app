# Formula Autocomplete App

A React + TypeScript app for building formulas with operands, operators, and autocomplete suggestions.  
Features include:
- Autocomplete for operands (fetched from API)
- Formula editing with operators and natural numbers
- Insert/edit anywhere in the formula (caret support)
- Dropdown for each operand tag (category selection)
- Validation for formula structure
- Result calculation


## DEMO deployed on Vercel
[https://formula-app-iota.vercel.app/](https://formula-app-iota.vercel.app/)

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm

### Installation

```sh
npm install --legacy-peer-deps
```

### Running the App

```sh
npm run start
```

Open [http://localhost:3000](http://localhost:3000) (or your Vite port) in your browser.

## Project Structure

- `src/component/Formula.tsx` – Main formula editor component
- `src/component/Dropdown.tsx` – Dropdown for operand tags
- `src/hooks/useAutocomplete.ts` – React Query autocomplete hook
- `src/hooks/useFormulaStore.ts` – Zustand store for formula state
- `src/utils/types.ts` – TypeScript types

## API

Autocomplete suggestions are fetched from:  
`https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete`

## Features

- Type operands and operators to build formulas
- Use arrow keys to move caret and insert between tags
- Select operand categories from dropdowns
- Formula validation (no consecutive operands/operators, bracket checks)
- Press Enter to calculate the formula

## License

MIT