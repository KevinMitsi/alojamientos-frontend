
export interface CreateReservationDTO {
  accommodationId: number;
  startDate: string; // formato ISO: YYYY-MM-DD
  endDate: string;
  guests: number;
}

export interface ReservationDTO {
comment: any;
  id: number;
  accommodationId: number;
  userId: number;
  hostId: number;
  startDate: string;
  endDate: string;
  nights: number;
  totalPrice: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt?: string;
  canceladoAt?: string;
  motivoCancelacion?: string;
  canceladoPor?: string;

  accommodationName?: string; 
  imageUrl?: string;  
  guests?: number; 
}

export interface ReservationSearchCriteria {
  userId?: number;
  hostId?: number;
  accommodationId?: number;
  status?: ReservationStatus;
  dateRange?: DateRange;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';
