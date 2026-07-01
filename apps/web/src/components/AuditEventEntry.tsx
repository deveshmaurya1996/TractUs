"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { AuditEvent } from "@tractus/types";
import { formatDateTime, getAuditEventLabel, summarizeAuditEvent } from "@tractus/utils";
import { AuditJsonBlock } from "./AuditJsonBlock";

interface AuditEventEntryProps {
  event: AuditEvent;
  events: AuditEvent[];
  index: number;
}

export function AuditEventEntry({ event, events, index }: AuditEventEntryProps) {
  const [showJson, setShowJson] = useState(false);
  const { lines } = summarizeAuditEvent(event, events, index);

  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            height: 24,
            px: 1,
            borderRadius: "16px",
            fontSize: "0.75rem",
            fontWeight: 600,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
          }}
        >
          {getAuditEventLabel(event.eventType)}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {formatDateTime(new Date(event.createdAt))}
        </Typography>
      </Stack>

      <Box
        component="ul"
        sx={{
          m: 0,
          pl: 2.25,
          mb: 1,
          color: "text.primary",
        }}
      >
        {lines.map((line) => (
          <Typography key={line} component="li" variant="body2" sx={{ mb: 0.5 }}>
            {line}
          </Typography>
        ))}
      </Box>

      <Button
        size="small"
        color="inherit"
        onClick={() => setShowJson((open) => !open)}
        endIcon={
          <ExpandMoreIcon
            sx={{
              transform: showJson ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        }
        sx={{ px: 0, minWidth: 0, textTransform: "none", color: "text.secondary" }}
      >
        {showJson ? "Hide raw JSON" : "View raw JSON"}
      </Button>

      <Collapse in={showJson} unmountOnExit>
        <Box sx={{ mt: 1 }}>
          <AuditJsonBlock data={event.metadata} />
        </Box>
      </Collapse>
    </Box>
  );
}
