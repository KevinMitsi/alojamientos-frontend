import { Routes } from '@angular/router';
import { MainPage } from './components/mainpage/mainpage';
import { AccommodationDetailComponent } from './components/accommodation-detail-component/accommodation-detail-component';

export const routes: Routes = [
  // Ruta principal - muestra la página principal con las cards
  {
    path: '',
    component: MainPage
  },
  // Ruta para ver el detalle de un alojamiento específico
  // :id es un parámetro dinámico que contendrá el ID del alojamiento
  {
    path: 'accommodation/:id',
    component: AccommodationDetailComponent
  },
  // Ruta wildcard - redirige cualquier ruta no encontrada a la página principal
  {
    path: '**',
    redirectTo: ''
  }
];