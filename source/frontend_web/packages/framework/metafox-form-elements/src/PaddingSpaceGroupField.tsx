/**
 * @type: formElement
 * name: form.element.PaddingSpaceGroup
 */
import {
  Box,
  Grid,
  MenuItem,
  Select,
  Typography,
  useTheme
} from '@mui/material';
import { useField } from 'formik';
import { range } from 'lodash';
import * as React from 'react';

function SelectInput({ label, name, step = 0.125 }) {
  const [field, , { setValue }] = useField(name);
  const theme = useTheme();
  const options = range(0, 4 / step + 1).map(x => ({
    value: x * step,
    label: `${theme.spacing(x * step)}`
  }));

  return (
    <Select
      value={field.value}
      onBlur={field.onBlur}
      onChange={evt => setValue(Number(evt.target.value))}
      size="small"
      variant="outlined"
      defaultValue={0}
      fullWidth
      startAdornment={label}
    >
      {options.map(x => (
        <MenuItem key={x.label} value={x.value}>
          {x.label}
        </MenuItem>
      ))}
    </Select>
  );
}

export default function PaddingSpaceGroupField({ config }) {
  const { label, prefix, description } = config;

  return (
    <Box sx={{ pt: 2 }}>
      {label ? (
        <Typography
          sx={{ fontWeight: 'bold', pb: 2 }}
          variant="body2"
          color="text.secondary"
        >
          {label}
        </Typography>
      ) : null}
      {description ? (
        <Typography paragraph color="text.secondary" variant="body2">
          {description}
        </Typography>
      ) : null}
      <Grid container spacing={2}>
        <Grid item>
          <SelectInput label="top" name={`${prefix}.pt`} />
        </Grid>
        <Grid item>
          <SelectInput label="right" name={`${prefix}.pr`} />
        </Grid>
        <Grid item>
          <SelectInput label="bottom" name={`${prefix}.pb`} />
        </Grid>
        <Grid item>
          <SelectInput label="left" name={`${prefix}.pl`} />
        </Grid>
      </Grid>
    </Box>
  );
}
