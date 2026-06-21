import { askJSON } from "../ai.js";
import type { TravelBlueprint } from "../types.js";

export class PlannerAgent {
  async generateBlueprint(input: {
    destination: string;
    budget: number;
    duration: number;
  }): Promise<TravelBlueprint> {
    const system = `You are a professional travel planner. Output ONLY valid JSON matching this TypeScript type:

interface TravelBlueprint {
  destination: string;
  duration: number;
  budget: number;
  hotels: { name: string; pricePerNight: number; rating: number }[];
  attractions: string[];
  itinerary: { day: number; activities: string[] }[];
  budgetAllocation: { hotel: number; flight: number; activities: number; transport: number };
}

Rules:
- hotel pricePerNight × duration must fit within the hotel budget allocation.
- Sum of all budgetAllocation fields must equal the total budget.
- Generate exactly 'duration' number of days in the itinerary.
- Use real hotel names and real attractions for the destination.`;

    const user = `Plan a ${input.duration}-day trip to ${input.destination} with a total budget of $${input.budget}.`;

    return askJSON<TravelBlueprint>(system, user);
  }

  toMarkdown(blueprint: TravelBlueprint): string {
    let md = `# ${blueprint.destination} Travel Blueprint\n\n`;
    md += `## Budget\n\n$${blueprint.budget}\n\n`;
    md += `## Hotels\n\n`;
    for (const h of blueprint.hotels) {
      md += `- ${h.name} ($${h.pricePerNight}/night, ${h.rating}★)\n`;
    }
    md += `\n## Attractions\n\n`;
    for (const a of blueprint.attractions) {
      md += `- ${a}\n`;
    }
    md += `\n## Budget Allocation\n\n`;
    md += `- Hotel: $${blueprint.budgetAllocation.hotel}\n`;
    md += `- Flight: $${blueprint.budgetAllocation.flight}\n`;
    md += `- Activities: $${blueprint.budgetAllocation.activities}\n`;
    md += `- Transport: $${blueprint.budgetAllocation.transport}\n`;
    return md;
  }
}
