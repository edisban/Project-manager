import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

export const FullPageLoader = () => (
  <Box
    role="status"
    aria-label="Loading"
    sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}
  >
    <CircularProgress size={32} />
  </Box>
);
