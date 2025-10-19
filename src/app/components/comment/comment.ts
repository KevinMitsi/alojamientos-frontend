import { CommonModule } from '@angular/common';
import { Component, input, OnInit, inject, signal } from '@angular/core';
import { CommentService } from '../../services/comment.service';
import { CommentDTO } from '../../models/comment.model';

@Component({
  selector: 'app-comment-list',
   standalone: true,
  imports: [CommonModule],
  templateUrl: './comment.html',
  styleUrl: './comment.css'
})

export class CommentListComponent implements OnInit {
  // Input: ID del alojamiento para cargar sus comentarios
  accommodationId = input.required<number>();

  private commentService = inject(CommentService);

  // Datos de comentarios
  comments = signal<CommentDTO[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Paginación
  currentPage = signal(0);
  totalPages = signal(0);
  totalComments = signal(0);
  pageSize = 10;

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(page: number = 0): void {
    this.loading.set(true);
    this.error.set(null);

    this.commentService.getByAccommodation(this.accommodationId(), page, this.pageSize)
      .subscribe({
        next: (response) => {
          this.comments.set(response.content);
          this.currentPage.set(response.number);
          this.totalPages.set(response.totalPages);
          this.totalComments.set(response.totalElements);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar comentarios:', err);
          this.error.set('No se pudieron cargar los comentarios');
          this.loading.set(false);
        }
      });
  }

  // Método para generar array de estrellas
  getStarsArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  // Método para formatear fecha
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Fecha no disponible';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // Si es del mismo día
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        if (diffMinutes < 1) return 'Hace un momento';
        return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
      }
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    }
    
    // Si es de hace menos de una semana
    if (diffDays < 7) {
      return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    }
    
    // Si es de hace menos de un mes
    if (diffWeeks < 4) {
      return `Hace ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`;
    }
    
    // Si es de hace menos de un año
    if (diffMonths < 12) {
      return `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
    }
    
    // Si es de hace más de un año
    if (diffYears === 1) {
      return 'Hace 1 año';
    }
    
    // Si es de hace muchos años, mostrar la fecha completa
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${months[date.getMonth()]} de ${date.getFullYear()}`;
  }

  // Método para obtener iniciales del nombre
  getInitials(name: string | undefined): string {
    if (!name) return 'U';
    
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  // Navegación de páginas
  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.loadComments(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.loadComments(this.currentPage() - 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadComments(page);
    }
  }

  // Método para mostrar botón "Mostrar más"
  showLoadMore(): boolean {
    return !this.loading() && this.currentPage() < this.totalPages() - 1;
  }
}
  