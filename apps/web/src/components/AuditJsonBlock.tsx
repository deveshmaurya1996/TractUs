"use client";

import { useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

interface AuditJsonBlockProps {
  data: unknown;
}

export function AuditJsonBlock({ data }: AuditJsonBlockProps) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Tooltip title={copied ? "Copied!" : "Copy JSON"}>
        <IconButton
          size="small"
          onClick={handleCopy}
          aria-label="Copy JSON"
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 1,
          }}
        >
          {copied ? (
            <CheckIcon fontSize="inherit" color="success" />
          ) : (
            <ContentCopyIcon fontSize="inherit" />
          )}
        </IconButton>
      </Tooltip>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.5,
          pr: 5,
          typography: "body2",
          color: "text.secondary",
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.7rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          bgcolor: "grey.50",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {json}
      </Box>
    </Box>
  );
}
