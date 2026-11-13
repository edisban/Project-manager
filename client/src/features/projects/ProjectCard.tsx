import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import MoreHorizRounded from "@mui/icons-material/MoreHorizRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Link as RouterLink } from "react-router";
import type { Project } from "@/api/types";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { formatDate, formatRelative, pluralize } from "@/utils/format";

interface ProjectCardProps {
  project: Project;
  showOwner: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export const ProjectCard = ({ project, showOwner, onEdit, onDelete }: ProjectCardProps) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <Card
      component="article"
      aria-label={project.name}
      sx={(theme) => ({
        position: "relative",
        height: "100%",
        transition: "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
        "&:hover": {
          borderColor: theme.vars.palette.primary.main,
          boxShadow: `0 10px 30px -12px rgba(${theme.vars.palette.primary.mainChannel} / 0.35)`,
          transform: "translateY(-2px)",
        },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&:hover": { transform: "none" },
        },
      })}
    >
      <CardActionArea
        component={RouterLink}
        to={`/projects/${project.id}`}
        sx={{
          height: "100%",
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pr: 5, mb: 2 }}>
          <InitialsAvatar name={project.name} size={44} square />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h2" noWrap title={project.name}>
              {project.name}
            </Typography>
            <Tooltip title={formatDate(project.createdAt)} placement="bottom-start">
              <Typography variant="caption" color="text.secondary">
                Created {formatRelative(project.createdAt)}
              </Typography>
            </Tooltip>
          </Box>
        </Stack>

        <Typography
          variant="body2"
          color={project.description ? "text.secondary" : "text.disabled"}
          sx={{
            flexGrow: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.86em",
            fontStyle: project.description ? "normal" : "italic",
          }}
        >
          {project.description || "No description"}
        </Typography>

        <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2.5, flexWrap: "wrap" }}>
          <Chip
            size="small"
            icon={<GroupsRounded />}
            label={pluralize(project.studentCount, "student")}
            color={project.studentCount > 0 ? "primary" : "default"}
            variant={project.studentCount > 0 ? "filled" : "outlined"}
            sx={(theme) =>
              project.studentCount > 0
                ? {
                    color: "primary.main",
                    backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.1)`,
                    "& .MuiChip-icon": { color: "inherit" },
                  }
                : {}
            }
          />
          {showOwner && (
            <Chip
              size="small"
              variant="outlined"
              icon={<PersonOutlineRounded />}
              label={project.ownerUsername}
            />
          )}
        </Stack>
      </CardActionArea>

      <IconButton
        aria-label={`Actions for ${project.name}`}
        size="small"
        onClick={(event) => setMenuAnchor(event.currentTarget)}
        sx={{ position: "absolute", top: 14, right: 12, color: "text.secondary" }}
      >
        <MoreHorizRounded />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onEdit(project);
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          Edit details
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDelete(project);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteOutlineRounded fontSize="small" />
          </ListItemIcon>
          Delete project
        </MenuItem>
      </Menu>
    </Card>
  );
};

export const ProjectCardSkeleton = () => (
  <Card sx={{ p: 2.5, height: "100%" }} aria-hidden>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 3 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="60%" height={24} />
        <Skeleton width="35%" height={16} />
      </Box>
    </Stack>
    <Skeleton width="95%" />
    <Skeleton width="70%" />
    <Skeleton variant="rounded" width={96} height={24} sx={{ mt: 2.5, borderRadius: 4 }} />
  </Card>
);
