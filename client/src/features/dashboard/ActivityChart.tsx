import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { DailyCount } from "@/api/types";
import { pluralize } from "@/utils/format";
import { visuallyHidden } from "./visuallyHidden";

/** Teal-600: validated for lightness, chroma and contrast on both the light and dark surfaces. */
export const CHART_FILL = "#0d9488";
const PLOT_HEIGHT = 160;

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const longFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
const asUtcDate = (day: string) => new Date(`${day}T00:00:00Z`);

/** A "nice" axis maximum (1, 2, 5 × 10ⁿ) so gridlines land on round numbers. */
const niceMax = (value: number) => {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * magnitude >= value / 2)! * magnitude;
  return Math.ceil(value / step) * step;
};

interface ActivityChartProps {
  data: DailyCount[];
}

/**
 * Single-series bar chart of students added per day. The card title names the series, so there is
 * no legend; every bar has a hover/focus tooltip and the data is also available as a table.
 */
export const ActivityChart = ({ data }: ActivityChartProps) => {
  const max = niceMax(Math.max(0, ...data.map((d) => d.count)));
  const ticks = [max, max / 2, 0];
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const lastIndex = data.length - 1;

  return (
    <Box>
      <Box
        role="img"
        aria-label={`Bar chart: ${pluralize(total, "student")} added over the last ${data.length} days.`}
        sx={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr)", columnGap: 1 }}
      >
        {/* Y axis labels */}
        <Box sx={{ position: "relative", height: PLOT_HEIGHT }} aria-hidden>
          {ticks.map((tick) => (
            <Typography
              key={tick}
              variant="caption"
              color="text.secondary"
              sx={{
                position: "absolute",
                right: 0,
                top: `${(1 - tick / max) * 100}%`,
                transform: "translateY(-50%)",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {tick}
            </Typography>
          ))}
        </Box>

        {/* Plot: recessive gridlines + bars anchored to the baseline */}
        <Box sx={{ position: "relative", height: PLOT_HEIGHT }}>
          {ticks.map((tick) => (
            <Box
              key={tick}
              aria-hidden
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${(1 - tick / max) * 100}%`,
                borderTop: 1,
                borderColor: "divider",
                borderTopStyle: tick === 0 ? "solid" : "dashed",
              }}
            />
          ))}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "stretch",
              gap: "2px",
            }}
          >
            {data.map((point, index) => (
              <Tooltip
                key={point.day}
                placement="top"
                title={
                  <>
                    <Box component="span" sx={{ display: "block", fontWeight: 600 }}>
                      {pluralize(point.count, "student")} added
                    </Box>
                    {index === lastIndex ? "Today" : longFormatter.format(asUtcDate(point.day))}
                  </>
                }
              >
                {/* The hit target is the whole column, larger than the bar itself. */}
                <Box
                  tabIndex={0}
                  aria-label={`${longFormatter.format(asUtcDate(point.day))}: ${pluralize(point.count, "student")}`}
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    borderRadius: 1,
                    cursor: "default",
                    outline: "none",
                    "&:hover, &:focus-visible": { backgroundColor: "action.hover" },
                    "&:focus-visible": {
                      boxShadow: (theme) => `0 0 0 2px ${theme.vars.palette.primary.main}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: "min(70%, 28px)",
                      height: point.count > 0 ? `${(point.count / max) * 100}%` : 0,
                      minHeight: point.count > 0 ? 3 : 0,
                      backgroundColor: CHART_FILL,
                      borderRadius: "4px 4px 0 0",
                      transition: "height 300ms ease",
                      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                    }}
                  />
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>

        {/* X axis: every other day, plus "Today" */}
        <Box />
        <Box sx={{ display: "flex", gap: "2px", mt: 1 }} aria-hidden>
          {data.map((point, index) => (
            <Typography
              key={point.day}
              variant="caption"
              color="text.secondary"
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: "0.68rem",
                whiteSpace: "nowrap",
                // Labels may be wider than their column; neighbours are blank, so let them overflow centred.
                display: "flex",
                justifyContent: "center",
                overflow: "visible",
                // Every 2nd day on wider screens, every 4th on phones.
                visibility: {
                  xs: (lastIndex - index) % 4 === 0 ? "visible" : "hidden",
                  sm: (lastIndex - index) % 2 === 0 ? "visible" : "hidden",
                },
              }}
            >
              {index === lastIndex ? "Today" : dayFormatter.format(asUtcDate(point.day))}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box component="table" sx={visuallyHidden}>
        <caption>Students added per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Students added</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.day}>
              <td>{longFormatter.format(asUtcDate(point.day))}</td>
              <td>{point.count}</td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
};
