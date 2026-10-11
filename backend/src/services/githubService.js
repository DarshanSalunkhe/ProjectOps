/**
 * GitHub Service - fetches repository data for linked projects.
 * Credentials are kept server-side (GITHUB_TOKEN env var).
 * Task association uses explicit IDs first, then fuzzy title matching (reviewable only).
 */

const GH_API = 'https://api.github.com';

function headers() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function parseOwnerRepo(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== 'github.com') return null;
    const parts = u.pathname.replace(/^\//, '').replace(/\.git$/, '').split('/');
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

async function ghFetch(path) {
  const url = `${GH_API}${path}`;
  const resp = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(8000) });

  if (resp.status === 401 || resp.status === 403) {
    const err = new Error('GitHub authorization failed - check GITHUB_TOKEN');
    err.code = 'GH_AUTH';
    err.status = resp.status;
    throw err;
  }
  if (resp.status === 404) {
    const err = new Error('Repository not found or not accessible');
    err.code = 'GH_NOT_FOUND';
    err.status = 404;
    throw err;
  }
  if (resp.status === 429) {
    const reset = resp.headers.get('x-ratelimit-reset');
    const err = new Error(`GitHub rate limit exceeded${reset ? `, resets at ${new Date(reset * 1000).toISOString()}` : ''}`);
    err.code = 'GH_RATE_LIMIT';
    err.status = 429;
    throw err;
  }
  if (!resp.ok) {
    const err = new Error(`GitHub API error: ${resp.status}`);
    err.code = 'GH_ERROR';
    err.status = resp.status;
    throw err;
  }

  return resp.json();
}

export const githubService = {
  async getPullRequest(fullName, number) {
    return ghFetch(`/repos/${fullName}/pulls/${number}`);
  },
  async getPullRequestFiles(fullName, number) {
    return ghFetch(`/repos/${fullName}/pulls/${number}/files?per_page=50`);
  },
  async getChecks(fullName, sha) {
    const [runs, statuses] = await Promise.all([
      ghFetch(`/repos/${fullName}/commits/${sha}/check-runs?per_page=100`),
      ghFetch(`/repos/${fullName}/commits/${sha}/status?per_page=100`),
    ]);
    // Fail closed when pagination prevents a complete view of required evidence.
    if (runs.total_count > 100 || statuses.total_count > 100) throw new Error('Too many checks to verify safely');
    return { runs: runs.check_runs || [], statuses: statuses.statuses || [] };
  },
  /** Return null if URL is not parseable, otherwise { owner, repo } */
  parseUrl(url) { return parseOwnerRepo(url); },

  /** Fetch repository metadata */
  async getRepo(repoUrl) {
    const parsed = parseOwnerRepo(repoUrl);
    if (!parsed) throw new Error('Invalid GitHub repository URL');
    return ghFetch(`/repos/${parsed.owner}/${parsed.repo}`);
  },

  /** Fetch up to 20 recent commits on the default branch */
  async getCommits(repoUrl, perPage = 20) {
    const parsed = parseOwnerRepo(repoUrl);
    if (!parsed) throw new Error('Invalid GitHub repository URL');
    return ghFetch(`/repos/${parsed.owner}/${parsed.repo}/commits?per_page=${perPage}`);
  },

  /** Fetch up to 20 recent PRs */
  async getPullRequests(repoUrl, state = 'all', perPage = 20) {
    const parsed = parseOwnerRepo(repoUrl);
    if (!parsed) throw new Error('Invalid GitHub repository URL');
    return ghFetch(`/repos/${parsed.owner}/${parsed.repo}/pulls?state=${state}&per_page=${perPage}&sort=updated`);
  },

  /**
   * Match commits/PRs to project tasks.
   * - Explicit match: message contains #<taskId> or TASK-<taskId>
   * - Fuzzy: title similarity > 0.5 → returned as 'suggestion' (not auto-applied)
   *
   * @returns { explicit: [{taskId, commit/pr, type}], suggestions: [{taskId, item, score, type}] }
   */
  associateWithTasks(tasks, commits, pullRequests) {
    const explicit = [];
    const suggestions = [];

    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const matchExplicit = (text) => {
      const matches = [];
      for (const [id] of taskMap) {
        if (new RegExp(`#${id}\\b|TASK-${id}\\b`, 'i').test(text)) {
          matches.push(id);
        }
      }
      return matches;
    };

    const similarityScore = (a, b) => {
      if (!a || !b) return 0;
      a = a.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      b = b.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 3));
      const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 3));
      if (!wordsA.size || !wordsB.size) return 0;
      let overlap = 0;
      for (const w of wordsA) if (wordsB.has(w)) overlap++;
      return overlap / Math.max(wordsA.size, wordsB.size);
    };

    for (const commit of (commits || [])) {
      const msg = commit.commit?.message || '';
      const ids = matchExplicit(msg);
      if (ids.length) {
        ids.forEach(id => explicit.push({ taskId: id, type: 'commit', item: commit }));
        continue;
      }
      for (const [id, task] of taskMap) {
        const score = similarityScore(task.title, msg);
        if (score >= 0.5) {
          suggestions.push({ taskId: id, type: 'commit', item: commit, score: Math.round(score * 100) });
          break; // one suggestion per commit
        }
      }
    }

    for (const pr of (pullRequests || [])) {
      const text = `${pr.title || ''} ${pr.body || ''}`;
      const ids = matchExplicit(text);
      if (ids.length) {
        ids.forEach(id => explicit.push({ taskId: id, type: 'pull_request', item: pr }));
        continue;
      }
      for (const [id, task] of taskMap) {
        const score = similarityScore(task.title, pr.title);
        if (score >= 0.5) {
          suggestions.push({ taskId: id, type: 'pull_request', item: pr, score: Math.round(score * 100) });
          break;
        }
      }
    }

    return { explicit, suggestions };
  },
};
