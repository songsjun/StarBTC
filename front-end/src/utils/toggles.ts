import { FeatureType, toggles } from "../config"

export const getToggleEnabled = (key: keyof FeatureType) => toggles[key]
