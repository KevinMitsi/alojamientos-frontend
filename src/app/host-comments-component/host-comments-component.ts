import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommentService } from '../services/comment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-host-comments-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './host-comments-component.html',
  styleUrl: './host-comments-component.css'
})
export class HostCommentsComponent implements OnInit {
  accommodationId!: number;
  comments: any[] = [];
  replyTexts: { [commentId: number]: string } = {};

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly commentService = inject(CommentService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.accommodationId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('🏠 ID del alojamiento:', this.accommodationId);
    this.loadComments();
  }

  loadComments() {
  console.log('🔄 Cargando comentarios para alojamiento:', this.accommodationId);
  
  Swal.fire({
    title: 'Cargando comentarios...',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
    showConfirmButton: false
  });

  this.commentService.getByAccommodation(this.accommodationId, 0, 100).subscribe({
    next: (res) => {
      console.log('📥 Respuesta completa de la API:', res);
      
      // 🔹 Forzar creación de nuevo array para activar detección de cambios
      this.comments = [...(res.content || [])];
      
      // 🔹 Forzar detección de cambios inmediatamente
      this.cdr.detectChanges();
      
      Swal.close();
      
      if (this.comments.length === 0) {
        console.log('⚠️ No se encontraron comentarios para este alojamiento');
        Swal.fire({
          icon: 'info',
          title: 'Sin comentarios',
          text: 'Aún no hay comentarios para este alojamiento',
          confirmButtonColor: '#3085d6'
        });
      } else {
        console.log('✅ Comentarios cargados exitosamente:', this.comments.length);
      }
    },
    error: (error) => {
      console.error('❌ Error al cargar comentarios:', error);
      
      this.comments = [];
      this.cdr.detectChanges();
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.error?.message || 'No se pudieron cargar los comentarios',
        confirmButtonColor: '#d33'
      });
    }
  });
}

  sendReply(commentId: number) {
  const replyText = this.replyTexts[commentId];
  
  if (!replyText || replyText.trim() === '') {
    Swal.fire({
      icon: 'warning',
      title: 'Campo vacío',
      text: 'Por favor escribe una respuesta',
      confirmButtonColor: '#3085d6'
    });
    return;
  }

  console.log('📤 Enviando respuesta:', { commentId, replyText });

  Swal.fire({
    title: 'Enviando respuesta...',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
    showConfirmButton: false
  });

  this.commentService.reply(commentId, replyText.trim()).subscribe({
    next: () => {
      console.log('✅ Respuesta enviada exitosamente');
      delete this.replyTexts[commentId];
      
      Swal.fire({
        icon: 'success',
        title: '¡Respuesta enviada!',
        text: 'Tu respuesta ha sido publicada correctamente',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        // 🔹 CAMBIO IMPORTANTE: Forzar recarga completa
        this.comments = []; // Limpiar array primero
        this.cdr.detectChanges(); // Forzar actualización
        
        // Pequeño delay para asegurar que el backend procese la respuesta
        setTimeout(() => {
          this.loadComments();
        }, 300);
      });
    },
    error: (error) => {
      console.error('❌ Error al enviar respuesta:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.error?.message || 'No se pudo enviar la respuesta',
        confirmButtonColor: '#d33'
      });
    }
  });
}

  goBack() {
    this.router.navigate(['/mis-alojamientos']);
  }
}