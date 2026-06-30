import { Box } from "@mui/material";
import type { ContractStatus } from "@tractus/types";
import { getStatusColor } from "@tractus/utils";

interface StatusChipProps {
  status: ContractStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const color = getStatusColor(status);

  return (
    <Box
      component="span"
      sx={(theme) => {
        const palette = {
          default: {
            bgcolor: theme.palette.grey[300],
            color: theme.palette.text.primary,
          },
          primary: {
            bgcolor: theme.palette.primary.light,
            color: theme.palette.primary.dark,
          },
          success: {
            bgcolor: theme.palette.success.light,
            color: theme.palette.success.dark,
          },
          error: {
            bgcolor: theme.palette.error.light,
            color: theme.palette.error.dark,
          },
          warning: {
            bgcolor: theme.palette.warning.light,
            color: theme.palette.warning.dark,
          },
          info: {
            bgcolor: theme.palette.info.light,
            color: theme.palette.info.dark,
          },
        }[color];

        return {
          display: "inline-flex",
          alignItems: "center",
          height: 24,
          px: 1,
          borderRadius: "16px",
          fontSize: "0.8125rem",
          fontWeight: 500,
          lineHeight: 1.5,
          verticalAlign: "middle",
          ...palette,
        };
      }}
    >
      {status}
    </Box>
  );
}
