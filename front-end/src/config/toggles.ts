const env = process.env.REACT_APP_ENV as keyof typeof togglesMapping;

export type FeatureType = {
  EXPIRATION_EXTERNAL: boolean;
  COMPLETED_TIME: boolean;
};

const togglesMapping: Record<string, FeatureType> = {
  development: { EXPIRATION_EXTERNAL: true, COMPLETED_TIME: false },
  staging: { EXPIRATION_EXTERNAL: true, COMPLETED_TIME: false },
  production: { EXPIRATION_EXTERNAL: false, COMPLETED_TIME: false },
};

export const toggles = togglesMapping[env];
