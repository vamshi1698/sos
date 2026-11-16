export interface SceneSectionConfig {
  id: number;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  ambulancePos: [number, number, number];
  ambulanceRotY: number;
  speed: number;
  showTraffic: boolean;
  showLightTrails: boolean;
  showHospital: boolean;
  showRadar: boolean;
  showDispatchHolo: boolean;
}

export const SECTIONS_CONFIG: SceneSectionConfig[] = [
  {
    id: 1, // 01 Standby (Centered in Bay 07 stall, parallel to lane markings, 3/4 isometric camera)
    camPos: [6.4, 3.4, 7.2],
    lookAt: [-0.4, 0.9, 0.2],
    ambulancePos: [2.1, 0, 0.2],
    ambulanceRotY: 0,
    speed: 0,
    showTraffic: false,
    showLightTrails: false,
    showHospital: false,
    showRadar: false,
    showDispatchHolo: false,
  },
  {
    id: 2, // 02 Dispatch (Reference: media_1794816754881_75863ed9.jpg - Driving straight down the right lane)
    camPos: [5.8, 3.2, 6.4],
    lookAt: [-0.3, 0.85, 0.2],
    ambulancePos: [1.9, 0, 0.4],
    ambulanceRotY: 0,
    speed: 1.8,
    showTraffic: false,
    showLightTrails: false,
    showHospital: false,
    showRadar: false,
    showDispatchHolo: true,
  },
  {
    id: 3, // 03 Transit (High-angle aerial intersection view - Turning through junction following green arrows)
    camPos: [8.2, 6.8, 8.4],
    lookAt: [-0.2, 0.6, 0.3],
    ambulancePos: [2.0, 0, 0.8],
    ambulanceRotY: -0.15,
    speed: 2.0,
    showTraffic: true,
    showLightTrails: false,
    showHospital: false,
    showRadar: true,
    showDispatchHolo: false,
  },
  {
    id: 4, // 04 Protocol (Speeding straight down the highway lane)
    camPos: [5.4, 2.8, 6.0],
    lookAt: [-0.1, 0.8, 0.3],
    ambulancePos: [1.2, 0, 0.4],
    ambulanceRotY: 0,
    speed: 3.8,
    showTraffic: false,
    showLightTrails: false,
    showHospital: false,
    showRadar: false,
    showDispatchHolo: false,
  },
  {
    id: 5, // 05 Arrival (Reference: media_1794819686574_69836512.jpg)
    camPos: [6.6, 3.8, 6.6],
    lookAt: [-0.1, 2.0, 0.3],
    ambulancePos: [0.9, 0, 0.4],
    ambulanceRotY: -0.1,
    speed: 0,
    showTraffic: false,
    showLightTrails: false,
    showHospital: true,
    showRadar: false,
    showDispatchHolo: false,
  },
];
