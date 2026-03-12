#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const isProductionDeploy = process.env.VERCEL_ENV === "production";

const steps = [
  {
    command: "pnpm",
    args: ["prisma:generate"],
    label: "Prisma generate",
  },
  {
    command: "node",
    args: [
      "scripts/production-readiness-check.mjs",
      ...(isProductionDeploy ? ["--strict"] : []),
    ],
    label: isProductionDeploy
      ? "Production readiness (strict)"
      : "Production readiness",
  },
  {
    command: "pnpm",
    args: ["build"],
    label: "Next build",
  },
];

for (const step of steps) {
  console.log(`[vercel-build] ${step.label}`);
  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
