"use client";

import { useEffect } from "react";
import { Box, Button, TextField, Typography, Paper, Divider, IconButton, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import type { ContractFieldData } from "@tractus/types";
import { calculateItemTotal } from "@tractus/validation";
import Grid from "@mui/material/Grid2";

type FormValues = { fieldData: ContractFieldData };

interface ContractFieldFormProps {
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}

interface LineItemRowProps {
  index: number;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  onRemove: () => void;
  disableRemove: boolean;
}

function LineItemRow({
  index,
  control,
  errors,
  setValue,
  onRemove,
  disableRemove,
}: LineItemRowProps) {
  const quantity = useWatch({ control, name: `fieldData.items.${index}.quantity` });
  const unitPrice = useWatch({ control, name: `fieldData.items.${index}.unit_price` });
  const total = useWatch({ control, name: `fieldData.items.${index}.total` });

  useEffect(() => {
    const q = Number(quantity);
    const p = Number(unitPrice);
    if (!Number.isFinite(q) || !Number.isFinite(p)) return;

    const computed = calculateItemTotal(q, p);
    if (total !== computed) {
      setValue(`fieldData.items.${index}.total`, computed, { shouldDirty: true });
    }
  }, [quantity, unitPrice, total, index, setValue]);

  return (
    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Item {index + 1}
        </Typography>
        <IconButton
          size="small"
          color="error"
          aria-label={`Remove item ${index + 1}`}
          disabled={disableRemove}
          onClick={onRemove}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Controller
            name={`fieldData.items.${index}.description`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                error={!!errors.fieldData?.items?.[index]?.description}
                helperText={errors.fieldData?.items?.[index]?.description?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Controller
            name={`fieldData.items.${index}.quantity`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Quantity"
                type="number"
                fullWidth
                inputProps={{ min: 0.01, step: "any" }}
                error={!!errors.fieldData?.items?.[index]?.quantity}
                helperText={errors.fieldData?.items?.[index]?.quantity?.message}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Controller
            name={`fieldData.items.${index}.quantity_unit`}
            control={control}
            render={({ field }) => (
              <TextField {...field} value={field.value ?? ""} label="Qty Unit" fullWidth />
            )}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Controller
            name={`fieldData.items.${index}.unit_price`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Unit Price"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: "any" }}
                error={!!errors.fieldData?.items?.[index]?.unit_price}
                helperText={errors.fieldData?.items?.[index]?.unit_price?.message}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Controller
            name={`fieldData.items.${index}.pricing_unit`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                label="Pricing Unit"
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name={`fieldData.items.${index}.total`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Total"
                type="number"
                fullWidth
                value={field.value ?? 0}
                InputProps={{ readOnly: true }}
                helperText="Auto-calculated: quantity × unit_price"
              />
            )}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}

export function ContractFieldForm({ control, errors, setValue }: ContractFieldFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "fieldData.items",
  });

  return (
    <Box display="flex" flexDirection="column" gap={2.5}>
      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
        Contract Information
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="fieldData.client_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Client Name"
                fullWidth
                error={!!errors.fieldData?.client_name}
                helperText={errors.fieldData?.client_name?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="fieldData.po_ref_no"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="PO Reference No"
                fullWidth
                error={!!errors.fieldData?.po_ref_no}
                helperText={errors.fieldData?.po_ref_no?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="fieldData.po_date"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="PO Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={!!errors.fieldData?.po_date}
                helperText={errors.fieldData?.po_date?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="fieldData.payment_terms"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Payment Terms" fullWidth />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="fieldData.delivery_terms"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Delivery Terms" fullWidth />
            )}
          />
        </Grid>
      </Grid>

      <Divider />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
          Line Items
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() =>
            append({
              description: "",
              quantity: 1,
              unit_price: 0,
              total: calculateItemTotal(1, 0),
            })
          }
        >
          Add Item
        </Button>
      </Box>

      {fields.map((item, index) => (
        <LineItemRow
          key={item.id}
          index={index}
          control={control}
          errors={errors}
          setValue={setValue}
          onRemove={() => remove(index)}
          disableRemove={fields.length <= 1}
        />
      ))}
    </Box>
  );
}
