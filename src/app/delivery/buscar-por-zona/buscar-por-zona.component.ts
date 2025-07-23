import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService, DeliveryResponse, ZoneResponse } from '../../services/api.service';

@Component({
  selector: 'app-buscar-por-zona',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './buscar-por-zona.html',
  styleUrls: ['./buscar-por-zona.css']
})
export class BuscarPorZonaComponent implements OnInit {
  allZones: ZoneResponse[] = [];
  deliveries: DeliveryResponse[] = [];
  selectedZoneId: number | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;
  pages: number[] = [];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadZones();
  }

  async loadZones(): Promise<void> {
    try {
      const response = await this.apiService.getZones({ limit: 1000 }); 
      this.allZones = response.zones;
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  }

  async onZoneChange(): Promise<void> {
    this.currentPage = 1;
    await this.loadDeliveries();
  }

  async loadDeliveries(): Promise<void> {
    if (this.selectedZoneId === null) {
      this.deliveries = [];
      this.totalPages = 0;
      this.totalItems = 0;
      this.updatePagesArray();
      return;
    }

    try {
      // Enviar el objeto como espera el backend
      const deliveriesRaw = await this.apiService.getDeliveriesByZone({ zoneId: this.selectedZoneId });
      // Adaptar location y asegurar zonas asociadas
      this.deliveries = deliveriesRaw.map((delivery: any) => {
        let loc = delivery.location;
        if (typeof loc === 'string') {
          try {
            loc = JSON.parse(loc);
          } catch {
            loc = {};
          }
        }
        let location = { latitude: '', longitude: '' };
        if (loc && typeof loc === 'object') {
          if ('lat' in loc && 'lng' in loc) {
            location = { latitude: loc.lat, longitude: loc.lng };
          } else if ('latitude' in loc && 'longitude' in loc) {
            location = { latitude: loc.latitude, longitude: loc.longitude };
          }
        }
        // Asegurar que zones sea array
        const zones = Array.isArray(delivery.zones) ? delivery.zones : [];
        return {
          ...delivery,
          location,
          zones
        };
      });
      this.totalItems = this.deliveries.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      this.currentPage = 1;
      this.updatePagesArray();
    } catch (error) {
      console.error('Error loading deliveries by zone:', error);
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

  getZoneNames(zones: ZoneResponse[]): string {
    if (!zones || zones.length === 0) {
      return 'N/A';
    }
    return zones.map(z => z.name).join(', ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Disponible': return 'status-disponible';
      case 'En viaje': return 'status-en-viaje';
      case 'No disponible': return 'status-no-disponible';
      default: return '';
    }
  }

  goBack(): void {
    this.router.navigate(['/delivery/gestion']);
  }
}
