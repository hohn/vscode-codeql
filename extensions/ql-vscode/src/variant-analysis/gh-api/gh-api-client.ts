import { getGitHubInstanceUrl } from "../../config";
import type { VariantAnalysisSubmission } from "../shared/variant-analysis";
import type {
  VariantAnalysis,
  VariantAnalysisRepoTask,
  VariantAnalysisSubmissionRequest,
} from "./variant-analysis";
import type { Repository } from "./repository";
import { extLogger } from "../../common/logging/vscode";

function getOctokitBaseUrl(): string {
  let apiUrl = getGitHubInstanceUrl().toString();
  if (apiUrl.endsWith("/")) {
    apiUrl = apiUrl.slice(0, -1);
  }
  if (apiUrl.startsWith("https://")) {
    apiUrl = apiUrl.replace("https://", "http://");
  }
  return apiUrl;
}

export async function submitVariantAnalysis(
  submissionDetails: VariantAnalysisSubmission,
): Promise<VariantAnalysis> {
  try {
    console.log("Getting base URL...");
    const baseUrl = getOctokitBaseUrl();
    void extLogger.log(`Base URL: ${baseUrl}`);

    const { actionRepoRef, language, pack, databases, controllerRepoId } =
      submissionDetails;

    const data: VariantAnalysisSubmissionRequest = {
      action_repo_ref: actionRepoRef,
      language,
      query_pack: pack,
      repositories: databases.repositories,
      repository_lists: databases.repositoryLists,
      repository_owners: databases.repositoryOwners,
    };

    void extLogger.log(
      `Sending fetch request with data: ${JSON.stringify(data)}`,
    );

    void extLogger.log(
      `Fetch request URL: ${baseUrl}/repositories/${controllerRepoId}/code-scanning/codeql/variant-analyses`,
    );

    const response = await fetch(
      `${baseUrl}/repositories/${controllerRepoId}/code-scanning/codeql/variant-analyses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    void extLogger.log(`Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(
        `Error submitting variant analysis: ${response.statusText}`,
      );
    }

    const responseData = await response.json();
    void extLogger.log(`Response data: ${responseData}`);

    return responseData;
  } catch (error) {
    void extLogger.log(`Error: ${error}`);
    throw error;
  }
}
export async function getVariantAnalysis(
  controllerRepoId: number,
  variantAnalysisId: number,
): Promise<VariantAnalysis> {
  const baseUrl = getOctokitBaseUrl();

  const response = await fetch(
    `${baseUrl}/repositories/${controllerRepoId}/code-scanning/codeql/variant-analyses/${variantAnalysisId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Error getting variant analysis: ${response.statusText}`);
  }

  return response.json();
}

export async function getVariantAnalysisRepo(
  controllerRepoId: number,
  variantAnalysisId: number,
  repoId: number,
): Promise<VariantAnalysisRepoTask> {
  const baseUrl = getOctokitBaseUrl();

  const response = await fetch(
    `${baseUrl}/repositories/${controllerRepoId}/code-scanning/codeql/variant-analyses/${variantAnalysisId}/repositories/${repoId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Error getting variant analysis repo: ${response.statusText}`,
    );
  }

  return response.json();
}

export async function getRepositoryFromNwo(
  owner: string,
  repo: string,
): Promise<Repository> {
  const baseUrl = getOctokitBaseUrl();

  const response = await fetch(`${baseUrl}/repos/${owner}/${repo}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error getting repository: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Creates a gist with the given description and files.
 * Returns the URL of the created gist.
 */
export async function createGist(
  description: string,
  files: { [key: string]: { content: string } },
): Promise<string | undefined> {
  const baseUrl = getOctokitBaseUrl();

  const response = await fetch(`${baseUrl}/gists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description,
      files,
      public: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Error creating gist: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.html_url;
}
