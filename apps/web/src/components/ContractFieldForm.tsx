"use client";

import { Box, Button, TextField, Typography, Paper, Divider, IconButton, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
} from "react-hook-form";
import type { ContractFieldData } from "@tractus/types";
import Grid from "@mui/material/Grid2";

interface ContractFieldFormProps {
  control: Control<{ fieldData: ContractFieldData }>;
  errors: FieldErrors<{ fieldData: ContractFieldData }>;
}

export function ContractFieldForm({ control, errors }: ContractFieldFormProps) {
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
          onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
        >
          Add Item
        </Button>
      </Box>

      {fields.map((item, index) => (
        <Paper key={item.id} sx={{ p: 2, bgcolor: "grey.50" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Item {index + 1}
            </Typography>
            <IconButton
              size="small"
              color="error"
              aria-label={`Remove item ${index + 1}`}
              disabled={fields.length <= 1}
              onClick={() => remove(index)}
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
                  <TextField {...field} label="Qty Unit" fullWidth />
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
                  <TextField {...field} label="Price Unit" fullWidth />
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
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Box>
  );
}
