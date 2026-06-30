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
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ClearIcon from "@mui/icons-material/Clear";
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
  onSubmit: (fieldData: ContractFieldData, pdfFile?: File | null) => void;
  onManualCreate: (pdfFile?: File | null) => void;
  isPending: boolean;
  formControl: React.ComponentProps<typeof ContractFieldForm>["control"];
  formErrors: React.ComponentProps<typeof ContractFieldForm>["errors"];
  formSetValue: React.ComponentProps<typeof ContractFieldForm>["setValue"];
  onResetForm: (data: { fieldData: ContractFieldData }) => void;
  emptyFieldData: ContractFieldData;
}

export function CreateContractDialog({
  open,
  onClose,
  onSubmit,
  onManualCreate,
  isPending,
  formControl,
  formErrors,
  formSetValue,
  onResetForm,
  emptyFieldData,
}: CreateContractDialogProps) {
  const [tab, setTab] = useState(0);
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

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
      onSubmit(validated, pdfFile);
    }
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      setPdfError("Only PDF files are allowed");
      setPdfFile(null);
      return;
    }

    setPdfError(null);
    setPdfFile(file);
  };

  const handleClose = () => {
    setTab(0);
    setJsonError(null);
    setPdfError(null);
    setPdfFile(null);
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
          Enter details manually or paste contract JSON. You can optionally attach a PDF.
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
          <Box
            component="form"
            id="create-contract-form"
            onSubmit={(e) => {
              e.preventDefault();
              onManualCreate(pdfFile);
            }}
          >
            <ContractFieldForm
              control={formControl}
              errors={formErrors}
              setValue={formSetValue}
            />
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

        <Divider sx={{ my: 2.5 }} />

        <Stack spacing={1.5}>
          <Typography variant="subtitle2" fontWeight={600}>
            PDF Attachment (optional)
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              component="label"
              startIcon={<PictureAsPdfOutlinedIcon />}
              disabled={isPending}
            >
              {pdfFile ? "Replace PDF" : "Choose PDF"}
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={handlePdfSelect}
              />
            </Button>
            {pdfFile && (
              <>
                <Typography variant="body2" color="text.secondary">
                  {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                </Typography>
                <IconButton
                  size="small"
                  aria-label="Remove PDF"
                  onClick={() => {
                    setPdfFile(null);
                    setPdfError(null);
                  }}
                  disabled={isPending}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Stack>
          {pdfError && (
            <Typography variant="caption" color="error">
              {pdfError}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        {tab === 0 ? (
          <Button
            variant="contained"
            disabled={isPending}
            onClick={() => onManualCreate(pdfFile)}
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
