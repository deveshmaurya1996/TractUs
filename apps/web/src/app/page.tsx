"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Alert,
  Snackbar,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRowParams,
} from "@mui/x-data-grid";
import { StatusChip, EmptyState, LoadingOverlay, ConfirmDialog } from "@tractus/ui";
import { formatDate, getNextStatus } from "@tractus/utils";
import { useOrganization } from "./providers";
import type { Contract } from "@tractus/types";
import { ContractFieldDataSchema } from "@tractus/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import type { ContractFieldData } from "@tractus/types";
import { CreateContractDialog } from "../components/CreateContractDialog";
import { dataGridSx } from "../theme/theme";
import {
  useOrganizations,
  useContracts,
  useCreateContract,
  useDeleteContract,
  useUpdateContractStatus,
  useContractsSocket,
} from "../hooks";

const emptyFieldData: ContractFieldData = {
  client_name: "",
  po_ref_no: "",
  po_date: "",
  items: [{ description: "", quantity: 1, unit_price: 0 }],
};

export default function Home() {
  const router = useRouter();
  const { selectedOrganization, setSelectedOrganization } = useOrganization();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const { data: orgData, isLoading: orgsLoading } = useOrganizations();
  const organizations = orgData?.data ?? [];

  useEffect(() => {
    const orgs = orgData?.data;
    if (!selectedOrganization && orgs && orgs.length > 0) {
      setSelectedOrganization(orgs[0] ?? null);
    }
  }, [orgData, selectedOrganization, setSelectedOrganization]);

  const { data: contractsData, isLoading: contractsLoading } = useContracts({
    organizationId: selectedOrganization?.id,
    paginationModel,
    search,
    statusFilter,
  });

  useContractsSocket();

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const createMutation = useCreateContract({
    onSuccess: () => {
      setCreateDialogOpen(false);
      reset({ fieldData: emptyFieldData });
      showSnackbar("Contract created successfully!", "success");
    },
    onError: () => showSnackbar("Failed to create contract", "error"),
  });

  const deleteMutation = useDeleteContract({
    onSuccess: () => {
      setDeleteDialogOpen(null);
      showSnackbar("Contract deleted successfully!", "success");
    },
    onError: () => showSnackbar("Failed to delete contract", "error"),
  });

  const statusMutation = useUpdateContractStatus({
    onSuccess: () => showSnackbar("Status updated successfully!", "success"),
    onError: () => showSnackbar("Failed to update status", "error"),
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<{
    fieldData: ContractFieldData;
  }>({
    resolver: zodResolver(z.object({ fieldData: ContractFieldDataSchema })),
    defaultValues: { fieldData: emptyFieldData },
  });

  const onSubmit = (data: { fieldData: ContractFieldData }) => {
    if (selectedOrganization) {
      createMutation.mutate({
        organizationId: selectedOrganization.id,
        fieldData: data.fieldData,
      });
    }
  };

  const handleCreateFromJson = (fieldData: ContractFieldData) => {
    if (selectedOrganization) {
      createMutation.mutate({
        organizationId: selectedOrganization.id,
        fieldData,
      });
    }
  };

  const stopRowClick = (e: React.MouseEvent) => e.stopPropagation();

  const columns: GridColDef<Contract>[] = [
    {
      field: "clientName",
      headerName: "Client Name",
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <Typography
          variant="body2"
          fontWeight={600}
          color="text.primary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
          }}
          title={params.row.clientName}
        >
          {params.row.clientName}
        </Typography>
      ),
    },
    { field: "poRefNo", headerName: "PO Ref", width: 120 },
    {
      field: "id",
      headerName: "Contract ID",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
          {params.row.id}
        </Typography>
      ),
    },
    { field: "poDate", headerName: "PO Date", width: 120 },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => <StatusChip status={params.row.status} />,
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 130,
      valueGetter: (value) => formatDate(new Date(value)),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      filterable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const nextStatus = getNextStatus(params.row.status);
        const orgId = selectedOrganization?.id;
        return (
          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="flex-end"
            alignItems="center"
            width="100%"
            height="100%"
            onClick={stopRowClick}
          >
            {params.row.status === "DRAFT" && (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => router.push(`/contracts/${params.row.id}`)}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteDialogOpen(params.row.id)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            {nextStatus && orgId && (
              <Button
                variant="contained"
                size="small"
                sx={{ ml: 0.5, minWidth: 88, whiteSpace: "nowrap" }}
                onClick={() =>
                  statusMutation.mutate({
                    id: params.row.id,
                    organizationId: orgId,
                    status: nextStatus,
                  })
                }
              >
                {nextStatus}
              </Button>
            )}
          </Stack>
        );
      },
    },
  ];

  const handleRowClick = (params: GridRowParams<Contract>) => {
    router.push(`/contracts/${params.row.id}`);
  };

  if (orgsLoading) return <LoadingOverlay />;

  const contracts = contractsData?.data?.data || [];
  const total = contractsData?.data?.total || 0;

  return (
    <>
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Contracts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage purchase orders and contract lifecycle for your organization
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              reset({ fieldData: emptyFieldData });
              setCreateDialogOpen(true);
            }}
            disabled={!selectedOrganization}
          >
            New Contract
          </Button>
        </Box>

        <Paper sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth required>
                <InputLabel>Organization</InputLabel>
                <Select
                  value={selectedOrganization?.id || ""}
                  label="Organization"
                  onChange={(e) => {
                    const org = organizations.find((o) => o.id === e.target.value);
                    setSelectedOrganization(org ?? null);
                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                  }}
                >
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Client name, contract ID, or PO ref"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
                disabled={!selectedOrganization}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                  }}
                  disabled={!selectedOrganization}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="FINALIZED">Finalized</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ overflow: "hidden" }}>
          {!selectedOrganization ? (
            <EmptyState
              title="Select an organization"
              description="Choose an organization above to view and manage contracts"
            />
          ) : (
            <DataGrid
              rows={contracts}
              columns={columns}
              rowCount={total}
              rowHeight={56}
              pagination
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              loading={contractsLoading}
              autoHeight
              getRowId={(row) => row.id}
              onRowClick={handleRowClick}
              disableRowSelectionOnClick
              sx={dataGridSx}
              slots={{
                noRowsOverlay: () => (
                  <EmptyState
                    title="No contracts found"
                    description="Try adjusting your search or create a new contract"
                  />
                ),
              }}
            />
          )}
        </Paper>
      </Stack>

      <CreateContractDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateFromJson}
        isPending={createMutation.isPending}
        formControl={control}
        formErrors={errors}
        onFormSubmit={handleSubmit(onSubmit)}
        onResetForm={reset}
        emptyFieldData={emptyFieldData}
      />

      <ConfirmDialog
        open={!!deleteDialogOpen}
        title="Delete Contract"
        description="Are you sure you want to delete this contract? This action cannot be undone."
        onConfirm={() =>
          deleteDialogOpen &&
          selectedOrganization &&
          deleteMutation.mutate({
            id: deleteDialogOpen,
            organizationId: selectedOrganization.id,
          })
        }
        onCancel={() => setDeleteDialogOpen(null)}
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
