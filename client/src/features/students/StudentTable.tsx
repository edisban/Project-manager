import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { Student } from "@/api/types";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { ageFrom, formatDate, formatRelative } from "@/utils/format";

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  /** Pagination controls rendered below the rows. */
  footer: ReactNode;
}

const fullName = (student: Student) => `${student.firstName} ${student.lastName}`;

const StudentIdentity = ({ student }: { student: Student }) => (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
    <InitialsAvatar name={fullName(student)} size={36} />
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" fontWeight={600} noWrap>
        {fullName(student)}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap component="div">
        {student.title}
      </Typography>
    </Box>
  </Stack>
);

const StudentCode = ({ code }: { code: string }) => (
  <Box
    component="span"
    sx={(theme) => ({
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: "0.8rem",
      px: 1,
      py: 0.25,
      borderRadius: 1,
      border: `1px solid ${theme.vars.palette.divider}`,
      backgroundColor: theme.vars.palette.background.default,
    })}
  >
    {code}
  </Box>
);

const RowActions = ({
  student,
  onEdit,
  onDelete,
}: Pick<StudentTableProps, "onEdit" | "onDelete"> & { student: Student }) => (
  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
    <Tooltip title="Edit">
      <IconButton
        size="small"
        aria-label={`Edit ${fullName(student)}`}
        onClick={() => onEdit(student)}
      >
        <EditOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Delete">
      <IconButton
        size="small"
        aria-label={`Delete ${fullName(student)}`}
        onClick={() => onDelete(student)}
        sx={{ "&:hover": { color: "error.main" } }}
      >
        <DeleteOutlineRounded fontSize="small" />
      </IconButton>
    </Tooltip>
  </Stack>
);

const DateOfBirth = ({ value }: { value: string | null }) =>
  value ? (
    <>
      {formatDate(value)}
      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
        ({ageFrom(value)})
      </Typography>
    </>
  ) : (
    <Typography component="span" variant="body2" color="text.disabled">
      —
    </Typography>
  );

/** A table on larger screens, stacked cards on phones. */
export const StudentTable = ({
  students,
  loading,
  onEdit,
  onDelete,
  footer,
}: StudentTableProps) => {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const placeholderRows = Array.from({ length: 5 }, (_, index) => index);

  if (compact) {
    return (
      <Card>
        <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>
          {loading
            ? placeholderRows.map((row) => (
                <Stack key={row} direction="row" spacing={1.5} sx={{ p: 2 }} alignItems="center">
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="50%" />
                    <Skeleton width="30%" />
                  </Box>
                </Stack>
              ))
            : students.map((student) => (
                <Box
                  key={student.id}
                  sx={{ p: 2 }}
                  component="article"
                  aria-label={fullName(student)}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    justifyContent="space-between"
                  >
                    <StudentIdentity student={student} />
                    <RowActions student={student} onEdit={onEdit} onDelete={onDelete} />
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={2}
                    useFlexGap
                    sx={{ mt: 1.5, pl: 6, flexWrap: "wrap" }}
                  >
                    <StudentCode code={student.codeNumber} />
                    <Typography variant="body2" color="text.secondary">
                      <DateOfBirth value={student.dateOfBirth} />
                    </Typography>
                  </Stack>
                </Box>
              ))}
        </Stack>
        {footer}
      </Card>
    );
  }

  return (
    <Card>
      <TableContainer>
        <Table aria-label="Students">
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Date of birth</TableCell>
              <TableCell>Added</TableCell>
              <TableCell align="right">
                <Box
                  component="span"
                  sx={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    margin: "-1px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    clip: "rect(0 0 0 0)",
                  }}
                >
                  Actions
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? placeholderRows.map((row) => (
                  <TableRow key={row}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Skeleton variant="circular" width={36} height={36} />
                        <Box>
                          <Skeleton width={140} />
                          <Skeleton width={90} />
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Skeleton width={70} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={110} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={80} />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))
              : students.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <StudentIdentity student={student} />
                    </TableCell>
                    <TableCell>
                      <StudentCode code={student.codeNumber} />
                    </TableCell>
                    <TableCell>
                      <DateOfBirth value={student.dateOfBirth} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatDate(student.createdAt)}>
                        <span>{formatRelative(student.createdAt)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <RowActions student={student} onEdit={onEdit} onDelete={onDelete} />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
      {footer}
    </Card>
  );
};
