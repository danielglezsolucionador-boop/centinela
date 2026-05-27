export const frontendProvenance = {
  appName: 'CENTINELA Frontend',
  branch: 'main',
  commit: 'ab78d7b8e638bbb721649bf95e42e412cdccfb5d',
  shortCommit: 'ab78d7b',
  buildTimestamp: '2026-05-27T06:09:24-05:00',
  deploymentTarget: 'Vercel frontend: https://centinela-alpha.vercel.app',
  phaseStatus: 'Phase 2.3 provenance visible locally; no deploy since Phase 2.1A',
};

export type RuntimeProvenance = {
  app_name?: string;
  repo_branch?: string;
  current_commit?: string;
  build_timestamp?: string;
  deployment_target?: string;
  phase_status?: string;
  runtime_version?: string;
};

export function shortCommit(value?: string) {
  return value ? value.slice(0, 7) : 'unknown';
}
