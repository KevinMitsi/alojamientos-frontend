import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import mapboxgl, { LngLatLike, Map, Marker, MapMouseEvent } from 'mapbox-gl';
import { MarkerDTO } from '../models/marker-dto';
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

  /** Inicializa el mapa dentro del contenedor especificado */
  public create(containerId: string = 'map'): void {
    if (this.map) {
      this.map.remove(); // Evita fugas si se recrea el mapa
    }

    this.map = new mapboxgl.Map({
      container: containerId,
      style: 'mapbox://styles/mapbox/standard',
      center: this.currentLocation,
      zoom: 17,
      pitch: 45,
    });

    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      })
    );
  }

  /** Dibuja varios marcadores con popup */
  public drawMarkers(places: MarkerDTO[]): void {
    if (!this.map) return;

    places.forEach(({ id, title, photoUrl, location }) => {
      const popupHtml = `
        <strong>${title}</strong>
        <div>
          <img src="${photoUrl}" alt="Imagen" style="width: 100px; height: 100px;">
        </div>
        <a href="/place/${id}">Ver más</a>
      `;

      new mapboxgl.Marker({ color: 'red' })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(popupHtml))
        .addTo(this.map!);
    });
  }

  /** Devuelve el mapa actual (si existe) */
  public get mapInstance(): Map | undefined {
    return this.map;
  }

  /** Limpieza al destruir el servicio */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }
}