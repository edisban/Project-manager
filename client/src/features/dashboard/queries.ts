import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/api/endpoints";
import { dashboardKey } from "@/features/projects/queries";

export const useDashboard = () => useQuery({ queryKey: dashboardKey, queryFn: getDashboard });
