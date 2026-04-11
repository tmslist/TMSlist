// Re-export everything from the centralized dataHelpers
// This file previously imported clinics.json directly.
// Now it delegates to dataHelpers.ts which queries the database.

export {
    STATE_NAMES,
    getStateSlug,
    getStateCodeFromSlug,
    getAllClinics,
    getClinicsByState,
    getClinicBySlug,
    getClinicsByMachine,
    getClinicPhoto,
} from './dataHelpers';
