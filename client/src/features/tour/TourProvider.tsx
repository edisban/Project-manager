import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popper, { type PopperProps } from "@mui/material/Popper";
import Portal from "@mui/material/Portal";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { useAuth } from "@/auth/useAuth";
import { TOUR_STEPS, TourContext, markTourCompleted, type TourApi } from "./tour-context";

type PopperInstance = NonNullable<PopperProps["popperRef"]> extends Ref<infer T> ? T : never;

const SPOTLIGHT_PADDING = 6;
const FIND_ATTEMPTS = 20;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const findTarget = (target: string): HTMLElement | null => {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? element : null;
};

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Guided tour: dims the page, spotlights one element at a time and explains it.
 * Keyboard: ← / → to move, Esc to close. Completion is remembered per user in this browser.
 */
export const TourProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [rect, setRect] = useState<Rect | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const popperRef = useRef<PopperInstance | null>(null);

  const finish = useCallback(() => {
    if (user) markTourCompleted(user.username);
    setStepIndex(null);
    setTarget(null);
    setRect(null);
  }, [user]);

  const start = useCallback(() => {
    setDirection(1);
    setStepIndex(0);
  }, []);
  const api = useMemo<TourApi>(() => ({ start }), [start]);

  // Locate the current step's element (it may still be rendering), skipping steps that aren't visible.
  useEffect(() => {
    if (stepIndex === null) return;
    let attempts = 0;
    let timer: number | undefined;
    const locate = () => {
      const element = findTarget(TOUR_STEPS[stepIndex].target);
      if (element) {
        element.scrollIntoView({
          block: "center",
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
        setTarget(element);
        return;
      }
      attempts += 1;
      if (attempts < FIND_ATTEMPTS) {
        timer = window.setTimeout(locate, 100);
        return;
      }
      const next = stepIndex + direction;
      if (next < 0 || next >= TOUR_STEPS.length) finish();
      else setStepIndex(next);
    };
    locate();
    return () => window.clearTimeout(timer);
  }, [stepIndex, direction, finish]);

  // Keep the spotlight on the target while scrolling/resizing.
  useLayoutEffect(() => {
    if (!target) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = target.getBoundingClientRect();
        setRect({
          top: r.top - SPOTLIGHT_PADDING,
          left: r.left - SPOTLIGHT_PADDING,
          width: r.width + SPOTLIGHT_PADDING * 2,
          height: r.height + SPOTLIGHT_PADDING * 2,
        });
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [target]);

  useEffect(() => {
    popperRef.current?.update();
  }, [rect]);

  useEffect(() => {
    if (rect) cardRef.current?.focus();
  }, [stepIndex, rect]);

  const go = useCallback(
    (delta: 1 | -1) => {
      if (stepIndex === null) return;
      const next = stepIndex + delta;
      if (next >= TOUR_STEPS.length) {
        finish();
        return;
      }
      if (next < 0) return;
      setDirection(delta);
      setTarget(null);
      setStepIndex(next);
    },
    [stepIndex, finish],
  );

  useEffect(() => {
    if (stepIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepIndex, go, finish]);

  // Anchor the card to the measured target, not the spotlight element (which animates into place).
  const anchor = useMemo(
    () =>
      rect && {
        getBoundingClientRect: () => new DOMRect(rect.left, rect.top, rect.width, rect.height),
      },
    [rect],
  );

  const step = stepIndex !== null ? TOUR_STEPS[stepIndex] : null;
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  return (
    <TourContext.Provider value={api}>
      {children}
      {step && (
        <Portal>
          {/* Blocks interaction with the page while the tour is open. */}
          <Box sx={{ position: "fixed", inset: 0, zIndex: (theme) => theme.zIndex.modal + 1 }}>
            <Box
              aria-hidden
              sx={{
                position: "fixed",
                borderRadius: 2.5,
                pointerEvents: "none",
                boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.62)",
                outline: "2px solid rgba(45, 212, 191, 0.9)",
                transition: "all 250ms ease",
                "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                ...(rect
                  ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
                  : { top: "50%", left: "50%", width: 0, height: 0 }),
              }}
            />
            {rect && (
              <Popper
                open
                anchorEl={anchor}
                placement="bottom"
                popperRef={popperRef}
                disablePortal
                modifiers={[
                  { name: "offset", options: { offset: [0, 14] } },
                  { name: "preventOverflow", options: { padding: 12 } },
                  { name: "flip", options: { fallbackPlacements: ["top", "right", "left"] } },
                ]}
                sx={{ zIndex: 1, maxWidth: "calc(100vw - 24px)" }}
              >
                <Paper
                  ref={cardRef}
                  tabIndex={-1}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="tour-title"
                  aria-describedby="tour-body"
                  sx={(theme) => ({
                    width: 340,
                    maxWidth: "100%",
                    p: 2.5,
                    borderRadius: 3,
                    outline: "none",
                    border: `1px solid ${theme.vars.palette.divider}`,
                    boxShadow: "0 20px 50px -12px rgba(2, 6, 23, 0.5)",
                  })}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="overline" color="primary" sx={{ lineHeight: 1.5 }}>
                      Step {stepIndex! + 1} of {TOUR_STEPS.length}
                    </Typography>
                    <IconButton size="small" aria-label="Close tour" onClick={finish} edge="end">
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography id="tour-title" variant="h6" component="h2" gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography id="tour-body" variant="body2" color="text.secondary">
                    {step.body}
                  </Typography>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mt: 2.5 }}
                  >
                    <Stack direction="row" spacing={0.75} aria-hidden>
                      {TOUR_STEPS.map((s, index) => (
                        <Box
                          key={s.target}
                          sx={{
                            width: index === stepIndex ? 18 : 6,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: index === stepIndex ? "primary.main" : "divider",
                            transition: "width 200ms ease",
                          }}
                        />
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      {stepIndex! > 0 ? (
                        <Button
                          size="small"
                          color="inherit"
                          startIcon={<ArrowBackRounded />}
                          onClick={() => go(-1)}
                        >
                          Back
                        </Button>
                      ) : (
                        <Button size="small" color="inherit" onClick={finish}>
                          Skip
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        endIcon={isLast ? undefined : <ArrowForwardRounded />}
                        onClick={() => go(1)}
                      >
                        {isLast ? "Finish" : "Next"}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Popper>
            )}
          </Box>
        </Portal>
      )}
    </TourContext.Provider>
  );
};
