import resolveConfig from 'tailwindcss/resolveConfig';
// @ts-expect-error import tailwind
import tailwindConfig from '../tailwind.config.js';

export const { theme } = resolveConfig(tailwindConfig);
