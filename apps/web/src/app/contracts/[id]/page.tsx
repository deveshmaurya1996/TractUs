"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  Snackbar,
  Stack,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { ConfirmDialog, StatusChip, LoadingOverlay } from "@tractus/ui";
import { formatDateTime, getNextStatus, getStatusActionColor, getStatusActionLabel } from "@tractus/utils";
import type { AuditEvent, ContractFieldData } from "@tractus/types";
import { calculateItemTotal, ContractFieldDataSchema } from "@tractus/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EditContractDialog } from "../../../components/EditContractDialog";
import { AuditJsonBlock } from "../../../components/AuditJsonBlock";
import { DetailField } from "../../../components/DetailField";
import { useSelectedOrganization } from "../../../hooks";
import {
  useContract,
  useAuditEvents,
  useUpdateContract,
  useUpdateContractStatus,
  useUploadContractPdf,
  useDeleteContract,
  useContractSocket,
} from "../../../hooks";
import { getContractPdfUrl } from "../../../lib/contracts-api";

const emptyFieldData: ContractFieldData = {
  client_name: "",
  po_ref_no: "",
  po_date: "",
  items: [{ description: "", quantity: 1, unit_price: 0, total: calculateItemTotal(1, 0) }],
};

const EVENT_LABELS: Record<string, string> = {
  "contract.created": "Created",
  "contract.updated": "Updated",
  "contract.status.changed": "Status Changed",
  "contract.deleted": "Deleted",
  "contract.pdf.uploaded": "PDF Uploaded",
};

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { organizationId, organizationsLoading } = useSelectedOrganization();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const { data: contractData, isLoading: contractLoading } = useContract(
    id,
    organizationId
  );
  const { data: eventsData, isLoading: eventsLoading } = useAuditEvents(
    id,
    organizationId
  );

  useContractSocket(id);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const updateMutation = useUpdateContract(id, organizationId, {
    onSuccess: () => {
      setEditDialogOpen(false);
      showSnackbar("Contract updated successfully!", "success");
    },
    onError: () => showSnackbar("Failed to update contract", "error"),
  });

  const statusMutation = useUpdateContractStatus({
    onSuccess: () => showSnackbar("Status updated successfully!", "success"),
    onError: () => showSnackbar("Failed to update status", "error"),
  });

  const pdfMutation = useUploadContractPdf(id, organizationId, {
    onSuccess: () => showSnackbar("PDF uploaded successfully!", "success"),
    onError: () => showSnackbar("Failed to upload PDF", "error"),
  });

  const deleteMutation = useDeleteContract({
    onSuccess: () => {
      setDeleteDialogOpen(false);
      showSnackbar("Contract deleted successfully!", "success");
      router.push("/");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete contract";
      showSnackbar(message, "error");
    },
  });

  const contract = contractData?.data;
  const events = eventsData?.data || [];

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<{
    fieldData: ContractFieldData;
  }>({
    resolver: zodResolver(z.object({ fieldData: ContractFieldDataSchema })),
    defaultValues: { fieldData: emptyFieldData },
  });

  const onSubmit = (data: { fieldData: ContractFieldData }) => {
    updateMutation.mutate(data);
  };

  if (organizationsLoading) return <LoadingOverlay />;

  if (!organizationId) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography gutterBottom>Select an organization from the header to continue.</Typography>
        <Button onClick={() => router.push("/")} variant="contained" sx={{ mt: 2 }}>
          Go to Contracts
        </Button>
      </Paper>
    );
  }

  if (contractLoading || eventsLoading) return <LoadingOverlay />;
  if (!contract) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography gutterBottom>Contract not found</Typography>
        <Button onClick={() => router.push("/")} variant="outlined" sx={{ mt: 2 }}>
          Back to Contracts
        </Button>
      </Paper>
    );
  }

  const nextStatus = getNextStatus(contract.status);

  return (
    <>
      <Stack spacing={3}>
        <Box>
          <Breadcrumbs sx={{ mb: 1.5 }}>
            <Link
              component="button"
              variant="body2"
              underline="hover"
              color="inherit"
              onClick={() => router.push("/")}
            >
              Contracts
            </Link>
            <Typography variant="body2" color="text.primary">
              {contract.clientName}
            </Typography>
          </Breadcrumbs>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={() => router.push("/")} size="small" sx={{ border: 1, borderColor: "divider" }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Box>
                <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                  <Typography variant="h4">{contract.clientName}</Typography>
                  <StatusChip status={contract.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontFamily: "monospace" }}>
                  {contract.id}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {contract.status === "DRAFT" && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlinedIcon />}
                    onClick={() => {
                      reset({ fieldData: contract.fieldData });
                      setEditDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </>
              )}
              {nextStatus && (
                <Button
                  variant="outlined"
                  color={getStatusActionColor(nextStatus)}
                  onClick={() =>
                    statusMutation.mutate({
                      id,
                      organizationId,
                      status: nextStatus,
                    })
                  }
                >
                  {getStatusActionLabel(nextStatus)}
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Overview
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DetailField label="PO Reference" value={contract.poRefNo} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DetailField label="PO Date" value={contract.poDate} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DetailField
                      label="Payment Terms"
                      value={contract.fieldData.payment_terms || "—"}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DetailField
                      label="Delivery Terms"
                      value={contract.fieldData.delivery_terms || "—"}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DetailField
                      label="Created"
                      value={formatDateTime(new Date(contract.createdAt))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DetailField
                      label="Last Updated"
                      value={formatDateTime(new Date(contract.updatedAt))}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  PDF Attachment
                </Typography>
                {contract.pdfFileName ? (
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <PictureAsPdfOutlinedIcon color="error" />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {contract.pdfFileName}
                      </Typography>
                      {contract.pdfSize != null && (
                        <Typography variant="caption" color="text.secondary">
                          {(contract.pdfSize / 1024).toFixed(1)} KB
                        </Typography>
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      component="a"
                      href={getContractPdfUrl(id, organizationId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No PDF attached to this contract.
                  </Typography>
                )}
                {contract.status === "DRAFT" && (
                  <Button
                    variant="outlined"
                    size="small"
                    component="label"
                    startIcon={<UploadFileOutlinedIcon />}
                    disabled={pdfMutation.isPending}
                    sx={{ mt: contract.pdfFileName ? 2 : 0 }}
                  >
                    {contract.pdfFileName ? "Replace PDF" : "Upload PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) pdfMutation.mutate(file);
                        e.target.value = "";
                      }}
                    />
                  </Button>
                )}
              </Paper>

              <Paper sx={{ overflow: "hidden" }}>
                <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: "divider" }}>
                  <Typography variant="h6">Line Items</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contract.fieldData.items.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.description}
                            </Typography>
                            {(item.quantity_unit || item.pricing_unit) && (
                              <Typography variant="caption" color="text.secondary">
                                {[item.quantity_unit, item.pricing_unit].filter(Boolean).join(" · ")}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            ${(
                              item.total ?? calculateItemTotal(item.quantity, item.unit_price)
                            ).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Audit Trail
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {events.length} event{events.length !== 1 ? "s" : ""} recorded
              </Typography>

              <Stack spacing={0} divider={<Divider flexItem />}>
                {events.map((event: AuditEvent) => (
                  <Box key={event.id} sx={{ py: 2 }}>
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
                        {EVENT_LABELS[event.eventType] ?? event.eventType}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(new Date(event.createdAt))}
                      </Typography>
                    </Stack>
                    <AuditJsonBlock data={event.metadata} />
                  </Box>
                ))}
                {events.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No audit events yet.
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>

      <EditContractDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleSubmit(onSubmit)}
        isPending={updateMutation.isPending}
        formControl={control}
        formErrors={errors}
        formSetValue={setValue}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Contract"
        description="Are you sure you want to delete this contract? This action cannot be undone."
        onConfirm={() =>
          organizationId &&
          deleteMutation.mutate({ id, organizationId })
        }
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
