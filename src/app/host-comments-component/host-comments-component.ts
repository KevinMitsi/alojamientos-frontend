import { Component, inject, OnInit } from '@angular/core';
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

  ngOnInit() {
    this.accommodationId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadComments();
  }

  loadComments() {
    Swal.fire({
      title: 'Cargando comentarios...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      showConfirmButton: false
    });

    this.commentService.getByAccommodation(this.accommodationId, 0, 100).subscribe({
      next: (res) => {
        this.comments = res.content;
        Swal.close();
      },
      error: (error) => {
        console.error('Error al cargar comentarios:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los comentarios',
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

    Swal.fire({
      title: 'Enviando respuesta...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      showConfirmButton: false
    });

    this.commentService.reply(commentId, replyText.trim()).subscribe({
      next: () => {
        delete this.replyTexts[commentId];
        Swal.fire({
          icon: 'success',
          title: '¡Respuesta enviada!',
          text: 'Tu respuesta ha sido publicada correctamente',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          this.loadComments();
        });
      },
      error: (error) => {
        console.error('Error al enviar respuesta:', error);
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