import { githubService } from '../services/githubService.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { taskRepository } from '../repositories/taskRepository.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

export const getRepositoryInfo = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await projectRepository.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  if (!project.github_repo_url) {
    return successResponse(res, { connected: false, message: 'No repository linked' });
  }

  try {
    const [repo, commits, prs] = await Promise.all([
      githubService.getRepo(project.github_repo_url),
      githubService.getCommits(project.github_repo_url, 15),
      githubService.getPullRequests(project.github_repo_url, 'all', 15),
    ]);

    const tasks = await taskRepository.findByProject(projectId);
    const { explicit, suggestions } = githubService.associateWithTasks(tasks, commits, prs);

    successResponse(res, {
      connected: true,
      repo: {
        full_name: repo.full_name,
        name: repo.name,
        owner: repo.owner?.login,
        html_url: repo.html_url,
        description: repo.description,
        private: repo.private,
        default_branch: repo.default_branch,
        pushed_at: repo.pushed_at,
        open_issues_count: repo.open_issues_count,
      },
      commits: commits.slice(0, 10).map(c => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split('\n')[0].slice(0, 100),
        author: c.commit.author?.name,
        date: c.commit.author?.date,
        url: c.html_url,
      })),
      pullRequests: prs.slice(0, 10).map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        url: pr.html_url,
        user: pr.user?.login,
        created_at: pr.created_at,
        merged_at: pr.merged_at,
      })),
      taskAssociations: { explicit, suggestions },
      lastSynced: new Date().toISOString(),
    });
  } catch (err) {
    // Return disconnected state for any error — includes network timeouts, rate limits, auth failures
    const knownCodes = ['GH_AUTH', 'GH_NOT_FOUND', 'GH_RATE_LIMIT', 'GH_ERROR'];
    successResponse(res, {
      connected: false,
      url: project.github_repo_url,
      error: err.message || 'Failed to connect to GitHub',
      errorCode: knownCodes.includes(err.code) ? err.code : 'GH_ERROR',
    });
  }
});
