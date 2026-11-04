import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
  type ProjectListParams,
} from "@/api/endpoints";
import type { ProjectInput } from "@/api/types";

export const dashboardKey = ["dashboard"] as const;

export const projectKeys = {
  all: ["projects"] as const,
  list: (params: ProjectListParams) => ["projects", "list", params] as const,
  detail: (id: number) => ["projects", "detail", id] as const,
};

export const useProjectList = (params: ProjectListParams, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => listProjects(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });

export const useProject = (id: number) =>
  useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProject(id),
    enabled: Number.isFinite(id),
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => createProject(input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKey }),
      ]),
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProjectInput }) => updateProject(id, input),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKey }),
      ]);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.removeQueries({ queryKey: ["students", id] });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKey }),
      ]);
    },
  });
};
