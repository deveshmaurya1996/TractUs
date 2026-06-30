"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import { ZodError } from "zod";
import { ContractFieldDataSchema, formatZodErrors } from "@tractus/validation";
import type { ContractFieldData } from "@tractus/types";
import { ContractFieldForm } from "./ContractFieldForm";

const SAMPLE_JSON = `{
  "client_name": "Acme Corp",
  "po_ref_no": "PO-001",
  "po_date": "2024-01-15",
  "payment_terms": "Net 30",
  "delivery_terms": "FOB",
  "items": [
    {
      "description": "Widget A",
      "quantity": 10,
      "quantity_unit": "pcs",
      "unit_price": 29.99,
      "pricing_unit": "USD",
      "total": 299.9
    }
  ]
}`;

interface CreateContractDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fieldData: ContractFieldData) => void;
  isPending: boolean;
  formControl: React.ComponentProps<typeof ContractFieldForm>["control"];
  formErrors: React.ComponentProps<typeof ContractFieldForm>["errors"];
  onFormSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onResetForm: (data: { fieldData: ContractFieldData }) => void;
  emptyFieldData: ContractFieldData;
}

export function CreateContractDialog({
  open,
  onClose,
  onSubmit,
  isPending,
  formControl,
  formErrors,
  onFormSubmit,
  onResetForm,
  emptyFieldData,
}: CreateContractDialogProps) {
  const [tab, setTab] = useState(0);
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const parseJson = (raw: string): ContractFieldData | null => {
    try {
      const data = JSON.parse(raw);
      const validated = ContractFieldDataSchema.parse(data);
      setJsonError(null);
      return validated;
    } catch (err) {
      const message =
        err instanceof ZodError
          ? formatZodErrors(err)
          : err instanceof SyntaxError
            ? "Invalid JSON syntax"
            : "Invalid contract data";
      setJsonError(message);
      return null;
    }
  };

  const handleApplyJson = () => {
    const validated = parseJson(jsonInput);
    if (validated) {
      onResetForm({ fieldData: validated });
      setTab(0);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonInput(text);
      parseJson(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCreateFromJson = () => {
    const validated = parseJson(jsonInput);
    if (validated) {
      onSubmit(validated);
    }
  };

  const handleClose = () => {
    setTab(0);
    setJsonError(null);
    setJsonInput(SAMPLE_JSON);
    onResetForm({ fieldData: emptyFieldData });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="create-contract-title"
    >
      <Box sx={{ position: "relative", px: 3, pt: 2.5, pb: 1 }}>
        <Typography id="create-contract-title" variant="h6" component="h2" fontWeight={700}>
          New Contract
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter details manually or paste contract JSON
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          size="small"
          aria-label="Close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab icon={<EditNoteOutlinedIcon fontSize="small" />} iconPosition="start" label="Manual Entry" />
        <Tab icon={<CodeOutlinedIcon fontSize="small" />} iconPosition="start" label="JSON Input" />
      </Tabs>

      <DialogContent sx={{ pt: 3 }}>
        {tab === 0 ? (
          <Box component="form" id="create-contract-form" onSubmit={onFormSubmit}>
            <ContractFieldForm control={formControl} errors={formErrors} />
          </Box>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Paste or upload valid contract JSON
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component="label"
                startIcon={<UploadFileOutlinedIcon />}
              >
                Upload File
                <input type="file" accept=".json,application/json" hidden onChange={handleFileUpload} />
              </Button>
            </Stack>

            <TextField
              multiline
              minRows={14}
              maxRows={20}
              fullWidth
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                if (jsonError) setJsonError(null);
              }}
              placeholder={SAMPLE_JSON}
              error={!!jsonError}
              helperText={jsonError ?? "Supports the required contract schema"}
              sx={{
                "& .MuiInputBase-input": {
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: "0.8125rem",
                  lineHeight: 1.6,
                },
              }}
            />

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" onClick={() => setJsonInput(SAMPLE_JSON)}>
                Load Sample
              </Button>
              <Button variant="outlined" size="small" onClick={handleApplyJson}>
                Apply to Form
              </Button>
            </Stack>

            {jsonError && <Alert severity="error">{jsonError}</Alert>}
          </Stack>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        {tab === 0 ? (
          <Button
            type="submit"
            form="create-contract-form"
            variant="contained"
            disabled={isPending}
          >
            Create Contract
          </Button>
        ) : (
          <Button variant="contained" onClick={handleCreateFromJson} disabled={isPending}>
            Create from JSON
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
