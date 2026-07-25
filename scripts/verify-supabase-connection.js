#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const normalizedLine = line.trim();

      if (!normalizedLine || normalizedLine.startsWith('#')) {
        return values;
      }

      const separatorIndex = normalizedLine.indexOf('=');
      if (separatorIndex < 1) {
        return values;
      }

      const name = normalizedLine.slice(0, separatorIndex).trim();
      const value = normalizedLine.slice(separatorIndex + 1).trim();
      values[name] = value;
      return values;
    }, {});
}

async function main() {
  const fileEnvironment = readEnvFile(path.resolve(process.cwd(), '.env'));
  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    fileEnvironment.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    fileEnvironment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/settings`, {
    headers: {
      apikey: publishableKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Supabase connectivity check failed with status ${response.status}.`,
    );
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  console.log(`Connected to Supabase project ${projectRef}.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Connection check failed.');
  process.exit(1);
});
