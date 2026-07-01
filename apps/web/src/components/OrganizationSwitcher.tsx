"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Snackbar,
  Typography,
} from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useCreateOrganization, useSelectedOrganization } from "../hooks";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";

export function OrganizationSwitcher() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const {
    selectedOrganization,
    organizationId,
    organizations,
    organizationsLoading,
    setOrganizationId,
  } = useSelectedOrganization();

  const createMutation = useCreateOrganization({
    onSuccess: (newOrganizationId) => {
      setCreateDialogOpen(false);
      setOrganizationId(newOrganizationId);
      setSnackbar({
        open: true,
        message: "Organization created successfully!",
        severity: "success",
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to create organization";
      setSnackbar({ open: true, message, severity: "error" });
    },
  });

  const open = Boolean(anchorEl);

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleOpenCreateDialog = () => {
    handleClosePopover();
    setCreateDialogOpen(true);
  };

  const handleSelectOrganization = (id: string) => {
    setOrganizationId(id);
    handleClosePopover();
  };

  return (
    <>
      <Chip
        icon={<BusinessOutlinedIcon />}
        label={
          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            {organizationsLoading
              ? "Loading..."
              : selectedOrganization?.name ?? "Select organization"}
            <KeyboardArrowDownIcon sx={{ fontSize: 18, opacity: 0.7 }} />
          </Box>
        }
        size="small"
        color="primary"
        variant="outlined"
        onClick={handleOpenPopover}
        disabled={organizationsLoading}
        sx={{
          fontWeight: 600,
          cursor: "pointer",
          "& .MuiChip-label": { px: 1 },
          pl: 1,
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { mt: 1, width: 280, borderRadius: 2 },
          },
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            Current organization
          </Typography>
          {selectedOrganization ? (
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
              {selectedOrganization.name}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              No organization selected
            </Typography>
          )}
        </Box>

        {organizations.length > 0 && (
          <>
            <Divider />
            <List dense disablePadding sx={{ py: 0.5 }}>
              {organizations.map((org) => (
                <ListItemButton
                  key={org.id}
                  selected={org.id === organizationId}
                  onClick={() => handleSelectOrganization(org.id)}
                >
                  <ListItemText primary={org.name} />
                  {org.id === organizationId && (
                    <ListItemIcon sx={{ minWidth: 32, justifyContent: "flex-end" }}>
                      <CheckIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                  )}
                </ListItemButton>
              ))}
            </List>
          </>
        )}

        <Divider />
        <Box sx={{ p: 1.5 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Organisation
          </Button>
        </Box>
      </Popover>

      <CreateOrganizationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={(name) => createMutation.mutate(name)}
        isPending={createMutation.isPending}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
