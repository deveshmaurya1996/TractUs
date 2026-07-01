"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
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
import { parseContractJsonInput } from "@tractus/validation";
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

const SAMPLE_JSON_ARRAY = `[
  {
    "client_name": "Acme Corp",
    "po_ref_no": "PO-001",
    "po_date": "2024-01-15",
    "items": [
      {
        "description": "Widget A",
        "quantity": 10,
        "unit_price": 29.99
      }
    ]
  },
  {
    "client_name": "Globex Inc",
    "po_ref_no": "PO-002",
    "po_date": "2024-02-01",
    "items": [
      {
        "description": "Widget B",
        "quantity": 5,
        "unit_price": 49.99
      }
    ]
  }
]`;

interface CreateContractDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fieldData: ContractFieldData, pdfFile?: File | null) => void;
  onSubmitBulk: (fieldDataList: ContractFieldData[]) => void;
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
  onSubmitBulk,
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
  const [parsedContracts, setParsedContracts] = useState<ContractFieldData[] | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const isBulkCreate = (parsedContracts?.length ?? 0) > 1;

  const validateJsonInput = (raw: string) => {
    const result = parseContractJsonInput(raw);
    if (result.ok) {
      setParsedContracts(result.contracts);
      setJsonError(null);
      return result.contracts;
    }

    setParsedContracts(null);
    if (raw.trim()) {
      setJsonError(result.message);
    } else {
      setJsonError(null);
    }
    return null;
  };

  useEffect(() => {
    if (tab === 1 && open) {
      validateJsonInput(jsonInput);
    }
  }, [tab, open, jsonInput]);

  const handleApplyJson = () => {
    const contracts = validateJsonInput(jsonInput);
    if (!contracts) return;

    if (contracts.length > 1) {
      setJsonError("Apply to Form supports a single contract only. Create all contracts from JSON instead.");
      return;
    }

    onResetForm({ fieldData: contracts[0] });
    setTab(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonInput(text);
      validateJsonInput(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCreateFromJson = () => {
    const contracts = validateJsonInput(jsonInput);
    if (!contracts) return;

    if (contracts.length > 1) {
      onSubmitBulk(contracts);
      return;
    }

    onSubmit(contracts[0], pdfFile);
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
    setParsedContracts(null);
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
          {isBulkCreate ? "New Contracts" : "New Contract"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isBulkCreate
            ? `${parsedContracts?.length ?? 0} contracts ready to create from JSON`
            : "Enter details manually or paste contract JSON. You can optionally attach a PDF."}
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
                Paste or upload a single contract object or an array of contracts
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
              minRows={isBulkCreate ? 10 : 14}
              maxRows={20}
              fullWidth
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={SAMPLE_JSON}
              error={!!jsonError}
              helperText={
                jsonError ??
                "Supports one contract object or an array of contract objects"
              }
              sx={{
                "& .MuiInputBase-input": {
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: "0.8125rem",
                  lineHeight: 1.6,
                },
              }}
            />

            {isBulkCreate && parsedContracts && (
              <Alert severity="info">
                {parsedContracts.length} contracts detected. Review the list below, then create them all at once.
              </Alert>
            )}

            {isBulkCreate && parsedContracts && (
              <Box
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  maxHeight: 180,
                  overflow: "auto",
                }}
              >
                <List dense disablePadding>
                  {parsedContracts.map((contract, index) => (
                    <ListItem key={`${contract.po_ref_no}-${index}`} divider={index < parsedContracts.length - 1}>
                      <ListItemText
                        primary={`${index + 1}. ${contract.client_name}`}
                        secondary={`${contract.po_ref_no} · ${contract.po_date} · ${contract.items.length} item(s)`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button variant="outlined" size="small" onClick={() => setJsonInput(SAMPLE_JSON)}>
                Load Sample
              </Button>
              <Button variant="outlined" size="small" onClick={() => setJsonInput(SAMPLE_JSON_ARRAY)}>
                Load Array Sample
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleApplyJson}
                disabled={isBulkCreate}
              >
                Apply to Form
              </Button>
            </Stack>

            {jsonError && <Alert severity="error">{jsonError}</Alert>}
          </Stack>
        )}

        {!isBulkCreate && (
          <>
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
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={isPending}>
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
          <Button
            variant="contained"
            onClick={handleCreateFromJson}
            disabled={isPending || !parsedContracts?.length}
          >
            {isBulkCreate
              ? `Create ${parsedContracts?.length ?? 0} Contracts`
              : "Create Contract"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
