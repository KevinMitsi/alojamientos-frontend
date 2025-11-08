import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccommodationService } from '../../services/accommodation.service';
import { AccommodationMetrics } from '../../models/accommodation.model';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-accommodation-detail-host',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accommodation-detail-host.html',
  styleUrl: './accommodation-detail-host.css'
})
export class AccommodationDetailHost implements OnInit {
  metrics: AccommodationMetrics | null = null;
  isLoading: boolean = false;
  accommodationId: number | null = null;

  startDate: string | null = null;
  endDate: string | null = null;

  constructor(
    private route: ActivatedRoute = inject(ActivatedRoute),
    private router: Router = inject(Router),
    private accommodationService: AccommodationService = inject(AccommodationService),
    private cdr: ChangeDetectorRef = inject(ChangeDetectorRef)
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.accommodationId = +id;
        // Ya no se cargan métricas automáticamente
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se encontró el ID del alojamiento.'
        });
        this.router.navigate(['/mis-alojamientos']);
      }
    });
  }

  fetchMetrics(): void {
    if (!this.accommodationId) return;
    this.isLoading = true;
    this.cdr.markForCheck();
    this.accommodationService.getMetrics(
      this.accommodationId,
      this.startDate || undefined,
      this.endDate || undefined
    )
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (metrics) => {
          this.metrics = metrics;
          this.cdr.markForCheck();
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las métricas del alojamiento.'
          });
          this.cdr.markForCheck();
        }
      });
  }

  onGenerateMetrics(): void {
    this.fetchMetrics();
  }

  goBack(): void {
    this.router.navigate(['/mis-alojamientos']);
  }
}
