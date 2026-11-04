import Avatar from "@mui/material/Avatar";
import { hueFor, initials } from "@/utils/format";

interface InitialsAvatarProps {
  name: string;
  size?: number;
  square?: boolean;
}

/** Deterministically coloured avatar, readable in both light and dark mode. */
export const InitialsAvatar = ({ name, size = 36, square = false }: InitialsAvatarProps) => {
  const hue = hueFor(name);
  return (
    <Avatar
      variant={square ? "rounded" : "circular"}
      aria-hidden
      sx={(theme) => ({
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 650,
        borderRadius: square ? `${Math.round(size * 0.28)}px` : "50%",
        color: `hsl(${hue} 70% 30%)`,
        backgroundColor: `hsl(${hue} 75% 92%)`,
        ...theme.applyStyles("dark", {
          color: `hsl(${hue} 85% 82%)`,
          backgroundColor: `hsl(${hue} 45% 22%)`,
        }),
      })}
    >
      {initials(name)}
    </Avatar>
  );
};
