# AccommodationService

Servicio Angular para consumir la API REST de alojamientos del backend.

## Endpoints implementados

### 🔓 Públicos (no requieren autenticación)

#### `search(criteria, page, size, sort)`
Buscar alojamientos con filtros y paginación. Ahora retorna `AccommodationFoundDTO` (versión ligera).

**Ejemplo:**
```typescript
const criteria: AccommodationSearchCriteria = {
  cityId: 1,
  startDate: '2025-01-15',
  endDate: '2025-01-20',
  guests: 2,
  minPrice: 50,
  maxPrice: 200,
  services: ['WiFi', 'Piscina']
};

accommodationService.search(criteria, 0, 10, 'pricePerNight,asc')
  .subscribe(response => {
    console.log('Total elementos:', response.totalElements);
    console.log('Alojamientos:', response.content);
    // response.content es AccommodationFoundDTO[]
  });
```

**Respuesta (AccommodationFoundDTO):**
```json
{
  "id": 1,
  "title": "Apartamento Moderno en El Poblado",
  "primaryImageUrl": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
  "avgRating": 4.5
}
```

#### `findById(accommodationId)`
Obtener un alojamiento por su ID.

**Ejemplo:**
```typescript
accommodationService.findById(1)
  .subscribe(accommodation => {
    console.log('Alojamiento:', accommodation);
  });
```

#### `getMetrics(accommodationId, startDate?, endDate?)`
Obtener métricas de un alojamiento.

**Ejemplo:**
```typescript
accommodationService.getMetrics(1, '2025-01-01', '2025-12-31')
  .subscribe(metrics => {
    console.log('Total reservas:', metrics.totalBookings);
    console.log('Tasa de ocupación:', metrics.occupancyRate);
  });
```

---

### 🔒 Protegidos (requieren autenticación y rol HOST)

#### `create(dto)`
Crear un nuevo alojamiento.

**Ejemplo:**
```typescript
const newAccommodation: CreateAccommodationDTO = {
  title: 'Apartamento céntrico',
  description: 'Hermoso apartamento en el centro',
  pricePerNight: 120,
  maxGuests: 4,
  cityId: 1,
  services: ['WiFi', 'Aire acondicionado', 'Cocina']
};

accommodationService.create(newAccommodation)
  .subscribe(response => {
    console.log('ID creado:', response.id);
    console.log('Mensaje:', response.message);
  });
```

#### `update(accommodationId, dto)`
Actualizar un alojamiento existente (solo el propietario).

**Ejemplo:**
```typescript
const updates: UpdateAccommodationDTO = {
  title: 'Nuevo título',
  pricePerNight: 150
};

accommodationService.update(1, updates)
  .subscribe(updated => {
    console.log('Alojamiento actualizado:', updated);
  });
```

#### `delete(accommodationId)`
Eliminar un alojamiento (soft delete, solo el propietario).

**Ejemplo:**
```typescript
accommodationService.delete(1)
  .subscribe(() => {
    console.log('Alojamiento eliminado');
  });
```

#### `findByHost(page, size)`
Obtener todos los alojamientos del host autenticado.

**Ejemplo:**
```typescript
accommodationService.findByHost(0, 10)
  .subscribe(response => {
    console.log('Mis alojamientos:', response.content);
  });
```

#### `uploadImages(accommodationId, files, primary)`
Subir imágenes a un alojamiento (solo el propietario).

**Ejemplo:**
```typescript
const files: File[] = [file1, file2, file3];

accommodationService.uploadImages(1, files, false)
  .subscribe(urls => {
    console.log('URLs de imágenes subidas:', urls);
  });
```

#### `deleteImage(accommodationId, imageId)`
Eliminar una imagen de un alojamiento (solo el propietario).

**Ejemplo:**
```typescript
accommodationService.deleteImage(1, 5)
  .subscribe(() => {
    console.log('Imagen eliminada');
  });
```

---

## Modelos TypeScript

### `AccommodationFoundDTO` (versión ligera para búsqueda)
```typescript
interface AccommodationFoundDTO {
  id: number;
  title: string;
  primaryImageUrl: string | null;
  avgRating: number;
  pricePerNight?: number; // Opcional: agregar al backend si es necesario
}
```

### `AccommodationDTO`
```typescript
interface AccommodationDTO {
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
}
```

### `CityDTO`
```typescript
interface CityDTO {
  id: number;
  name: string;
  country?: string;
}
```

### `CoordinatesDTO`
```typescript
interface CoordinatesDTO {
  latitude: number;
  longitude: number;
}
```

### `ImageDTO`
```typescript
interface ImageDTO {
  id: number;
  url: string;
  publicId: string;
  isPrimary: boolean;
}
```

### `AccommodationSearchCriteria`
```typescript
interface AccommodationSearchCriteria {
  cityId?: number; // Opcional: si no se envía, devuelve todos los alojamientos
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  services?: string[];
}
```

### `CreateAccommodationDTO`
```typescript
interface CreateAccommodationDTO {
  title: string;
  description: string;
  city: number; // ID de la ciudad
  coordinates: CoordinatesDTO;
  address: string;
  pricePerNight: number;
  services: string[];
  maxGuests: number;
}
```

### `UpdateAccommodationDTO`
```typescript
interface UpdateAccommodationDTO {
  title: string;
  description: string;
  address: string;
  coordinates: CoordinatesDTO;
  pricePerNight: number;
  services: string[];
  maxGuests: number;
  active: boolean;
}
```

### `AccommodationMetrics`
```typescript
interface AccommodationMetrics {
  totalReservations: number;
  averageRating: number;
  totalRevenue: number;
}
```

### `PageResponse<T>`
```typescript
interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
```

---

## Configuración

El servicio usa por defecto la ruta relativa `/api/accommodations` y un proxy de Angular para
redirigir al backend en desarrollo.

- Proxy: `proxy.conf.json`
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

En `angular.json` está configurado `proxyConfig` en `serve:development` para que
las peticiones a `/api` se envíen al backend automáticamente.

Si prefieres no usar proxy, cambia `baseUrl` en el servicio a
`http://localhost:8080/api/accommodations`.

---

## Autenticación

Los endpoints protegidos requieren un token JWT en el header `Authorization: Bearer <token>`.

Configura un interceptor HTTP para agregar automáticamente el token a las peticiones.

---

## Manejo de errores

Todos los métodos retornan `Observable`, así que puedes manejar errores con el operador `catchError` de RxJS:

```typescript
import { catchError, of } from 'rxjs';

accommodationService.search(criteria)
  .pipe(
    catchError(error => {
      console.error('Error:', error);
      return of({ content: [], totalElements: 0 } as PageResponse<AccommodationDTO>);
    })
  )
  .subscribe(response => {
    // Manejar respuesta
  });
```
