  // Formatea el radio: sin decimales si es entero, con 3 decimales si no
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService, DeliveryResponse, ZoneResponse } from '../../services/api.service';

@Component({
  selector: 'app-buscar-por-proximidad',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './buscar-por-proximidad.html',
  styleUrls: ['./buscar-por-proximidad.css']
})
export class BuscarPorProximidadComponent {
  lat: number | null = null;
  long: number | null = null;
  radius: number | null = null;
  searchPerformed = false;
  errorMessage: string | null = null;

  deliveries: DeliveryResponse[] = [];
  
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;
  pages: number[] = [];

  constructor(private apiService: ApiService, private router: Router) {}

  goBack(): void {
    this.router.navigate(['/delivery/gestion']);
  }

  getZoneNames(zones: ZoneResponse[]): string {
    if (!zones || zones.length === 0) {
      return 'N/A';
    }
    return zones.map(z => z.name).join(', ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Disponible':
        return 'status-disponible';
      case 'En viaje':
        return 'status-en-viaje';
      case 'No disponible':
        return 'status-no-disponible';
      default:
        return '';
    }
  }

  async searchByProximity(): Promise<void> {
    this.searchPerformed = true;
    this.currentPage = 1;
    this.deliveries = [];
    this.totalPages = 0;
    this.totalItems = 0;
    this.errorMessage = null; // Clear error before starting
    await this.loadDeliveries();
  }

  async loadDeliveries(): Promise<void> {
    if (!this.searchPerformed) return;

    this.errorMessage = null;

    // Validación estricta
    const lat = parseFloat(String(this.lat));
    const long = parseFloat(String(this.long));
    const radius = parseFloat(String(this.radius));

    if (isNaN(lat) || lat < -90 || lat > 90) {
      this.errorMessage = 'La latitud debe ser un número válido entre -90 y 90.';
      return;
    }
    if (isNaN(long) || long < -180 || long > 180) {
      this.errorMessage = 'La longitud debe ser un número válido entre -180 y 180.';
      return;
    }
    if (isNaN(radius) || radius <= 0) {
      this.errorMessage = 'El radio debe ser un número positivo.';
      return;
    }

    // Enviar el DTO correcto al backend
    try {
      const results = await this.apiService.getDeliveriesByProximity(lat, long, radius);
      // Adaptar location para que siempre tenga latitude y longitude (aceptando JSON string o formato objeto)
      this.deliveries = results.map((delivery: any) => {
        let loc = delivery.location;
        if (typeof loc === 'string') {
          try {
            loc = JSON.parse(loc);
          } catch {
            loc = {};
          }
        }
        if (loc && typeof loc === 'object') {
          if ('lat' in loc && 'lng' in loc) {
            return {
              ...delivery,
              location: {
                latitude: loc.lat,
                longitude: loc.lng
              }
            };
          }
          if ('latitude' in loc && 'longitude' in loc) {
            return {
              ...delivery,
              location: {
                latitude: loc.latitude,
                longitude: loc.longitude
              }
            };
          }
        }
        return {
          ...delivery,
          location: { latitude: '', longitude: '' }
        };
      });

      if (this.deliveries.length === 0) {
        this.errorMessage = 'No se encontraron repartidores en la proximidad indicada.';
      }

      this.totalItems = this.deliveries.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      this.currentPage = 1;
      this.updatePagesArray();

    } catch (error: any) {
      console.error('Error en la búsqueda por proximidad:', error);
      if (error?.response?.data?.message) {
        this.errorMessage = `Error del servidor: ${error.response.data.message}`;
      } else if (error?.message) {
        this.errorMessage = error.message;
      } else {
        this.errorMessage = 'Ocurrió un error inesperado al realizar la búsqueda.';
      }
      this.deliveries = [];
    }
  }

  async setPage(page: number): Promise<void> {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      await this.loadDeliveries();
    }
  }

  updatePagesArray(): void {
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  // Formatea el radio: sin decimales si es entero, con 3 decimales si no
  formatRadius(value: number): string {
    if (value == null) return '';
    return Number(value) % 1 === 0 ? Number(value).toString() : Number(value).toFixed(3);
  }
}
