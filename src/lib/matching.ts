import { calculateDistanceKm, getCoordinatesForArea } from '@/data/locations';
import type { Ambulance, AmbulanceRequest } from '@/types';

/**
 * Checks if an ambulance is capable and suitable to respond to an emergency request.
 * Follows the standard Emergency Medical Services (EMS) tier hierarchy:
 * - ALS (Advanced Life Support): Fully equipped with ventilators, defibrillators, and paramedics.
 *   Capable of serving ALS, BLS, and Patient Transport requests.
 * - BLS (Basic Life Support): Equipped with oxygen, monitors, stretchers, and EMTs.
 *   Capable of serving BLS and Patient Transport, and acts as first-responder for ALS if no ALS is free.
 * - Patient Transport: Handles scheduled/non-emergency medical transports.
 */
export function isSuitable(ambulance: Ambulance, request: AmbulanceRequest): boolean {
  if (ambulance.network !== 'private' || ambulance.status !== 'available') return false;
  if (request.declinedAmbulanceIds.includes(ambulance.id)) return false;

  // 1. Exact category match
  if (ambulance.category === request.category) return true;

  // 2. ALS unit can fulfill BLS and Patient Transport requests
  if (ambulance.category === 'ALS') return true;

  // 3. BLS unit can fulfill Patient Transport requests, or respond to ALS as first responder
  if (ambulance.category === 'BLS') {
    return request.category === 'Patient Transport' || request.category === 'ALS';
  }

  // 4. Patient Transport vehicles serve Patient Transport
  return request.category === 'Patient Transport';
}

/**
 * Ranks all suitable candidate ambulances for a given request.
 * Prioritizes:
 * 1. Exact vehicle capability match (+25)
 * 2. Same sector / area bonus (+15)
 * 3. Closer GPS proximity (up to +35 points)
 */
export function rankCandidates(ambulances: Ambulance[], request: AmbulanceRequest): Ambulance[] {
  const pickupPoint = request.pickupCoords || getCoordinatesForArea(request.pickupArea);

  const calculateScore = (a: Ambulance) => {
    const ambPoint = a.coords || getCoordinatesForArea(a.area);
    const distanceKm = calculateDistanceKm(ambPoint, pickupPoint);

    // Exact category match bonus
    let categoryScore = 5;
    if (a.category === request.category) {
      categoryScore = 25;
    } else if (a.category === 'ALS') {
      categoryScore = 18; // ALS fulfilling BLS or Transport
    } else if (a.category === 'BLS') {
      categoryScore = 12; // BLS fulfilling Transport or first responder
    }

    // Same area bonus
    const areaBonus = a.area === request.pickupArea ? 15 : 0;

    // Proximity score (closer is better, max range ~ 35km)
    const distanceScore = Math.max(0, 35 - distanceKm);

    return categoryScore + areaBonus + distanceScore;
  };

  return ambulances
    .filter((a) => isSuitable(a, request))
    .sort((a, b) => calculateScore(b) - calculateScore(a));
}
