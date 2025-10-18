import { Component, ChangeDetectionStrategy, computed, signal, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-bar-component.html',
  styleUrl: './search-bar-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    city: [''],
    startDate: [''],
    endDate: [''],
    guests: [1]
  });

  criteria = signal(this.form.value);
  criteriaDisplay = computed(() => `${this.criteria().city} ${this.criteria().startDate} - ${this.criteria().endDate}`);

  onSearch = output<{ city: string; startDate: string; endDate: string; guests: number }>();

  // Fecha mínima (hoy)
  get minDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  submit(): void {
    if (this.form.valid) this.onSearch.emit(this.form.getRawValue());
  }
}
