import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, DeliveryResponse, ZoneResponse } from '../../services/api.service';

@Component({
  selector: 'app-listar-delivery',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './listar-delivery.html',
  styleUrls: ['./listar-delivery.css']
})
export class ListarDeliveryComponent implements OnInit {
  showDeletePopup = false;
  showEditPopup = false;
  selectedDelivery: DeliveryResponse | null = null;
  allZones: ZoneResponse[] = [];
  deliveryStates = [
    { value: 'available', label: 'Disponible' },
    { value: 'in_route', label: 'En ruta' },
    { value: 'delivering', label: 'Entregando' },
    { value: 'waiting_for_order', label: 'Esperando pedido' },
    { value: 'unavailable', label: 'No disponible' },
    { value: 'with_issue', label: 'Con problemas' },
    { value: 'offline', label: 'Desconectado' }
  ];

  // Utilidad para mostrar el label amigable en la lista
  getStatusLabel(status: string): string {
    const found = this.deliveryStates.find(s => s.value === status);
    return found ? found.label : status;
  }
  // Use a map for efficient zone lookup during editing
  tempSelectedZones: { [key: number]: boolean } = {};
  editLatitude: number | null = null;
  editLongitude: number | null = null;

  deliveries: DeliveryResponse[] = [];
  // Client-side filtering for now. Ideally, this would be handled by the API.
  filteredDeliveries: DeliveryResponse[] = [];
  searchTerm: string = '';
  filterBy: string = 'all';

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;
  pages: number[] = [];

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadDeliveries();
    await this.loadAllZones();
  }

  async loadDeliveries(): Promise<void> {
    try {
      const pagination = { limit: this.itemsPerPage, offset: (this.currentPage - 1) * this.itemsPerPage };
      const response: any = await this.apiService.getDeliveries(pagination);
      const deliveriesArray = Array.isArray(response)
        ? response
        : response.deliveries ?? [];
      this.deliveries = deliveriesArray.map((delivery: any) => {
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
      this.totalItems = response.total ?? this.deliveries.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      // Si el filtro está vacío, mostrar todos los deliveries de la página
      this.applyFilter();
      this.updatePagesArray();
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  }

  async loadAllZones(): Promise<void> {
    try {
      // Fetch all zones for the dropdown in the edit popup
      const response = await this.apiService.getZones({ limit: 1000 }); // Assuming max 1000 zones
      this.allZones = response.zones;
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  }

  goBack(): void {
    this.router.navigate(['/delivery/gestion']);
  }

  getZoneNames(zones: ZoneResponse[] | undefined): string {
    if (!zones || zones.length === 0) {
      return 'N/A';
    }
    return zones.map(z => z.name).join(', ');
  }

  // Client-side filtering. For a large dataset, this should be done via API parameters.
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredDeliveries = [...this.deliveries];
    } else {
      // El filtrado se hace solo sobre los deliveries de la página actual
      this.filteredDeliveries = this.deliveries.filter(delivery => {
        const zoneNames = this.getZoneNames(delivery.zones).toLowerCase();
        const latitude = delivery.location?.latitude?.toString() ?? '';
        const longitude = delivery.location?.longitude?.toString() ?? '';
        const statusEn = delivery.status?.toLowerCase() ?? '';
        const statusEs = this.getStatusLabel(delivery.status).toLowerCase();
        const searchIn = {
          id: delivery.id?.toString() ?? '',
          status: statusEn + ' ' + statusEs,
          zone: zoneNames,
          latitude,
          longitude,
        };
        if (this.filterBy !== 'all') {
          return searchIn[this.filterBy as keyof typeof searchIn].includes(term);
        }
        return Object.values(searchIn).some(value => value.includes(term));
      });
    }
    // No recalcular totalPages aquí, ya que la paginación es del backend
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
    this.updatePagesArray();
  }

  async setPage(page: number): Promise<void> {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    await this.loadDeliveries();
  }

  updatePagesArray(): void {
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  editDelivery(delivery: DeliveryResponse): void {
    // Crear copia profunda para edición
    this.selectedDelivery = JSON.parse(JSON.stringify(delivery));
    this.tempSelectedZones = {};
    const selectedZoneIds = new Set((this.selectedDelivery?.zones ?? []).map(z => z.id));
    this.allZones.forEach(zone => {
      this.tempSelectedZones[zone.id] = selectedZoneIds.has(zone.id);
    });
    // Setear campos de edición para lat/lng
    this.editLatitude = this.selectedDelivery?.location?.latitude ?? null;
    this.editLongitude = this.selectedDelivery?.location?.longitude ?? null;
    this.showEditPopup = true;
  }

  deleteDelivery(delivery: DeliveryResponse): void {
    this.selectedDelivery = delivery;
    this.showDeletePopup = true;
  }

  async confirmDelete(): Promise<void> {
    if (this.selectedDelivery) {
      try {
        await this.apiService.deleteDelivery(this.selectedDelivery.id);
        await this.loadDeliveries();
        // Si la página actual queda vacía y no es la primera, retroceder hasta encontrar una página con datos o llegar a la primera
        while (this.filteredDeliveries.length === 0 && this.currentPage > 1) {
          this.currentPage--;
          await this.loadDeliveries();
        }
        // Si después de retroceder sigue vacía (por ejemplo, porque ya no hay deliveries), ir a la página 1 y recargar
        if (this.filteredDeliveries.length === 0 && this.currentPage !== 1) {
          this.currentPage = 1;
          await this.loadDeliveries();
        }
        this.closePopups();
      } catch (error) {
        console.error('Error deleting delivery:', error);
      }
    }
  }

  async saveChanges(): Promise<void> {
    if (this.selectedDelivery) {
      const deliveryId = this.selectedDelivery.id;
      try {
        // 1. Copiar los valores editados a selectedDelivery
        if (this.editLatitude !== null && this.editLongitude !== null) {
          this.selectedDelivery.location.latitude = this.editLatitude;
          this.selectedDelivery.location.longitude = this.editLongitude;
        }

        // 2. Actualizar status y ubicación (enviando lat/lng para el backend)
        const updateStatusPromise = this.apiService.updateStatus(deliveryId, { status: this.selectedDelivery.status });
        const updateLocationPromise = this.apiService.updateLocation(deliveryId, {
          location: {
            lat: this.selectedDelivery.location.latitude,
            lng: this.selectedDelivery.location.longitude
          }
        });

        // 3. Asignar zonas seleccionadas
        const zoneIds = Object.keys(this.tempSelectedZones)
          .filter(id => this.tempSelectedZones[+id])
          .map(id => +id);
        const assignZonesPromise = this.apiService.assignZonesToDelivery(deliveryId, zoneIds);

        // 4. Esperar a que terminen todas las actualizaciones
        await Promise.all([
          updateStatusPromise,
          updateLocationPromise,
          assignZonesPromise
        ]);

        // 5. Cerrar popup y refrescar la lista
        this.closePopups();
        await this.loadDeliveries();

      } catch (error) {
        console.error('Error saving changes:', error);
        // Optionally, show an error message to the user
      }
    }
  }

  closePopups(): void {
    this.showDeletePopup = false;
    this.showEditPopup = false;
    this.selectedDelivery = null;
    this.editLatitude = null;
    this.editLongitude = null;
  }
  
  // Getter para paginar los deliveries mostrados (ya no es necesario, pero se deja para compatibilidad)
  get pagedDeliveries(): DeliveryResponse[] {
    return this.filteredDeliveries;
  }
}
