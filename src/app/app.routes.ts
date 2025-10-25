import { Routes } from '@angular/router';
import { MainPage } from './components/mainpage/mainpage';
import { AccommodationDetailComponent } from './components/accommodation-detail-component/accommodation-detail-component';
import { Login } from './components/login/login';
import { Register } from './components/register/register';  
import { Profile } from './components/profile/profile';

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
  // Ruta para login
  {
    path: 'login',
    component: Login
  },

  //Ruta para Register
  { path: 'register', component: Register },

  {
  path: 'profile',
  component: Profile
},

  // Ruta wildcard - redirige cualquier ruta no encontrada a la página principal
  {
    path: '**',
    redirectTo: ''
  }
];