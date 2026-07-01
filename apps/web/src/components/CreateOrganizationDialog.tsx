"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationSchema } from "@tractus/validation";
import { z } from "zod";

const createOrganizationFormSchema = z.object({
  name: OrganizationSchema.shape.name,
});

type CreateOrganizationForm = z.infer<typeof createOrganizationFormSchema>;

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isPending: boolean;
}

export function CreateOrganizationDialog({
  open,
  onClose,
  onSubmit,
  isPending,
}: CreateOrganizationDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationFormSchema),
    defaultValues: { name: "" },
  });

  const handleClose = () => {
    reset({ name: "" });
    onClose();
  };

  const submit = handleSubmit((data) => {
    onSubmit(data.name);
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Organization</DialogTitle>
      <form onSubmit={submit}>
        <DialogContent>
          <TextField
            {...register("name")}
            label="Organization name"
            fullWidth
            autoFocus
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
