// DTOs auxiliares
export interface CityDTO {
  id: number;
  name: string;
  country?: string;
}

export interface CoordinatesDTO {
  lat: number;
  lng: number;
}

export interface ImageDTO {
  id: number;
  url: string;
  thumbnailUrl: string;
  isPrimary: boolean;
  createdAt: string;
}

// DTO principal de Alojamiento
export interface AccommodationDTO {
  id: number;
  hostId: number;
  title: string;
  description: string;
  city: CityDTO;
  address: string;
  coordinates: CoordinatesDTO;
  pricePerNight: number;
  services: string[];
  images: ImageDTO[];
  maxGuests: number;
  active: boolean;
  softDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  countReservations: number;
  avgRating: number;

  unrepliedCommentsCount?: number;
}

// DTO para crear alojamiento
export interface CreateAccommodationDTO {
  title: string;
  description: string;
  city: number;
  coordinates: CoordinatesDTO;
  address: string;
  pricePerNight: number;
  services: string[];
  maxGuests: number;
}

// DTO de respuesta al crear alojamiento
export interface CreateAccommodationResponseDTO {
  id: number;
  hostId: number;
  title: string;
  description: string;
  city: CityDTO;
  address: string;
  coordinates: CoordinatesDTO;
  pricePerNight: number;
  services: string[];
  maxGuests: number;
  createdAt: string;
}

// DTO para actualizar alojamiento
export interface UpdateAccommodationDTO {
  title: string;
  description: string;
  address: string;
  coordinates: CoordinatesDTO;
  pricePerNight: number;
  services: string[];
  maxGuests: number;
  active: boolean;
}

// DTO para resultados de búsqueda (versión ligera)
export interface AccommodationFoundDTO {
  id: number;
  title: string;
  primaryImageUrl: string | null;
  avgRating: number;
  pricePerNight: number; 
}

// Criterios de búsqueda
export interface AccommodationSearchCriteria {
  cityName?: string;
  startDate?: string; // formato: YYYY-MM-DD
  endDate?: string; // formato: YYYY-MM-DD
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  services?: string[];
}

// Métricas de alojamiento
export interface AccommodationMetrics {
  totalReservations: number;
  averageRating: number;
  totalRevenue: number;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
