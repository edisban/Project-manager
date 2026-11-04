import CloseRounded from "@mui/icons-material/CloseRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface SearchFieldProps {
  /** Committed value (e.g. from the URL). */
  value: string;
  /** Called with the debounced value while typing. */
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}

export const SearchField = ({ value, onChange, placeholder, label }: SearchFieldProps) => {
  const [text, setText] = useState(value);
  const [committed, setCommitted] = useState(value);
  // Follow external changes (e.g. "Clear search" elsewhere on the page).
  if (value !== committed) {
    setCommitted(value);
    if (value !== text.trim()) setText(value);
  }
  const debounced = useDebouncedValue(text, 300);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (debounced.trim() !== value.trim()) onChangeRef.current(debounced.trim());
    // Only react to typing, not to the committed value changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <TextField
      value={text}
      onChange={(event) => setText(event.target.value)}
      placeholder={placeholder}
      size="small"
      fullWidth
      slotProps={{
        htmlInput: { "aria-label": label, type: "search" },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: text ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => {
                  setText("");
                  onChangeRef.current("");
                }}
                edge="end"
              >
                <CloseRounded fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
      sx={{ maxWidth: { sm: 360 } }}
    />
  );
};
