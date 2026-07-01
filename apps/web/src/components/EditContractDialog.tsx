"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ContractFieldForm } from "./ContractFieldForm";

interface EditContractDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  formControl: React.ComponentProps<typeof ContractFieldForm>["control"];
  formErrors: React.ComponentProps<typeof ContractFieldForm>["errors"];
  formSetValue: React.ComponentProps<typeof ContractFieldForm>["setValue"];
}

export function EditContractDialog({
  open,
  onClose,
  onSubmit,
  isPending,
  formControl,
  formErrors,
  formSetValue,
}: EditContractDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="edit-contract-title"
    >
      <Box sx={{ position: "relative", px: 3, pt: 2.5, pb: 1 }}>
        <Typography id="edit-contract-title" variant="h6" component="h2" fontWeight={700}>
          Edit Contract
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          size="small"
          aria-label="Close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogContent>
          <ContractFieldForm control={formControl} errors={formErrors} setValue={formSetValue} />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
