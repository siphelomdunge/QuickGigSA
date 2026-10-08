import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextVitals,
  {
    // React 19's new lint rule flags the app's "load data in an effect" pattern. It works fine, so
    // keep it visible as a warning and refactor to a data-fetching library later.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'supabase/functions/**'] },
];

export default config;
