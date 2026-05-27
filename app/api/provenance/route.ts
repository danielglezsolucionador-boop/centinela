import { NextResponse } from 'next/server';
import { frontendProvenance } from '@/lib/provenance';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    app_name: frontendProvenance.appName,
    runtime_version: '2.0.0',
    repo_branch: process.env.VERCEL_GIT_COMMIT_REF || frontendProvenance.branch,
    current_commit: process.env.VERCEL_GIT_COMMIT_SHA || frontendProvenance.commit,
    build_timestamp: process.env.VERCEL_DEPLOYMENT_ID || frontendProvenance.buildTimestamp,
    deployment_target: frontendProvenance.deploymentTarget,
    phase_status: 'Phase 2 live sync provenance visible; no secrets or local paths exposed',
  });
}
