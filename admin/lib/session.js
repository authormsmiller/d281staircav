/**
 * session.js
 * Git branch management for admin tool sessions.
 * Uses simple-git to manage a working branch per session.
 *
 * Workflow:
 *   1. On server start, check current branch.
 *   2. If on main/master, create a dated admin branch.
 *   3. Changes accumulate on the branch.
 *   4. On commit: stage changed files, commit with message, push.
 *   5. CF Pages detects push to main and deploys (only after merge).
 */

import simpleGit from 'simple-git';
import { REPO_ROOT } from './records.js';

const git = simpleGit(REPO_ROOT);

// ─── branch management ───────────────────────────────────────────────────────

/**
 * Get the current branch name.
 */
export async function currentBranch() {
  const summary = await git.branchLocal();
  return summary.current;
}

/**
 * Ensure we're on a working branch (not main/master).
 * If on main, creates admin/YYYY-MM-DD and checks it out.
 * Returns { branch, created }
 */
export async function ensureWorkingBranch() {
  const branch = await currentBranch();
  const isProtected = ['main', 'master'].includes(branch);

  if (!isProtected) {
    return { branch, created: false };
  }

  const datePart = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const newBranch = `admin/${datePart}`;

  // Check if the branch already exists locally
  const summary = await git.branchLocal();
  if (summary.branches[newBranch]) {
    await git.checkout(newBranch);
    return { branch: newBranch, created: false };
  }

  await git.checkoutLocalBranch(newBranch);
  return { branch: newBranch, created: true };
}

/**
 * Return uncommitted changes in the working tree (site/ only).
 * Returns array of { path, status } where status is 'M', 'A', '??' etc.
 */
export async function pendingChanges() {
  const status = await git.status();
  const relevant = [
    ...status.modified,
    ...status.not_added,
    ...status.created,
  ].filter(f => f.startsWith('site/'));

  return relevant.map(f => ({
    path: f,
    status: status.modified.includes(f) ? 'M'
          : status.created.includes(f)   ? 'A'
          : '?',
  }));
}

/**
 * Stage and commit all pending changes in site/.
 * Returns the commit hash.
 */
export async function commitChanges(message) {
  const changes = await pendingChanges();
  if (changes.length === 0) {
    throw new Error('No changes to commit.');
  }

  // Stage only site/ content (not accidental other changes)
  await git.add('site/');
  const result = await git.commit(message);
  return result.commit;
}

/**
 * Push the current branch to origin.
 * Does NOT merge to main — that's a deliberate manual step.
 */
export async function pushBranch() {
  const branch = await currentBranch();
  await git.push('origin', branch, ['--set-upstream']);
  return branch;
}

/**
 * Get a session summary: branch, pending changes, last commit.
 */
export async function sessionStatus() {
  const branch = await currentBranch();
  const changes = await pendingChanges();
  const log = await git.log({ maxCount: 1 });
  const lastCommit = log.latest
    ? { hash: log.latest.hash.slice(0, 7), message: log.latest.message, date: log.latest.date }
    : null;

  return { branch, pendingCount: changes.length, changes, lastCommit };
}
