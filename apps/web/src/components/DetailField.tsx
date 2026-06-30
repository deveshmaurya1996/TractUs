import { Box, Typography } from "@mui/material";

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
}

export function DetailField({ label, value }: DetailFieldProps) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 0.5 }}
      >
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}
