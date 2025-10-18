import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CommentDTO,
  CreateCommentDTO,
  ReplyCommentDTO,
  CommentPageResponse
} from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/comments';

  /**
   * Obtener todos los comentarios de un alojamiento (público)
   * @param accommodationId - ID del alojamiento
   * @param page - Número de página (0-indexed)
   * @param size - Tamaño de página
   * @returns Comentarios paginados
   */
  getByAccommodation(
    accommodationId: number,
    page: number = 0,
    size: number = 10
  ): Observable<CommentPageResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc'); // Ordenar por fecha descendente (más recientes primero)

    return this.http.get<CommentPageResponse>(
      `${this.baseUrl}/accommodation/${accommodationId}`,
      { params }
    );
  }

  /**
   * Crear un nuevo comentario (requiere autenticación)
   * @param reservationId - ID de la reserva completada
   * @param dto - Datos del comentario (rating y texto)
   */
  create(reservationId: number, dto: CreateCommentDTO): Observable<CommentDTO> {
    return this.http.post<CommentDTO>(
      `${this.baseUrl}/reservation/${reservationId}`,
      dto
    );
  }

  /**
   * Responder a un comentario (solo anfitrión, requiere autenticación)
   * @param commentId - ID del comentario a responder
   * @param dto - Texto de la respuesta
   */
  reply(commentId: number, dto: ReplyCommentDTO): Observable<CommentDTO> {
    return this.http.post<CommentDTO>(
      `${this.baseUrl}/${commentId}/reply`,
      dto
    );
  }

  /**
   * Eliminar un comentario (solo el autor o admin)
   * @param commentId - ID del comentario a eliminar
   */
  delete(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${commentId}`);
  }

  /**
   * Obtener comentarios de un usuario específico
   * @param userId - ID del usuario
   * @param page - Número de página
   * @param size - Tamaño de página
   */
  getByUser(
    userId: number,
    page: number = 0,
    size: number = 10
  ): Observable<CommentPageResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<CommentPageResponse>(
      `${this.baseUrl}/user/${userId}`,
      { params }
    );
  }
}