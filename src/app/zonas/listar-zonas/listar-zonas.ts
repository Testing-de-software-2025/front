import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ZoneResponse, UpdateZoneDto } from '../../services/api.service';

@Component({
  selector: 'app-listar-zonas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './listar-zonas.html',
  styleUrls: ['./listar-zonas.css']
})
export class ListarZonasComponent implements OnInit {
  // Formatea el radio: sin decimales si es entero, con decimales solo si es necesario
  formatRadius(radius: number | string): string {
    const num = typeof radius === 'string' ? parseFloat(radius) : radius;
    if (Number.isInteger(num)) {
      return num.toString();
    }
    // Mostrar hasta 3 decimales solo si son significativos
    return num.toFixed(3).replace(/\.0+$/, '').replace(/(\.[1-9]*)0+$/, '$1');
  }
  isLoading = true;
  errorMessage: string | null = null;
  
  allZones: ZoneResponse[] = [];
  filteredZones: ZoneResponse[] = [];
  paginatedZones: ZoneResponse[] = [];
  searchTerm: string = '';
  filterBy: string = 'all';

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  pages: number[] = [];

  showDeletePopup = false;
  zoneToDelete: ZoneResponse | null = null;

  showEditPopup = false;
  editingZone: ZoneResponse | null = null;
  editingZoneData: any = {};

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadZones();
  }

  async loadZones(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      // TODO: Implement server-side filtering and pagination for better performance.
      // For now, fetching a large number of zones to filter on the client.
      const response = await this.apiService.getZones({ limit: 1000, offset: 0 });
      this.allZones = response.zones;
      this.filterZones();
    } catch (error: any) {
      this.errorMessage = error.message || 'Ocurrió un error al cargar las zonas.';
    } finally {
      this.isLoading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/zonas/gestion']);
  }

  filterZones(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredZones = [...this.allZones];
    } else {
      this.filteredZones = this.allZones.filter(zone => {
        const value = term;
        switch (this.filterBy) {
          case 'nombre':
            return zone.name.toLowerCase().includes(value);
          case 'id':
            return zone.id.toString().includes(value);
          case 'lat':
            return zone.location.lat.toString().includes(value);
          case 'long':
            return zone.location.lng.toString().includes(value);
          case 'radio':
            return zone.radius.toString().includes(value);
          default: // 'all'
            return (
              zone.name.toLowerCase().includes(value) ||
              zone.id.toString().includes(value) ||
              zone.location.lat.toString().includes(value) ||
              zone.location.lng.toString().includes(value) ||
              zone.radius.toString().includes(value)
            );
        }
      });
    }
    this.setPage(1); // Reset to first page after filtering
  }

  setPage(page: number): void {
    if (page < 1) return;
    this.currentPage = page;
    this.totalPages = Math.ceil(this.filteredZones.length / this.itemsPerPage);
    if (page > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedZones = this.filteredZones.slice(startIndex, endIndex);
  }

  openDeletePopup(zone: ZoneResponse): void {
    this.zoneToDelete = zone;
    this.showDeletePopup = true;
  }

  closeDeletePopup(): void {
    this.showDeletePopup = false;
    this.zoneToDelete = null;
  }

  async confirmDelete(): Promise<void> {
    if (!this.zoneToDelete) return;
    try {
      await this.apiService.deleteZone(this.zoneToDelete.id);
      this.closeDeletePopup();
      await this.loadZones(); // Refresca la lista después de borrar
    } catch (error: any) {
      // Si el error es 401/403, dejar que el interceptor maneje el logout
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        throw error;
      }
      // Si es otro error, mostrar mensaje y NO redirigir
      this.errorMessage = error.message || 'Error al eliminar la zona.';
      console.error('Error al eliminar la zona:', error);
    }
  }

  openEditPopup(zone: ZoneResponse): void {
    this.editingZone = zone;
    // Flatten the structure for the form model y formatear el radio
    this.editingZoneData = {
      id: zone.id,
      name: zone.name,
      lat: zone.location.lat,
      lng: zone.location.lng,
      radius: this.formatRadius(zone.radius),
    };
    this.showEditPopup = true;
  }

  closeEditPopup(): void {
    this.showEditPopup = false;
    this.editingZone = null;
  }

  async saveZone(): Promise<void> {
    if (!this.editingZone) {
      console.error('Save failed: No zone is selected for editing.');
      return;
    }

    const updateDto: UpdateZoneDto = {
      name: this.editingZoneData.name,
      location: {
        lat: this.editingZoneData.lat,
        lng: this.editingZoneData.lng,
      },
      radius: this.editingZoneData.radius,
    };

    try {
      await this.apiService.updateZone(this.editingZone.id, updateDto);
      this.closeEditPopup();
      await this.loadZones(); // Refresh the list
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al actualizar la zona.';
      console.error('Failed to update zone:', error);
    }
  }
}
