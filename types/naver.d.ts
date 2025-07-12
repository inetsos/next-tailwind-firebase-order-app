// types/naver.d.ts
declare global {
  interface Window {
    naver: any;
  }

  namespace naver {
    namespace maps {
      class LatLng {
        constructor(lat: number, lng: number);
      }

      class Map {
        constructor(container: string | HTMLElement, options: any);
      }

      class Marker {
        constructor(options: any);
      }

      class InfoWindow {
        constructor(options: any);
        open(map: any, marker: any): void;
      }

      namespace Service {
        const Status: {
          OK: string;
          ERROR: string;
        };

        function geocode(
          options: { address: string },
          callback: (status: string, response: any) => void
        ): void;
      }
    }
  }
}
export {};
