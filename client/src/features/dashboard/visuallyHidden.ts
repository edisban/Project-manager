/** Hides content visually while keeping it available to screen readers. */
export const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  clip: "rect(0 0 0 0)",
  border: 0,
} as const;
