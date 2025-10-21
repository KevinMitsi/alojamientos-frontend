import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import mapboxgl, { LngLatLike, Map, Marker } from 'mapbox-gl';
import { CoordinatesDTO } from '../models/accommodation.model';

@Injectable({
  providedIn: 'root',
})
export class MapService implements OnDestroy {
  private map?: Map;
  private markers: Marker[] = [];
  private currentLocation: LngLatLike = [-75.6727, 4.53252];
  private readonly MAPBOX_TOKEN = 'pk.eyJ1IjoiZGFuMWVsMDEiLCJhIjoiY21oMDF1M2k3MDVzcDJsb2lsMDM2anI3aiJ9.W5DhMMXAokrfKTCDK-0bWQ';
  private destroy$ = new Subject<void>();

  constructor() {
    mapboxgl.accessToken = this.MAPBOX_TOKEN;
  }

  /** 
   * Inicializa el mapa dentro del contenedor especificado 
   * @param containerId - ID del contenedor HTML
   * @param coordinates - Coordenadas opcionales para centrar el mapa
   * @param zoom - Nivel de zoom inicial
   */
  public create(
    containerId: string = 'map', 
    coordinates?: CoordinatesDTO,
    zoom: number = 15
  ): void {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Contenedor con id "${containerId}" no encontrado`);
      return;
    }

    if (this.map) {
      this.map.remove();
    }

    // Usar coordenadas proporcionadas o la ubicación por defecto
    const center: LngLatLike = coordinates 
      ? [coordinates.lng, coordinates.lat] 
      : this.currentLocation;

    this.map = new mapboxgl.Map({
      container: containerId,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
    });

    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      })
    );
  }

  /**
   * Agrega un marcador en las coordenadas especificadas
   * @param coordinates - Coordenadas del marcador
   * @param title - Título para el popup
   * @param description - Descripción adicional
   */
  public addMarker(
    coordinates: CoordinatesDTO,
    title: string,
    description?: string
  ): void {
    if (!this.map) {
      console.error('El mapa no ha sido inicializado');
      return;
    }

    // Limpiar marcadores anteriores
    this.clearMarkers();

    const popupHtml = `
      <div style="padding: 10px; max-width: 250px;">
        <strong style="font-size: 16px; display: block; margin-bottom: 8px;">${title}</strong>
        ${description ? `<p style="margin: 0; color: #666; font-size: 14px;">${description}</p>` : ''}
      </div>
    `;

    const marker = new mapboxgl.Marker({ color: '#0d6efd' })
      .setLngLat([coordinates.lng, coordinates.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml))
      .addTo(this.map);

    this.markers.push(marker);

    // Centrar el mapa en el marcador con animación
    this.map.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: 15,
      duration: 1500
    });
  }

  /**
   * Limpia todos los marcadores del mapa
   */
  public clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  /** 
   * Devuelve el mapa actual (si existe) 
   */
  public get mapInstance(): Map | undefined {
    return this.map;
  }

  /** 
   * Limpieza al destruir el servicio 
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearMarkers();
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}