import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";
import { useEffect, useState, type CSSProperties } from "react";

const SESSION_KEY = "pm.intro-shown";
/** When the exit starts and when the overlay is removed (ms). */
const EXIT_AT = 3500;
const DONE_AT = 3900;

const popIn = keyframes`
  0% { opacity: 0; transform: scale(0.4) rotate(-8deg); }
  70% { opacity: 1; transform: scale(1.08) rotate(0deg); }
  100% { opacity: 1; transform: scale(1); }
`;

const tileIn = keyframes`
  from { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.3); }
  to { opacity: var(--o); transform: none; }
`;

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(10px); letter-spacing: 0.08em; }
  to { opacity: 1; transform: none; letter-spacing: -0.02em; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fill = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const glow = keyframes`
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.08); }
`;

const shouldPlay = () => {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    return false;
  }
};

const rememberShown = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Storage unavailable: the intro may simply play again.
  }
};

/** The four tiles of the logo mark, each flying in from its own corner. */
const TILES = [
  { x: 14, y: 16, w: 16, h: 16, o: 1, dx: "-28px", dy: "-28px", delay: 260 },
  { x: 34, y: 16, w: 16, h: 16, o: 0.6, dx: "28px", dy: "-28px", delay: 340 },
  { x: 14, y: 36, w: 16, h: 12, o: 0.6, dx: "-28px", dy: "28px", delay: 420 },
  { x: 34, y: 36, w: 16, h: 12, o: 1, dx: "28px", dy: "28px", delay: 500 },
];

/**
 * Branded intro shown once per browser session when the app starts. The app renders underneath
 * meanwhile, so the intro adds no loading time. Any click or key press skips it.
 */
export const IntroSplash = () => {
  // Decided once on mount: replaying mid-session would be annoying.
  const [playing] = useState(shouldPlay);
  const [phase, setPhase] = useState<"enter" | "exit" | "done">(playing ? "enter" : "done");

  useEffect(() => {
    if (!playing) return;
    rememberShown();
    const exitTimer = window.setTimeout(() => setPhase("exit"), EXIT_AT);
    const doneTimer = window.setTimeout(() => setPhase("done"), DONE_AT);
    const skip = () => {
      setPhase("exit");
      window.setTimeout(() => setPhase("done"), 300);
    };
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener("keydown", skip);
    };
  }, [playing]);

  if (phase === "done") return null;

  return (
    <Box
      data-testid="intro-splash"
      aria-hidden
      onClick={() => setPhase("exit")}
      onTransitionEnd={() => phase === "exit" && setPhase("done")}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        cursor: "pointer",
        background: "linear-gradient(150deg, #0f766e 0%, #115e59 40%, #0b1324 100%)",
        opacity: phase === "exit" ? 0 : 1,
        transform: phase === "exit" ? "scale(1.04)" : "none",
        transition: "opacity 380ms ease, transform 380ms ease",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(circle at center, black 10%, transparent 65%)",
          animation: `${fadeIn} 800ms ease both`,
        },
      }}
    >
      {/* Soft pulsing glow behind the mark */}
      <Box
        sx={{
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,212,191,0.35), transparent 65%)",
          animation: `${glow} 2.4s ease-in-out infinite`,
        }}
      />

      <Box sx={{ position: "relative", textAlign: "center", px: 3 }}>
        <Box
          component="svg"
          viewBox="0 0 64 64"
          sx={{
            width: 88,
            height: 88,
            display: "block",
            mx: "auto",
            overflow: "visible",
            "& .intro-bg": {
              transformBox: "fill-box",
              transformOrigin: "center",
              animation: `${popIn} 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
              filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.35))",
            },
            "& .intro-tile": {
              transformBox: "fill-box",
              transformOrigin: "center",
              animation: `${tileIn} 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
            },
          }}
        >
          <defs>
            <linearGradient id="intro-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2dd4bf" />
              <stop offset="1" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          {/* Plain SVG elements: MUI Box would turn width/height into CSS and drop the attributes. */}
          <rect className="intro-bg" width="64" height="64" rx="16" fill="url(#intro-gradient)" />
          {TILES.map((tile) => (
            <rect
              key={`${tile.x}-${tile.y}`}
              className="intro-tile"
              x={tile.x}
              y={tile.y}
              width={tile.w}
              height={tile.h}
              rx="3"
              fill="#fff"
              style={
                {
                  "--dx": tile.dx,
                  "--dy": tile.dy,
                  "--o": tile.o,
                  animationDelay: `${tile.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </Box>

        <Typography
          component="p"
          sx={{
            mt: 3,
            color: "#fff",
            fontWeight: 700,
            fontSize: { xs: "1.6rem", sm: "2rem" },
            animation: `${riseIn} 600ms 620ms cubic-bezier(0.2, 0.7, 0.2, 1) both`,
          }}
        >
          Project Manager
        </Typography>
        <Typography
          component="p"
          sx={{
            mt: 1,
            color: "rgba(255,255,255,0.75)",
            fontSize: { xs: "0.95rem", sm: "1.05rem" },
            animation: `${fadeIn} 500ms 880ms ease both`,
          }}
        >
          Every project. Every student. One place.
        </Typography>

        <Box
          sx={{
            mt: 4,
            mx: "auto",
            width: 140,
            height: 3,
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "rgba(255,255,255,0.15)",
            animation: `${fadeIn} 300ms 300ms ease both`,
          }}
        >
          <Box
            sx={{
              height: "100%",
              bgcolor: "#5eead4",
              transformOrigin: "left",
              animation: `${fill} ${EXIT_AT - 300}ms 300ms cubic-bezier(0.4, 0, 0.2, 1) both`,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
