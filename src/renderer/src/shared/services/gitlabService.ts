export interface GitlabConfig {
  url: string;
  projectId: string;
  token: string;
  host: string;
}

export const parseGitlabUrl = (url: string): GitlabConfig | null => {
  try {
    // Expected format: https://oauth2:TOKEN@host/path/to/repo.git
    // Or just https://gitlab.com/path/to/repo.git (we'll try to extract what we can)
    const regex = /https:\/\/(?:oauth2:([^@]+)@)?([^/]+)\/(.+?)(?:\.git)?$/;
    const match = url.match(regex);

    if (!match) return null;

    const token = match[1] || '';
    const host = match[2];
    const path = match[3];

    return {
      url,
      token,
      host,
      projectId: encodeURIComponent(path),
    };
  } catch (e) {
    return null;
  }
};

export const fetchGitlabData = async <T>(
  config: GitlabConfig,
  filePath: string,
): Promise<T | null> => {
  if (!config.token)
    throw new Error('Gitlab token missing. Please use Gitlab URL format with oauth2 token.');

  const apiUrl = `https://${config.host}/api/v4/projects/${config.projectId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=main`;

  const response = await fetch(apiUrl, {
    headers: {
      'PRIVATE-TOKEN': config.token,
    },
  });

  if (response.status === 404) return [] as unknown as T;
  if (!response.ok) throw new Error(`Gitlab API error: ${response.statusText}`);

  return response.json();
};

export const saveGitlabData = async <T>(
  config: GitlabConfig,
  filePath: string,
  data: T,
): Promise<void> => {
  if (!config.token) throw new Error('Gitlab token missing');

  const apiUrl = `https://${config.host}/api/v4/projects/${config.projectId}/repository/files/${encodeURIComponent(filePath)}`;

  // First, we need to check if file exists to decide between POST (create) and PUT (update)
  const checkResponse = await fetch(apiUrl + '?ref=main', {
    headers: { 'PRIVATE-TOKEN': config.token },
  });

  const method = checkResponse.ok ? 'PUT' : 'POST';
  const content = JSON.stringify(data, null, 2);

  const response = await fetch(apiUrl, {
    method,
    headers: {
      'PRIVATE-TOKEN': config.token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      branch: 'main',
      content: content,
      commit_message: `Update ${filePath} from Zentri`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gitlab Save error: ${errorData.message || response.statusText}`);
  }
};
