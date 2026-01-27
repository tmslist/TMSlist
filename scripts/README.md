# Maintenance Scripts

This directory contains utility scripts for managing clinic data, importing unstructured data, and auditing the codebase.

## Usage

Run these scripts using `tsx` or `ts-node` (e.g., `npx tsx scripts/audit_clinics.ts`).

## Scripts

### Data Import & Management
- **`import_new_clinics.ts`**: Imports new clinic data from CSV/JSON sources into the main `clinics.json` database.
- **`import_unstructured_dump.ts`**: Parses raw text dumps (chat logs, emails) to extract structured clinic information.
- **`process_submissions.ts`**: Processes user-submitted clinics from `user-submitted-clinics.json`, validates them, and merges valid entries.

### Validation & Auditing
- **`audit_clinics.ts`**: Scans the `clinics.json` file for missing fields, invalid URLs, or geocoding errors.
- **`verify_schema.ts`**: strictly validates that all clinic entries conform to the `Clinic` TypeScript interface.
- **`diagnose_tsv.ts`**: Helper to debug TSV parsing issues when importing legacy data.

### Cleanup
- **`cleanup_clinics.ts`**: Removes duplicates and normalizes data formatting (phone numbers, addresses).
- **`generate_clinics.py`**: Python script for batch generation or synthetic data creation (legacy).
