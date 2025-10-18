export interface ReplyHostDTO{
hostId: number;
text: string;
startDate?: string;

}

export interface CommentDTO {
  id: number;
  rating: number;
  text: string;
  startDate?: string;
  isModerated: boolean;
  reservationId: number;
  accommodationId: number;
  userId: number;
 userName?: string; 
  userAvatar?: string; 
  userLocation?: string; 
  hostReply?: ReplyHostDTO; 
}

export interface CreateCommentDTO{
rating: number; 
  text: string; 
}

export interface ReplyCommentDTO{
    text: string;
}

export interface CommentPageResponse {
  content: CommentDTO[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}