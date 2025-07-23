import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { DashboardComponent } from './dashboard/dashboard';
import { GestionZonasComponent } from './zonas/gestion-zonas/gestion-zonas';
import { CrearZonaComponent } from './zonas/crear-zona/crear-zona';
import { ListarZonasComponent } from './zonas/listar-zonas/listar-zonas';
import { GestionDeliveryComponent } from './delivery/gestion-delivery/gestion-delivery';
import { CrearDeliveryComponent } from './delivery/crear-delivery/crear-delivery.component';
import { ListarDeliveryComponent } from './delivery/listar-delivery/listar-delivery.component';
import { BuscarPorProximidadComponent } from './delivery/buscar-por-proximidad/buscar-por-proximidad.component';
import { BuscarPorZonaComponent } from './delivery/buscar-por-zona/buscar-por-zona.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'zonas/gestion', component: GestionZonasComponent },
    { path: 'zonas/crear', component: CrearZonaComponent },
    { path: 'zonas/listar', component: ListarZonasComponent },
    {
        path: 'delivery',
        children: [
            { path: '', redirectTo: 'gestion', pathMatch: 'full' },
            { path: 'gestion', component: GestionDeliveryComponent },
            { path: 'crear', component: CrearDeliveryComponent },
            { path: 'listar', component: ListarDeliveryComponent },
            { path: 'buscar-por-proximidad', component: BuscarPorProximidadComponent },
            { path: 'buscar-por-zona', component: BuscarPorZonaComponent }
        ]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' } // Wildcard route for a 404 page
];
