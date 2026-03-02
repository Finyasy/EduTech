#!/usr/bin/env node

const strict = process.argv.includes("--strict");

const errors = [];
const warnings = [];

function getEnv(name) {
  return (process.env[name] ?? "").trim();
}

function addIssue(target, message) {
  target.push(message);
}

function containsPlaceholder(value) {
  return /USER:PASSWORD|POOLER_HOST|DIRECT_HOST|YOUR-(DIRECT-)?HOST|<[^>]+>|x{3,}/i.test(
    value,
  );
}

function validatePostgresUrl(name, value, required) {
  if (!value) {
    if (required) {
      addIssue(errors, `${name} is missing.`);
    } else {
      addIssue(warnings, `${name} is not set.`);
    }
    return;
  }

  if (!/^postgres(ql)?:\/\//i.test(value)) {
    addIssue(errors, `${name} must start with postgresql:// or postgres://.`);
    return;
  }

  if (containsPlaceholder(value)) {
    addIssue(errors, `${name} still contains placeholder values.`);
  }
}

function validateAppUrl(value) {
  if (!value) {
    addIssue(errors, "NEXT_PUBLIC_APP_URL is missing.");
    return;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") {
      addIssue(errors, "NEXT_PUBLIC_APP_URL must use https:// in production.");
    }
  } catch {
    addIssue(errors, "NEXT_PUBLIC_APP_URL is not a valid URL.");
  }
}

function validateClerkKeys(pk, sk) {
  if (!pk) addIssue(errors, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing.");
  if (!sk) addIssue(errors, "CLERK_SECRET_KEY is missing.");
  if (!pk || !sk) return;

  if (containsPlaceholder(pk) || containsPlaceholder(sk)) {
    addIssue(errors, "Clerk keys still contain placeholder values.");
  }

  if (!pk.startsWith("pk_live_")) {
    addIssue(errors, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be a production key (pk_live_...).");
  }

  if (!sk.startsWith("sk_live_")) {
    addIssue(errors, "CLERK_SECRET_KEY must be a production key (sk_live_...).");
  }
}

function validateRoleEmails(name, value) {
  if (!value) {
    addIssue(warnings, `${name} is empty. Role-based routing may not work as expected.`);
    return;
  }

  const emails = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (emails.length === 0) {
    addIssue(warnings, `${name} has no valid email entries.`);
    return;
  }

  const invalid = emails.filter((email) => !email.includes("@"));
  if (invalid.length > 0) {
    addIssue(errors, `${name} contains invalid email(s): ${invalid.join(", ")}`);
  }
}

const appUrl = getEnv("NEXT_PUBLIC_APP_URL");
const dbUrl = getEnv("DATABASE_URL");
const directUrl = getEnv("DIRECT_URL");
const migrateDbUrl = getEnv("MIGRATE_DATABASE_URL");
const clerkPk = getEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
const clerkSk = getEnv("CLERK_SECRET_KEY");

validateAppUrl(appUrl);
validateClerkKeys(clerkPk, clerkSk);
validatePostgresUrl("DATABASE_URL", dbUrl, true);

if (!directUrl && !migrateDbUrl) {
  addIssue(
    warnings,
    "Neither DIRECT_URL nor MIGRATE_DATABASE_URL is set. Prisma migrate deploy may fail on pooled-only URLs.",
  );
}

if (directUrl) validatePostgresUrl("DIRECT_URL", directUrl, false);
if (migrateDbUrl) validatePostgresUrl("MIGRATE_DATABASE_URL", migrateDbUrl, false);

validateRoleEmails("ADMIN_EMAILS", getEnv("ADMIN_EMAILS"));
validateRoleEmails("TEACHER_EMAILS", getEnv("TEACHER_EMAILS"));

if (errors.length === 0 && warnings.length === 0) {
  console.log("Production readiness check passed.");
  process.exit(0);
}

if (warnings.length > 0) {
  console.warn("Production readiness warnings:");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error("Production readiness errors:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
}

if (errors.length > 0 || (strict && warnings.length > 0)) {
  process.exit(1);
}

console.log("Production readiness check finished with warnings.");
