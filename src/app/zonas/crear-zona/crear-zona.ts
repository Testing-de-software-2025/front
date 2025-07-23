import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CreateZoneDto } from '../../services/api.service';

@Component({
  selector: 'app-crear-zona',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './crear-zona.html',
  styleUrls: ['./crear-zona.css']
})
export class CrearZonaComponent {
  
  // Keep model structure similar to avoid breaking template bindings
  zoneData = {
    nombre: '',
    lat: null as number | null,
    lng: null as number | null,
    radio: null as number | null
  };
  errorMessage: string | null = null;

  constructor(private router: Router, private apiService: ApiService) {}

  goBack(): void {
    this.router.navigate(['/zonas/gestion']);
  }

  async createZone(): Promise<void> {
    this.errorMessage = null;
    if (
      !this.zoneData.nombre ||
      this.zoneData.lat === null ||
      this.zoneData.lng === null ||
      this.zoneData.radio === null
    ) {
      this.errorMessage = 'Todos los campos son obligatorios.';
      return;
    }

    const zoneDto: CreateZoneDto = {
      name: this.zoneData.nombre,
      location: {
        lat: this.zoneData.lat,
        lng: this.zoneData.lng,
      },
      radius: this.zoneData.radio,
    };


    try {
      await this.apiService.createZone(zoneDto);
      this.router.navigate(['/zonas/gestion']); // Redirect on success
    } catch (error: any) {
      console.error('Error creating zone:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        this.errorMessage = 'No tienes permiso para crear zonas. Por favor, contacta a un administrador.';
      } else {
        this.errorMessage = error.message || 'Ocurrió un error al crear la zona.';
      }
    }
  }
}
