import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStudent,
  deleteStudent,
  listStudents,
  updateStudent,
  type StudentListParams,
} from "@/api/endpoints";
import type { StudentInput } from "@/api/types";
import { dashboardKey, projectKeys } from "@/features/projects/queries";

const studentKeys = {
  all: ["students"] as const,
  list: (projectId: number, params: StudentListParams) => ["students", projectId, params] as const,
};

export const useStudentList = (projectId: number, params: StudentListParams) =>
  useQuery({
    queryKey: studentKeys.list(projectId, params),
    queryFn: () => listStudents(projectId, params),
    placeholderData: keepPreviousData,
    enabled: Number.isFinite(projectId),
  });

/** Student changes also change project student counts, so both caches are refreshed. */
const useInvalidateStudentsAndProjects = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: studentKeys.all }),
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKey }),
    ]);
};

export const useCreateStudent = () => {
  const invalidate = useInvalidateStudentsAndProjects();
  return useMutation({
    mutationFn: (input: StudentInput) => createStudent(input),
    onSuccess: invalidate,
  });
};

export const useUpdateStudent = () => {
  const invalidate = useInvalidateStudentsAndProjects();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: StudentInput }) => updateStudent(id, input),
    onSuccess: invalidate,
  });
};

export const useDeleteStudent = () => {
  const invalidate = useInvalidateStudentsAndProjects();
  return useMutation({
    mutationFn: (id: number) => deleteStudent(id),
    onSuccess: invalidate,
  });
};
