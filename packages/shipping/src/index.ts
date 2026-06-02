import crypto from 'crypto';

export interface ShippingAddress {
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface ShippingParcel {
  weightKg: number;
  widthCm: number;
  heightCm: number;
  depthCm: number;
}

export interface ShippingRateOption {
  id: string;
  carrier: string; // e.g., "Delhivery", "Blue Dart", "DTDC", "India Post"
  service: string; // e.g., "Express", "Surface", "Speed Post"
  rate: number;    // INR equivalent cost
  estimatedDays: number;
}

export interface ShippingLabelResult {
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
  service: string;
  ratePaid: number;
  estimatedDelivery: Date;
}

export interface ShipmentTrackingTimeline {
  trackingNumber: string;
  carrier: string;
  status: string;
  events: {
    timestamp: Date;
    description: string;
    location: string;
  }[];
}

/**
 * Calculates estimated rates across multiple Indian shipping service providers.
 * Base rate factors weight and volumetric index.
 */
export async function estimateRates(
  origin: ShippingAddress,
  destination: ShippingAddress,
  parcels: ShippingParcel[]
): Promise<ShippingRateOption[]> {
  // Compute total weight
  const totalWeight = parcels.reduce((sum, p) => sum + p.weightKg, 0);
  
  // Basic volumetric factor calculation
  const totalVolume = parcels.reduce((sum, p) => sum + (p.widthCm * p.heightCm * p.depthCm), 0);
  const dimensionalWeight = totalVolume / 5000; // Standard shipping index
  const chargeableWeight = Math.max(totalWeight, dimensionalWeight, 0.5);

  // Generate Indian courier rates
  const options: ShippingRateOption[] = [
    {
      id: 'rate_delhivery_surface',
      carrier: 'Delhivery',
      service: 'Surface Standard',
      rate: Math.round(80 + chargeableWeight * 40), // e.g., 120 INR for 1kg
      estimatedDays: 5,
    },
    {
      id: 'rate_delhivery_express',
      carrier: 'Delhivery',
      service: 'Express Premium',
      rate: Math.round(150 + chargeableWeight * 70),
      estimatedDays: 2,
    },
    {
      id: 'rate_bluedart_priority',
      carrier: 'Blue Dart',
      service: 'Dart Apex Priority',
      rate: Math.round(250 + chargeableWeight * 120),
      estimatedDays: 1,
    },
    {
      id: 'rate_dtdc_economy',
      carrier: 'DTDC',
      service: 'Economy Cargo',
      rate: Math.round(60 + chargeableWeight * 35),
      estimatedDays: 6,
    },
    {
      id: 'rate_indiapost_speed',
      carrier: 'India Post',
      service: 'Speed Post',
      rate: Math.round(50 + chargeableWeight * 30),
      estimatedDays: 4,
    },
  ];

  return options;
}

/**
 * Automatically estimates rates and purchases/issues the CHEAPEST shipping label.
 */
export async function purchaseCheapestLabel(
  origin: ShippingAddress,
  destination: ShippingAddress,
  parcels: ShippingParcel[]
): Promise<ShippingLabelResult> {
  const rates = await estimateRates(origin, destination, parcels);
  
  // Sort ascending and pick cheapest
  rates.sort((a, b) => a.rate - b.rate);
  const cheapestRate = rates[0];

  const carrierCode = cheapestRate.carrier.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const randomSuffix = crypto.randomInt(10000000, 99999999).toString();
  const trackingNumber = `EL-${carrierCode}-${randomSuffix}`;
  
  const labelHash = crypto.randomBytes(6).toString('hex');
  const labelUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'; // Mock PDF

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + cheapestRate.estimatedDays);

  return {
    trackingNumber,
    labelUrl,
    carrier: cheapestRate.carrier,
    service: cheapestRate.service,
    ratePaid: cheapestRate.rate,
    estimatedDelivery,
  };
}

/**
 * Retrieves track and trace timelines for a given tracking number.
 */
export async function trackShipment(trackingNumber: string): Promise<ShipmentTrackingTimeline> {
  const parts = trackingNumber.split('-');
  const carrierCode = parts[1] || 'LOG';
  
  let carrier = 'Logistics';
  if (carrierCode === 'DEL') carrier = 'Delhivery';
  else if (carrierCode === 'BLU') carrier = 'Blue Dart';
  else if (carrierCode === 'DTD') carrier = 'DTDC';
  else if (carrierCode === 'IND') carrier = 'India Post';

  return {
    trackingNumber,
    carrier,
    status: 'IN_TRANSIT',
    events: [
      {
        timestamp: new Date(Date.now() - 3600000 * 24),
        description: 'Shipment label created and packaging finalized.',
        location: 'Electra Warehouse, New Delhi',
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 12),
        description: 'Package handed over to carrier and scanned.',
        location: 'Carrier Hub, New Delhi',
      },
      {
        timestamp: new Date(),
        description: 'In transit to destination delivery facility.',
        location: 'Sorting Facility',
      },
    ],
  };
}
