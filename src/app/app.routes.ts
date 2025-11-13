import { Routes } from '@angular/router';
import { MainPage } from './components/mainpage/mainpage';
import { AccommodationDetailComponent } from './components/accommodation-detail-component/accommodation-detail-component';
import { Login } from './components/login/login';
import { Register } from './components/register/register';  
import { Profile } from './components/profile/profile';
import { Reservations } from './components/reservations/reservations';
import { ConfigAccountComponent } from './components/config-account-component/config-account-component';
import { MyAccommodations } from './components/my-accommodations/my-accommodations';
import { CreateAccommodation } from './components/create-accommodation/create-accommodation';
import { EditAccommodation } from './components/edit-accommodation/edit-accommodation';
import { AccommodationReservations } from './components/accommodation-reservations/accommodation-reservations';
import { authGuard } from './guards/auth.guard';
import { hostGuard } from './guards/host.guard';

import { AccommodationDetailHost } from './components/accommodation-detail-host/accommodation-detail-host';
import { HostCommentsComponent } from './host-comments-component/host-comments-component';
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
  // Ruta para login (protegida para usuarios ya logueados)
  {
    path: 'login',
    component: Login,
    canActivate: [authGuard]
  },

  //Ruta para Register (protegida para usuarios ya logueados)
  { 
    path: 'register', 
    component: Register,
    canActivate: [authGuard]
  },

  { path: 'profile', component: Profile, runGuardsAndResolvers: 'always' },

   {path: 'reservation', component: Reservations},

   {path: 'configuracion', component: ConfigAccountComponent, runGuardsAndResolvers: 'always'},

   // Ruta para mis alojamientos (solo para hosts)
   {
     path: 'mis-alojamientos', 
     component: MyAccommodations, 
     canActivate: [hostGuard],
     runGuardsAndResolvers: 'always'
   },

   // Ruta para crear alojamiento (solo para hosts)
   {
     path: 'crear-alojamiento', 
     component: CreateAccommodation, 
     canActivate: [hostGuard],
     runGuardsAndResolvers: 'always'
   },

    // Ruta para ver métricas del alojamiento (solo para hosts)
    {
      path: 'accommodation-host/:id',
      component: AccommodationDetailHost,
      canActivate: [hostGuard],
      runGuardsAndResolvers: 'always'
    },

   // Ruta para editar alojamiento (solo para hosts)
   {
     path: 'editar-alojamiento/:id', 
     component: EditAccommodation, 
     canActivate: [hostGuard],
     runGuardsAndResolvers: 'always'
   },

   // Ruta para ver reservas de un alojamiento (solo para hosts)
   {
     path: 'alojamiento-reservas/:id', 
     component: AccommodationReservations, 
     canActivate: [hostGuard],
     runGuardsAndResolvers: 'always'
   },

  // Ruta wildcard - redirige cualquier ruta no encontrada a la página principal
  {
    path: '**',
    redirectTo: ''
  },

{
  path: 'host-comments/:id',
  component: HostCommentsComponent,
  canActivate: [hostGuard],
  runGuardsAndResolvers: 'always'
}

];