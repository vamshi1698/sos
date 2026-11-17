import { supabase } from '@/lib/supabase';
import {
  BENGALURU_LOCATIONS,
  findNearestHospital,
  getCoordinatesForArea,
} from '@/data/locations';
import type {
  Ambulance,
  AmbulanceRequest,
  DispatchEvent,
  VehicleCategory,
  Network,
  AmbulanceStatus,
  Channel,
  RequestStatus,
} from '@/types';

interface AmbulanceRow {
  id: string;
  registration: string;
  operator: string;
  category: VehicleCategory;
  network: Network;
  status: AmbulanceStatus;
  area: string;
  last_gps_at: string;
}

interface RequestRow {
  id: string;
  channel: Channel;
  network: Network;
  pickup_area: string;
  pickup_note: string;
  patient_name: string;
  patient_phone: string;
  patient_age: number | null;
  description: string;
  category: VehicleCategory;
  status: RequestStatus;
  ambulance_id: string | null;
  declined_ambulance_ids: string[];
  alerts: string[];
  ai_captured: boolean;
  external_ref: string | null;
  created_at: string;
  stage_at: string;
}

interface EventRow {
  id: string;
  request_id: string | null;
  message: string;
  created_at: string;
}

const REQUEST_LIMIT = 200;
const EVENT_LIMIT = 100;

const DEFAULT_FLEET: Ambulance[] = [
  {
    id: 'amb-1',
    registration: 'KA-01-DEMO-101',
    operator: 'Lifeline Care (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'Jayanagar',
    lastGpsAt: Date.now() - 60000,
    coords: BENGALURU_LOCATIONS.Jayanagar.coords,
    speed: 0,
    heading: 90,
  },
  {
    id: 'amb-2',
    registration: 'KA-03-DEMO-202',
    operator: 'CityMed Transport (Sample)',
    category: 'BLS',
    network: 'private',
    status: 'available',
    area: 'Koramangala',
    lastGpsAt: Date.now() - 45000,
    coords: BENGALURU_LOCATIONS.Koramangala.coords,
    speed: 0,
    heading: 45,
  },
  {
    id: 'amb-3',
    registration: 'KA-05-DEMO-303',
    operator: 'Sanjeevani Fleet (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'Whitefield',
    lastGpsAt: Date.now() - 90000,
    coords: BENGALURU_LOCATIONS.Whitefield.coords,
    speed: 0,
    heading: 180,
  },
  {
    id: 'amb-4',
    registration: 'KA-51-DEMO-404',
    operator: 'Metro Response (Sample)',
    category: 'Patient Transport',
    network: 'private',
    status: 'available',
    area: 'Hebbal',
    lastGpsAt: Date.now() - 120000,
    coords: BENGALURU_LOCATIONS.Hebbal.coords,
    speed: 0,
    heading: 270,
  },
  {
    id: 'amb-5',
    registration: 'KA-53-DEMO-505',
    operator: 'Garden City Rescue (Sample)',
    category: 'BLS',
    network: 'private',
    status: 'available',
    area: 'BTM Layout',
    lastGpsAt: Date.now() - 30000,
    coords: BENGALURU_LOCATIONS['BTM Layout'].coords,
    speed: 0,
    heading: 0,
  },
  {
    id: 'amb-6',
    registration: 'KA-41-DEMO-606',
    operator: 'Tech Corridor Health (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'Electronic City',
    lastGpsAt: Date.now() - 25000,
    coords: BENGALURU_LOCATIONS['Electronic City'].coords,
    speed: 0,
    heading: 0,
  },
  {
    id: 'amb-7',
    registration: 'KA-02-DEMO-707',
    operator: 'Rajaji Medical Transport (Sample)',
    category: 'BLS',
    network: 'private',
    status: 'available',
    area: 'Rajajinagar',
    lastGpsAt: Date.now() - 15000,
    coords: BENGALURU_LOCATIONS.Rajajinagar.coords,
    speed: 0,
    heading: 135,
  },
  {
    id: 'amb-8',
    registration: 'KA-04-DEMO-808',
    operator: 'Manipal Rapid Response (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'Indiranagar',
    lastGpsAt: Date.now() - 20000,
    coords: BENGALURU_LOCATIONS.Indiranagar.coords,
    speed: 0,
    heading: 90,
  },
  {
    id: 'amb-9',
    registration: 'KA-04-DEMO-909',
    operator: 'East Bangalore BLS (Sample)',
    category: 'BLS',
    network: 'private',
    status: 'available',
    area: 'Indiranagar',
    lastGpsAt: Date.now() - 35000,
    coords: BENGALURU_LOCATIONS.Indiranagar.coords,
    speed: 0,
    heading: 180,
  },
  {
    id: 'amb-10',
    registration: 'KA-50-DEMO-110',
    operator: 'South Bangalore Cardiac EMS (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'JP Nagar',
    lastGpsAt: Date.now() - 40000,
    coords: BENGALURU_LOCATIONS['JP Nagar'].coords,
    speed: 0,
    heading: 45,
  },
  {
    id: 'amb-11',
    registration: 'KA-50-DEMO-111',
    operator: 'JP Nagar Community Care (Sample)',
    category: 'BLS',
    network: 'private',
    status: 'available',
    area: 'JP Nagar',
    lastGpsAt: Date.now() - 10000,
    coords: BENGALURU_LOCATIONS['JP Nagar'].coords,
    speed: 0,
    heading: 270,
  },
  {
    id: 'amb-12',
    registration: 'KA-02-DEMO-112',
    operator: 'SPARSH Polytrauma Unit (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'Yeshwanthpur',
    lastGpsAt: Date.now() - 18000,
    coords: BENGALURU_LOCATIONS.Yeshwanthpur.coords,
    speed: 0,
    heading: 90,
  },
  {
    id: 'amb-13',
    registration: 'KA-02-DEMO-113',
    operator: 'North Bangalore BLS (Sample)',
    category: 'BLS',
    network: 'private',
    status: 'available',
    area: 'Yeshwanthpur',
    lastGpsAt: Date.now() - 55000,
    coords: BENGALURU_LOCATIONS.Yeshwanthpur.coords,
    speed: 0,
    heading: 180,
  },
  {
    id: 'amb-14',
    registration: 'KA-01-DEMO-114',
    operator: 'Outer Ring Trauma Care (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'BTM Layout',
    lastGpsAt: Date.now() - 25000,
    coords: BENGALURU_LOCATIONS['BTM Layout'].coords,
    speed: 0,
    heading: 315,
  },
  {
    id: 'amb-15',
    registration: 'KA-03-DEMO-115',
    operator: 'St. Johns Cardiac Unit (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'Koramangala',
    lastGpsAt: Date.now() - 15000,
    coords: BENGALURU_LOCATIONS.Koramangala.coords,
    speed: 0,
    heading: 120,
  },
  {
    id: 'amb-16',
    registration: 'KA-05-DEMO-116',
    operator: 'Whitefield MedVan (Sample)',
    category: 'Patient Transport',
    network: 'private',
    status: 'available',
    area: 'Whitefield',
    lastGpsAt: Date.now() - 30000,
    coords: BENGALURU_LOCATIONS.Whitefield.coords,
    speed: 0,
    heading: 90,
  },
  {
    id: 'amb-17',
    registration: 'KA-51-DEMO-117',
    operator: 'Aster Critical Care Unit (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'Hebbal',
    lastGpsAt: Date.now() - 12000,
    coords: BENGALURU_LOCATIONS.Hebbal.coords,
    speed: 0,
    heading: 210,
  },
  {
    id: 'amb-18',
    registration: 'KA-02-DEMO-118',
    operator: 'Fortis West Emergency (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'Rajajinagar',
    lastGpsAt: Date.now() - 22000,
    coords: BENGALURU_LOCATIONS.Rajajinagar.coords,
    speed: 0,
    heading: 330,
  },
  {
    id: 'amb-19',
    registration: 'KA-41-DEMO-119',
    operator: 'Narayana Health City ALS (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'Electronic City',
    lastGpsAt: Date.now() - 14000,
    coords: BENGALURU_LOCATIONS['Electronic City'].coords,
    speed: 0,
    heading: 45,
  },
  {
    id: 'amb-20',
    registration: 'KA-01-DEMO-120',
    operator: 'Apollo Jayanagar Transit (Sample)',
    category: 'Patient Transport',
    network: 'private',
    status: 'available',
    area: 'Jayanagar',
    lastGpsAt: Date.now() - 50000,
    coords: BENGALURU_LOCATIONS.Jayanagar.coords,
    speed: 0,
    heading: 180,
  },
  {
    id: 'amb-21',
    registration: 'KA-03-DEMO-121',
    operator: 'City Med Dialysis Van (Sample)',
    category: 'Patient Transport',
    network: 'private',
    status: 'available',
    area: 'Koramangala',
    lastGpsAt: Date.now() - 40000,
    coords: BENGALURU_LOCATIONS.Koramangala.coords,
    speed: 0,
    heading: 60,
  },
  {
    id: 'amb-22',
    registration: 'KA-04-DEMO-122',
    operator: 'Indiranagar Critical Care (Sample)',
    category: 'ALS',
    network: 'private',
    status: 'available',
    area: 'Indiranagar',
    lastGpsAt: Date.now() - 10000,
    coords: BENGALURU_LOCATIONS.Indiranagar.coords,
    speed: 0,
    heading: 90,
  },
  {
    id: 'amb-23',
    registration: 'KA-04-DEMO-123',
    operator: 'Indiranagar Patient Transit (Sample)',
    category: 'Patient Transport',
    network: 'private',
    status: 'available',
    area: 'Indiranagar',
    lastGpsAt: Date.now() - 15000,
    coords: BENGALURU_LOCATIONS.Indiranagar.coords,
    speed: 0,
    heading: 180,
  },
  {
    id: 'amb-24',
    registration: 'KA-53-DEMO-124',
    operator: 'BTM Medical Van (Sample)',
    category: 'Patient Transport',
    network: 'private',
    status: 'available',
    area: 'BTM Layout',
    lastGpsAt: Date.now() - 20000,
    coords: BENGALURU_LOCATIONS['BTM Layout'].coords,
    speed: 0,
    heading: 90,
  },
  {
    id: 'amb-25',
    registration: 'KA-41-DEMO-125',
    operator: 'Electronic City Transfer Van (Sample)',
    category: 'Patient Transport',
    network: 'private',
    status: 'available',
    area: 'Electronic City',
    lastGpsAt: Date.now() - 25000,
    coords: BENGALURU_LOCATIONS['Electronic City'].coords,
    speed: 0,
    heading: 45,
  },
  {
    id: 'amb-26',
    registration: 'KA-02-DEMO-126',
    operator: 'Rajajinagar Patient Transport (Sample)',
    category: 'Patient Transport',
    network: 'private',
    status: 'available',
    area: 'Rajajinagar',
    lastGpsAt: Date.now() - 18000,
    coords: BENGALURU_LOCATIONS.Rajajinagar.coords,
    speed: 0,
    heading: 270,
  },
  {
    id: 'amb-27',
    registration: 'KA-02-DEMO-127',
    operator: 'Yeshwanthpur Med Transit (Sample)',
    category: 'Patient Transport',
    network: 'private',
    status: 'available',
    area: 'Yeshwanthpur',
    lastGpsAt: Date.now() - 12000,
    coords: BENGALURU_LOCATIONS.Yeshwanthpur.coords,
    speed: 0,
    heading: 135,
  },
  {
    id: 'amb-28',
    registration: 'KA-50-DEMO-128',
    operator: 'JP Nagar Medical Van (Sample)',
    category: 'Patient Transport',
    network: 'private',
    status: 'available',
    area: 'JP Nagar',
    lastGpsAt: Date.now() - 30000,
    coords: BENGALURU_LOCATIONS['JP Nagar'].coords,
    speed: 0,
    heading: 0,
  },
  {
    id: 'amb-29',
    registration: 'KA-41-DEMO-129',
    operator: 'Electronic City BLS Unit (Sample)',
    category: 'BLS',
    network: 'private',
    status: 'available',
    area: 'Electronic City',
    lastGpsAt: Date.now() - 10000,
    coords: BENGALURU_LOCATIONS['Electronic City'].coords,
    speed: 0,
    heading: 315,
  },
  {
    id: 'amb-30',
    registration: 'KA-51-DEMO-130',
    operator: 'Hebbal Rapid BLS (Sample)',
    category: 'BLS',
    network: 'private',
    status: 'available',
    area: 'Hebbal',
    lastGpsAt: Date.now() - 14000,
    coords: BENGALURU_LOCATIONS.Hebbal.coords,
    speed: 0,
    heading: 180,
  },
];

const INITIAL_DEMO_REQUESTS: AmbulanceRequest[] = [
  {
    id: 'RR-SAMPLE-01',
    channel: 'Mobile app',
    network: 'private',
    pickupArea: 'Koramangala',
    pickupNote: 'Near Forum Mall, 80ft Road Junction',
    patientName: 'Arjun Rao',
    patientPhone: '+91 98450 12345',
    patientAge: 42,
    description: 'Acute chest tightness and shortness of breath while driving.',
    category: 'ALS',
    status: 'en_route',
    ambulanceId: 'amb-2',
    declinedAmbulanceIds: [],
    alerts: [],
    aiCaptured: false,
    externalRef: null,
    createdAt: Date.now() - 180000,
    stageAt: Date.now() - 60000,
    pickupCoords: BENGALURU_LOCATIONS.Koramangala.coords,
    hospital: findNearestHospital(BENGALURU_LOCATIONS.Koramangala.coords),
    distanceKm: 1.8,
    etaMinutes: 4,
    workflowStep: 'amb_navigate_patient',
  },
  {
    id: 'RR-SAMPLE-02',
    channel: 'Phone',
    network: 'private',
    pickupArea: 'Jayanagar',
    pickupNote: 'Opposite 4th Block Complex, near Pillar 8',
    patientName: 'Meenakshi Sundaram',
    patientPhone: '+91 97410 98765',
    patientAge: 68,
    description: 'Elderly patient slip and fall inside residence with suspected hip fracture.',
    category: 'BLS',
    status: 'pending',
    ambulanceId: null,
    declinedAmbulanceIds: [],
    alerts: [],
    aiCaptured: true,
    externalRef: null,
    createdAt: Date.now() - 30000,
    stageAt: Date.now() - 30000,
    pickupCoords: BENGALURU_LOCATIONS.Jayanagar.coords,
    hospital: findNearestHospital(BENGALURU_LOCATIONS.Jayanagar.coords),
    distanceKm: 2.3,
    etaMinutes: 6,
    workflowStep: 'disp_check',
  },
];

const INITIAL_DEMO_EVENTS: DispatchEvent[] = [
  {
    id: 'evt-1',
    requestId: 'RR-SAMPLE-01',
    message: 'KA-03-DEMO-202 is en route to pickup in Koramangala (ETA 4m)',
    createdAt: Date.now() - 60000,
  },
  {
    id: 'evt-2',
    requestId: 'RR-SAMPLE-01',
    message: 'CityMed Transport (Sample) accepted RR-SAMPLE-01',
    createdAt: Date.now() - 120000,
  },
  {
    id: 'evt-3',
    requestId: 'RR-SAMPLE-02',
    message: 'New request via Phone (details captured by AI, confirm with caller)',
    createdAt: Date.now() - 30000,
  },
];

function toAmbulance(row: AmbulanceRow): Ambulance {
  const coords = getCoordinatesForArea(row.area);
  return {
    id: row.id,
    registration: row.registration,
    operator: row.operator,
    category: row.category,
    network: row.network,
    status: row.status,
    area: row.area,
    lastGpsAt: Date.parse(row.last_gps_at),
    coords,
    speed: row.status === 'busy' ? 38 : 0,
    heading: 90,
  };
}

function toRequest(row: RequestRow): AmbulanceRequest {
  const pickupCoords = getCoordinatesForArea(row.pickup_area);
  const hospital = findNearestHospital(pickupCoords);
  return {
    id: row.id,
    channel: row.channel,
    network: row.network,
    pickupArea: row.pickup_area,
    pickupNote: row.pickup_note,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    patientAge: row.patient_age,
    description: row.description,
    category: row.category,
    status: row.status,
    ambulanceId: row.ambulance_id,
    declinedAmbulanceIds: row.declined_ambulance_ids || [],
    alerts: row.alerts || [],
    aiCaptured: row.ai_captured,
    externalRef: row.external_ref,
    createdAt: Date.parse(row.created_at),
    stageAt: Date.parse(row.stage_at),
    pickupCoords,
    hospital,
  };
}

function toEvent(row: EventRow): DispatchEvent {
  return {
    id: row.id,
    requestId: row.request_id,
    message: row.message,
    createdAt: Date.parse(row.created_at),
  };
}

function toRequestRow(request: AmbulanceRequest): RequestRow {
  return {
    id: request.id,
    channel: request.channel,
    network: request.network,
    pickup_area: request.pickupArea,
    pickup_note: request.pickupNote,
    patient_name: request.patientName,
    patient_phone: request.patientPhone,
    patient_age: request.patientAge,
    description: request.description,
    category: request.category,
    status: request.status,
    ambulance_id: request.ambulanceId,
    declined_ambulance_ids: request.declinedAmbulanceIds,
    alerts: request.alerts,
    ai_captured: request.aiCaptured,
    external_ref: request.externalRef,
    created_at: new Date(request.createdAt).toISOString(),
    stage_at: new Date(request.stageAt).toISOString(),
  };
}

export async function fetchDispatchSnapshot(): Promise<{
  ambulances: Ambulance[];
  requests: AmbulanceRequest[];
  events: DispatchEvent[];
}> {
  try {
    const [fleet, requests, events] = await Promise.all([
      supabase.from('ambulances').select('*').order('id'),
      supabase
        .from('ambulance_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(REQUEST_LIMIT),
      supabase.from('dispatch_events').select('*').order('created_at', { ascending: false }).limit(EVENT_LIMIT),
    ]);

    if (fleet.error || requests.error || events.error || !fleet.data || fleet.data.length === 0) {
      // Use fallback demo seed
      return {
        ambulances: DEFAULT_FLEET,
        requests: INITIAL_DEMO_REQUESTS,
        events: INITIAL_DEMO_EVENTS,
      };
    }

    const activeAssignedAmbulanceIds = new Set(
      requests.data
        ? (requests.data as RequestRow[])
            .filter((r) => r.status !== 'completed' && r.ambulance_id)
            .map((r) => r.ambulance_id!)
        : []
    );

    const dbAmbulances = (fleet.data as AmbulanceRow[]).map(toAmbulance);
    const dbMap = new Map(dbAmbulances.map((a) => [a.id, a]));

    // Merge DB rows with the full 30-ambulance fleet across Bengaluru
    const combinedFleet = DEFAULT_FLEET.map((defAmb) => {
      const live = dbMap.get(defAmb.id);
      if (live) {
        // If an ambulance is not assigned to an active uncompleted trip, ensure it is available
        const isActuallyActive = activeAssignedAmbulanceIds.has(defAmb.id);
        const status = isActuallyActive ? 'busy' : 'available';
        return {
          ...defAmb,
          status,
          speed: isActuallyActive ? live.speed : 0,
          heading: live.heading,
          lastGpsAt: live.lastGpsAt || defAmb.lastGpsAt,
        };
      }
      return defAmb;
    });

    return {
      ambulances: combinedFleet,
      requests: (requests.data as RequestRow[]).map(toRequest),
      events: (events.data as EventRow[]).map(toEvent),
    };
  } catch {
    // Graceful offline/sandbox fallback to demo simulation dataset
    return {
      ambulances: DEFAULT_FLEET,
      requests: INITIAL_DEMO_REQUESTS,
      events: INITIAL_DEMO_EVENTS,
    };
  }
}

export async function saveRequest(request: AmbulanceRequest): Promise<void> {
  try {
    await supabase.from('ambulance_requests').upsert(toRequestRow(request));
  } catch {
    // Ignored in offline/sandbox demo mode
  }
}

export async function saveAmbulanceStatus(ambulanceId: string, status: AmbulanceStatus): Promise<void> {
  try {
    await supabase.from('ambulances').update({ status }).eq('id', ambulanceId);
  } catch {
    // Ignored in offline/sandbox demo mode
  }
}

export async function saveEvent(entry: DispatchEvent): Promise<void> {
  try {
    await supabase.from('dispatch_events').insert({
      id: entry.id,
      request_id: entry.requestId,
      message: entry.message,
      created_at: new Date(entry.createdAt).toISOString(),
    });
  } catch {
    // Ignored in offline/sandbox demo mode
  }
}
