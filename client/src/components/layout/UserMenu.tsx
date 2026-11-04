import ExploreOutlined from "@mui/icons-material/ExploreOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import PersonRemoveOutlined from "@mui/icons-material/PersonRemoveOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { useToast } from "@/components/feedback/toast-context";
import { DeleteAccountDialog } from "@/features/account/DeleteAccountDialog";
import { useTour } from "@/features/tour/tour-context";

export const UserMenu = () => {
  const { user, isAdmin, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const tour = useTour();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setAnchor(null);
    await signOut();
    toast.show("You've been signed out");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <Tooltip title="Account">
        <ButtonBase
          data-tour="account"
          onClick={(event) => setAnchor(event.currentTarget)}
          aria-label={`Account menu for ${user.username}`}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          sx={{ borderRadius: "50%", ml: 0.5 }}
        >
          <InitialsAvatar name={user.username} size={34} />
        </ButtonBase>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 240 } } }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Signed in as
          </Typography>
          <Typography fontWeight={600} noWrap>
            {user.username}
          </Typography>
          <Chip
            size="small"
            label={isAdmin ? "Administrator" : "Member"}
            color={isAdmin ? "secondary" : "default"}
            variant={isAdmin ? "filled" : "outlined"}
            sx={{ mt: 1 }}
          />
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            navigate("/dashboard");
            tour.start();
          }}
        >
          <ListItemIcon>
            <ExploreOutlined fontSize="small" />
          </ListItemIcon>
          Take the tour
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutRounded fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
        <Tooltip
          title={isAdmin ? "The administrator account can't be deleted" : ""}
          placement="left"
        >
          <span>
            <MenuItem
              disabled={isAdmin}
              onClick={() => {
                setAnchor(null);
                setDeleteOpen(true);
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <PersonRemoveOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete account</ListItemText>
            </MenuItem>
          </span>
        </Tooltip>
      </Menu>
      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </>
  );
};
