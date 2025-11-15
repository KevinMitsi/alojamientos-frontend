import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AccommodationService } from '../../services/accommodation.service';
import { AuthService } from '../../services/auth.service';
import { AccommodationDTO, PageResponse } from '../../models/accommodation.model';
import { User } from '../../models/user.model';
import Swal from 'sweetalert2';
import { timeout, finalize, catchError } from 'rxjs';
import { of } from 'rxjs';
import { CommentService } from '../../services/comment.service'; 
import { forkJoin} from 'rxjs';
import { map } from 'rxjs/operators';


@Component({
  selector: 'app-my-accommodations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-accommodations.html',
  styleUrl: './my-accommodations.css'
})
export class MyAccommodations implements OnInit, OnDestroy {
  private routerEventsSub: any;
  private readonly accommodationService = inject(AccommodationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly commentService = inject(CommentService);


  currentUser: User | null = null;
  accommodations: AccommodationDTO[] = [];
  
  // Paginación
  currentPage: number = 0;
  pageSize: number = 5;
  totalPages: number = 0;
  totalElements: number = 0;
  
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadAccommodations();
    // Suscribirse a eventos de navegación para recargar si se navega a la misma ruta
    this.routerEventsSub = this.router.events.subscribe((event: any) => {
      if (event.constructor.name === 'NavigationEnd') {
        this.loadCurrentUser();
        this.loadAccommodations();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerEventsSub) {
      this.routerEventsSub.unsubscribe();
    }
  }

  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error al cargar el usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del usuario'
        });
      }
    });
  }

  loadAccommodations(): void {
    console.log('🔄 loadAccommodations llamado - isLoading:', this.isLoading);
    this.isLoading = true;
    console.log('✅ isLoading establecido a true');
    
    this.accommodationService.findByHost(this.currentPage, this.pageSize)
      .pipe(
        timeout(10000), // Aumentado a 10 segundos
        catchError((error) => {
          console.error('Error en catchError:', error);
          
          if (error.name === 'TimeoutError') {
            Swal.fire({
              icon: 'error',
              title: 'Tiempo de espera excedido',
              text: 'El servidor tardó demasiado en responder. Intenta de nuevo más tarde.'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron cargar tus alojamientos'
            });
          }
          
          // Retornar un observable con respuesta vacía para que el flujo continúe
          return of({
            content: [],
            totalPages: 0,
            totalElements: 0,
            empty: true,
            first: true,
            last: true,
            number: 0,
            numberOfElements: 0,
            size: this.pageSize,
            pageable: {
              pageNumber: 0,
              pageSize: this.pageSize,
              sort: { empty: true, sorted: false, unsorted: true },
              offset: 0,
              paged: true,
              unpaged: false
            },
            sort: { empty: true, sorted: false, unsorted: true }
          } as PageResponse<AccommodationDTO>);
        }),
        finalize(() => {
          console.log('Finalize ejecutado - isLoading antes:', this.isLoading);
          this.isLoading = false;
          console.log('Finalize ejecutado - isLoading después:', this.isLoading);
          this.cdr.detectChanges(); // Forzar detección de cambios
        })
      )
      .subscribe({
        next: (response: PageResponse<AccommodationDTO>) => {
          console.log('Respuesta de alojamientos:', response);
          this.accommodations = response.content || [];
          this.totalPages = response.totalPages || 0;
          this.totalElements = response.totalElements || 0;

  // 🔹 Calcular comentarios sin responder para cada alojamiento
        this.loadUnrepliedCommentsCount();

        


          
        },
        error: (error) => {
          // Este error NO debería ejecutarse porque catchError lo maneja
          console.error('Error en subscribe (no debería llegar aquí):', error);
        }
      });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadAccommodations();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadAccommodations();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadAccommodations();
    }
  }

  viewAccommodationDetail(id: number): void {
    this.router.navigate(['/accommodation-host', id]);
  }

  viewReservations(id: number): void {
    this.router.navigate(['/alojamiento-reservas', id]);
  }

  editAccommodation(id: number): void {
    this.router.navigate(['/editar-alojamiento', id]);
  }

  deleteAccommodation(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el alojamiento',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.accommodationService.delete(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El alojamiento ha sido eliminado correctamente'
            });
            this.loadAccommodations();
          },
          error: (error) => {
            console.error('Error al eliminar:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el alojamiento'
            });
          }
        });
      }
    });
  }

  goToReservations(): void {
    this.router.navigate(['/reservation']);
  }

  createAccommodation(): void {
    this.router.navigate(['/crear-alojamiento']);
  }

  getPrimaryImage(accommodation: AccommodationDTO): string {
    const primaryImage = accommodation.images?.find(img => img.isPrimary);
    return (
      primaryImage?.url ||
      accommodation.images?.[0]?.url ||
      'https://placehold.co/400x300/e0e0e0/757575?text=Sin+Imagen'
    );
  }

openComments(accommodationId: number): void {
  this.router.navigate(['/host-comments', accommodationId]);
}

  private loadUnrepliedCommentsCount(): void {
  if (this.accommodations.length === 0) {
    return;
  }

  // Crear observables para cada alojamiento
  const commentRequests = this.accommodations.map(accommodation => 
    this.commentService.getByAccommodation(accommodation.id, 0, 100).pipe(
      map(response => ({
        accommodationId: accommodation.id,
        unrepliedCount: response.content.filter(comment => 
          !comment.hostReply || !comment.hostReply.text || comment.hostReply.text.trim() === ''
        ).length
      })),
      catchError(error => {
        console.error(`Error al cargar comentarios para alojamiento ${accommodation.id}:`, error);
        return of({
          accommodationId: accommodation.id,
          unrepliedCount: 0
        });
      })
    )
  );

  // Ejecutar todas las peticiones en paralelo
  forkJoin(commentRequests).subscribe({
    next: (results) => {
      // Actualizar cada alojamiento con su conteo
      results.forEach(result => {
        const accommodation = this.accommodations.find(a => a.id === result.accommodationId);
        if (accommodation) {
          accommodation.unrepliedCommentsCount = result.unrepliedCount;
        }
      });
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      console.log('✅ Comentarios sin responder calculados:', this.accommodations);
    },
    error: (error) => {
      console.error('Error al calcular comentarios sin responder:', error);
      this.cdr.detectChanges();
    }
  });
}

} 