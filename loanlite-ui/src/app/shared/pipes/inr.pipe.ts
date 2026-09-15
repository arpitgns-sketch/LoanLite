import { Pipe, PipeTransform } from '@angular/core';
import { formatInr } from '../../core/utils/emi.util';

/** {{ amount | inr }} → ₹5,00,000 (Indian grouping). */
@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatInr(value ?? 0);
  }
}
