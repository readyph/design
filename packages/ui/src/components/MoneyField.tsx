import { forwardRef } from 'react';
import { TextField, type TextFieldProps } from './TextField';
import { cn } from '../utils/cn';

/**
 * Money / amount field: ONE joined group. The library TextField already draws a single border with the control
 * radius and a divider hairline before the unit segment; this wrapper clips the unit segment to the group's outer
 * radius (so only the outer corners round, the inner corner stays square), right-aligns the value with
 * tabular-nums and sets the unit to 14px muted. Focus ring, error and disabled states stay on the whole group.
 * Reused by every Payment field with a PHP (or %) suffix.
 */
export const MONEY_GROUP_CLASS =
  '[&>div]:overflow-hidden [&_input]:text-right [&_input]:tabular-nums [&_span[id$=-unit]]:text-[14px] [&_span[id$=-unit]]:text-muted';

export const MoneyField = forwardRef<HTMLInputElement, TextFieldProps>(function MoneyField({ unit = 'PHP', className, ...rest }, ref) {
  return <TextField ref={ref} unit={unit} className={cn(MONEY_GROUP_CLASS, className)} {...rest} />;
});
