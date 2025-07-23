import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CreateDeliveryDto } from '../../services/api.service';

@Component({
  selector: 'app-crear-delivery',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './crear-delivery.html',
  styleUrls: ['./crear-delivery.css']
})
export class CrearDeliveryComponent {
  // Keep the model structure similar to avoid breaking the template
  deliveryData = {
    personId: null as number | null,
    radius: null as number | null,
    latitude: null as number | null,
    longitude: null as number | null,
  };
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}

  goBack(): void {
    this.router.navigate(['/delivery/gestion']);
  }

  async createDelivery(): Promise<void> {
    this.errorMessage = null;
    // Forzar parseo a número
    const personId = Number(this.deliveryData.personId);
    const radius = Number(this.deliveryData.radius);
    const latitude = Number(this.deliveryData.latitude);
    const longitude = Number(this.deliveryData.longitude);

    if (
      isNaN(personId) ||
      isNaN(radius) ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      this.errorMessage = 'Todos los campos son obligatorios y deben ser números válidos.';
      return;
    }

    const deliveryDto: any = {
      personId,
      radius,
      location: {
        lat: latitude,
        lng: longitude,
      },
    };

    try {
      await this.apiService.createDelivery(deliveryDto);
      this.router.navigate(['/delivery/gestion']);
    } catch (error: any) {
      console.error('Error creating delivery:', error);
      // Manejo de errores personalizado
      if (error?.message && error.message.includes('location')) {
        this.errorMessage = 'Error en la ubicación: Verifica que los campos sean números válidos.';
      } else if (error?.message && error.message.includes('personId')) {
        this.errorMessage = 'El ID de persona no es válido o no existe.';
      } else {
        this.errorMessage = 'Error al crear el repartidor. Verifique que los datos sean correctos e intente nuevamente.';
      }
    }
  }
}
