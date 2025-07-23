import { Injectable } from "@angular/core";
import { axiosService } from "./axiosClient";
import { config } from "../config/env";

// --- Common Interfaces ---
export interface LocationDto {
  latitude: number;
  longitude: number;
}

export interface PaginationDto {
  limit?: number;
  offset?: number;
}

export interface ProximityDto {
  latitude: number;
  longitude: number;
  radius: number;
}

// --- Zone Interfaces ---
export interface CreateZoneDto {
  name: string;
  location: { lat: number; lng: number };
  radius: number;
}

export interface UpdateZoneDto {
  name?: string;
  location?: { lat: number; lng: number };
  radius?: number;
}

export interface ZoneResponse {
  id: number;
  name: string;
  location: { lat: number; lng: number };
  radius: number;
}

export interface PaginatedZoneResponse {
  zones: ZoneResponse[];
  total: number;
  limit?: number;
  offset?: number;
  totalPages?: number;
  currentPage?: number;
}

// --- Delivery Interfaces ---
export interface CreateDeliveryDto {
  personId: number;
  location: LocationDto;
  radius: number;
}

export interface UpdateDeliveryLocationDto {
  location: { lat: number; lng: number; };
}

export interface UpdateDeliveryStatusDto {
  status: string;
}

export interface DeliveryResponse {
  id: number;
  personId: number;
  location: LocationDto;
  radius: number;
  status: string;
  zones: ZoneResponse[];
}

export interface PaginatedDeliveryResponse {
  deliveries: DeliveryResponse[];
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
  currentPage: number;
}

@Injectable({
  providedIn: "root",
})
export class ApiService {
  // --- Delivery Interfaces ---
   async getDeliveries(
    pagination: PaginationDto = {},
    zoneId?: number
  ): Promise<PaginatedDeliveryResponse> {
    try {
      const { limit = 10, offset = 0 } = pagination;
      const params: any = { limit, offset };

      if (zoneId !== undefined) {
        params.zoneId = zoneId;
      }

      const response = await axiosService.get<PaginatedDeliveryResponse>(
        config.urls.getDelivery,
        {
          params,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error al obtener deliveries:", error);
      throw new Error(
        error.response?.data?.message || "Error al cargar los deliveries"
      );
    }
  }

  // Asignar zonas a un delivery
  /**
   * Asigna zonas a un delivery. Si zoneIds está vacío y se pasan previousZoneIds, elimina cada zona asociada previamente.
   * @param deliveryId ID del delivery
   * @param zoneIds IDs de zonas seleccionadas actualmente
   * @param previousZoneIds IDs de zonas que tenía el delivery antes de editar (opcional)
   */
  public async assignZonesToDelivery(deliveryId: number, zoneIds: number[], previousZoneIds?: number[]): Promise<void> {
    try {
      if (Array.isArray(zoneIds) && zoneIds.length === 0 && Array.isArray(previousZoneIds) && previousZoneIds.length > 0) {
        // Si no hay zonas seleccionadas, elimina cada zona que tenía el delivery antes
        for (const zoneId of previousZoneIds) {
          await axiosService.delete(`${config.urls.createDelivery}/${deliveryId}/zone/${zoneId}`);
        }
      } else {
        // Si hay zonas, asigna normalmente
        await axiosService.post(`${config.urls.createDelivery}/${deliveryId}/assignZone`, { zoneIds });
      }
    } catch (error: any) {
      console.error('Error al asignar zonas:', error);
      throw new Error(error.response?.data?.message || 'Error al asignar zonas');
    }
  }

  async getDeliveryById(id: number): Promise<DeliveryResponse> {
    try {
      const response = await axiosService.get<DeliveryResponse>(config.urls.getDeliveryById(id));
      return response.data;
    } catch (error: any) {
      console.error("Error al obtener delivery:", error);
      throw new Error(error.response?.data?.message || "Error al cargar el delivery");
    }
  }
  async findByProximity(lat: number, lng: number, radius: number): Promise<DeliveryResponse[]> {
    try {
      const response = await axiosService.get<DeliveryResponse[]>(`${config.urls.getDeliveryByProximity}?lat=${lat}&lng=${lng}&radius=${radius}`);
      return response.data;
    } catch (error: any) {
      console.error("Error al obtener deliveries por proximidad:", error);
      throw new Error(error.response?.data?.message || "Error al cargar los deliveries por proximidad");
    }
  }

  async createDelivery(deliveryData: CreateDeliveryDto): Promise<DeliveryResponse> {
    try {
      const response = await axiosService.post<DeliveryResponse>(config.urls.createDelivery, deliveryData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Error de validación: ${error.response.data?.message || "Datos inválidos"}`);
      }
      throw new Error(error.response?.data?.message || "Error al crear el delivery");
    }
  }

  async deleteDelivery(id: number): Promise<void> {
    try {
      await axiosService.delete(config.urls.deleteDelivery(id));
    } catch (error: any) {
      console.error("Error al eliminar delivery:", error);
      throw new Error(error.response?.data?.message || "Error al eliminar el delivery");
    }
  }

  async updateLocation(id: number, locationData: UpdateDeliveryLocationDto): Promise<DeliveryResponse> {
    try {
      const response = await axiosService.put<DeliveryResponse>(config.urls.updateLocation(id), locationData);
      return response.data;
    } catch (error: any) {
      console.error("Error al actualizar ubicación:", error);
      throw new Error(error.response?.data?.message || "Error al actualizar la ubicación");
    }
  }

  async updateStatus(id: number, statusData: UpdateDeliveryStatusDto): Promise<DeliveryResponse> {
    try {
      const response = await axiosService.put<DeliveryResponse>(config.urls.updateStatus(id), statusData);
      return response.data;
    } catch (error: any) {
      console.error("Error al actualizar estado:", error);
      throw new Error(error.response?.data?.message || "Error al actualizar el estado");
    }
  }

  // Eliminada la versión que acepta solo el número, ahora solo acepta el objeto
  async getDeliveriesByZone(params: { zoneId: number }): Promise<DeliveryResponse[]> {
    try {
      const response = await axiosService.post(config.urls.getDeliveryByZone, params);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener deliveries por zona:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar los deliveries por zona');
    }
  }

  async getDeliveriesByProximity(lat: number, lng: number, radius: number): Promise<DeliveryResponse[]> {
    try {
      const payload = {
        location: { lat, lng },
        radius,
      };
      // Enviar el body directamente, no dentro de 'data'
      const response = await axiosService.post<DeliveryResponse[]>(config.urls.getDeliveryByProximity, payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // No redirigir, solo lanzar mensaje especial
        throw new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
      }
      console.error("Error al obtener repartidores por proximidad:", error);
      throw new Error(error.response?.data?.message || "Error al cargar los repartidores por proximidad");
    }
  }

  // --- Zone Methods ---

  async getZones(pagination: PaginationDto = {}): Promise<PaginatedZoneResponse> {
    try {
      const { limit = 10, offset = 0 } = pagination;
      const response = await axiosService.get<PaginatedZoneResponse>(config.urls.getZones, {
        params: { limit, offset },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error al obtener zonas:", error);
      throw new Error(error.response?.data?.message || "Error al cargar las zonas");
    }
  }

  async getZoneById(id: number): Promise<ZoneResponse> {
    try {
      const response = await axiosService.get<ZoneResponse>(config.urls.getZoneById(id));
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener la zona ${id}:`, error);
      throw new Error(error.response?.data?.message || "Error al cargar la zona");
    }
  }

  async createZone(zoneData: CreateZoneDto): Promise<ZoneResponse> {
    try {
      const response = await axiosService.post<ZoneResponse>(config.urls.createZone, zoneData);
      return response.data;
    } catch (error: any) {
      console.error("Error al crear zona:", error);
      throw new Error(error.response?.data?.message || "Error al crear la zona");
    }
  }

  async updateZone(id: number, zoneData: UpdateZoneDto): Promise<ZoneResponse> {
    try {
      const response = await axiosService.put<ZoneResponse>(config.urls.updateZone(id), zoneData);
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar la zona ${id}:`, error);
      throw new Error(error.response?.data?.message || "Error al actualizar la zona");
    }
  }

  async deleteZone(id: number): Promise<void> {
    try {
      await axiosService.delete(config.urls.deleteZone(id));
    } catch (error: any) {
      console.error(`Error al eliminar la zona ${id}:`, error);
      throw new Error(error.response?.data?.message || "Error al eliminar la zona");
    }
  }
}