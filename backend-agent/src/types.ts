export interface UserRequest {
  destination: string;
  budget: number;
  duration: number;
  departureDate: string;
}

export interface TravelBlueprint {
  destination: string;
  duration: number;
  budget: number;
  hotels: HotelOption[];
  attractions: string[];
  itinerary: DayPlan[];
  budgetAllocation: BudgetAllocation;
}

export interface HotelOption {
  name: string;
  pricePerNight: number;
  rating: number;
}

export interface DayPlan {
  day: number;
  activities: string[];
}

export interface BudgetAllocation {
  hotel: number;
  flight: number;
  activities: number;
  transport: number;
}

export interface TreasuryContext {
  vaultId?: string;
  planId?: string;
  vaultBalance: number;
  departureDate: string;
  budget: number;
}

export interface TreasuryStrategy {
  investAmount: number;
  liquidAmount: number;
  protocol: string;
  prepareLiquidityDays: number;
}

export interface FlightOption {
  airline: string;
  price: number;
  departure: string;
  arrival: string;
}

export interface BookingPlan {
  flight?: FlightOption;
  hotel?: HotelOption;
  totalCost: number;
}

export interface RiskContext {
  blueprint: TravelBlueprint;
  treasuryPlan: TreasuryStrategy;
  bookingPlan: BookingPlan;
}

export interface RiskResult {
  approved: boolean;
  reasons: string[];
}

export interface TravelContext {
  userId: string;
  destination: string;
  budget: number;
  duration: number;
  blueprint?: TravelBlueprint;
  treasuryPlan?: TreasuryStrategy;
  bookingPlan?: BookingPlan;
  riskResult?: RiskResult;
  planId?: string;
  vaultId?: string;
}

export interface ExecutionPlan {
  blueprint: TravelBlueprint;
  treasuryStrategy: TreasuryStrategy;
  bookings: BookingPlan;
  riskAssessment: RiskResult;
}

export interface AgentResponse {
  agent: string;
  data: any;
}

export interface ActionStep {
  step: number;
  name: string;
  description: string;
  action: string;
  params: Record<string, any>;
  estimatedGas?: number;
}

export interface FullTripPlan {
  context: TravelContext;
  plan: ExecutionPlan;
  actions: ActionStep[];
  logs: AgentResponse[];
  walrus: { blobId: string | null; url: string };
  markdown: string;
  summary: string;
}
