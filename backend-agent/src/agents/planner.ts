import { askJSON } from "../ai.js";
import type { TravelBlueprint } from "../types.js";

export class PlannerAgent {
  async generateBlueprint(input: {
    destination: string;
    budget: number;
    duration: number;
  }): Promise<TravelBlueprint> {
    const system = `You are an expert travel planner. Output ONLY valid JSON matching this TypeScript type:

interface TravelBlueprint {
  destination: string;
  duration: number;
  budget: number;
  hotels: { name: string; pricePerNight: number; rating: number; neighborhood: string; highlights: string[] }[];
  attractions: string[];
  itinerary: {
    day: number;
    theme: string;
    morning: string;
    afternoon: string;
    evening: string;
    meals: { breakfast: string; lunch: string; dinner: string };
    tips: string;
    estimatedCost: number;
  }[];
  budgetAllocation: { hotel: number; flight: number; activities: number; transport: number; food: number; misc: number };
  flightInfo: { airline: string; estimatedPrice: number; duration: string };
  practicalInfo: { currency: string; language: string; bestTimeToVisit: string; visaRequired: boolean; transportation: string };
}

Rules:
- Generate exactly 'duration' days in the itinerary with UNIQUE daily themes and SPECIFIC activity names.
- Each day must have morning, afternoon, evening sections with detailed descriptions (2-3 sentences each).
- Suggest specific local restaurants for each meal.
- Sum of all budgetAllocation fields must equal the total budget.
- Include practical traveler tips per day.`;

    const user = `Plan a detailed ${input.duration}-day trip to ${input.destination} with a total budget of $${input.budget}. Make the itinerary specific, immersive, and day-by-day with real places, local food, and insider tips.`;

    return askJSON<TravelBlueprint>(system, user);
  }

  toMarkdown(blueprint: TravelBlueprint): string {
    let md = `# ${blueprint.destination} Travel Blueprint\n\n`;
    md += `**${blueprint.duration} days · $${blueprint.budget} budget**\n\n`;

    // Practical info
    if ((blueprint as any).practicalInfo) {
      const p = (blueprint as any).practicalInfo;
      md += `## Practical Info\n\n`;
      md += `| | |\n|---|---|\n`;
      md += `| Currency | ${p.currency} |\n`;
      md += `| Language | ${p.language} |\n`;
      md += `| Best Time | ${p.bestTimeToVisit} |\n`;
      md += `| Visa | ${p.visaRequired ? 'Required' : 'Not required'} |\n`;
      md += `| Getting Around | ${p.transportation} |\n\n`;
    }

    // Hotels
    md += `## Accommodation\n\n`;
    for (const h of blueprint.hotels) {
      const hood = (h as any).neighborhood ? ` · ${(h as any).neighborhood}` : '';
      md += `### ${h.name} (${h.rating}★${hood})\n`;
      md += `$${h.pricePerNight}/night\n`;
      if ((h as any).highlights?.length) {
        for (const hl of (h as any).highlights) md += `- ${hl}\n`;
      }
      md += '\n';
    }

    // Flight
    if ((blueprint as any).flightInfo) {
      const f = (blueprint as any).flightInfo;
      md += `## Flight\n\n`;
      md += `**${f.airline}** · ~$${f.estimatedPrice} · ${f.duration}\n\n`;
    }

    // Day-by-day itinerary
    md += `## Day-by-Day Itinerary\n\n`;
    for (const day of blueprint.itinerary) {
      const d = day as any;
      md += `### Day ${day.day}${d.theme ? ` — ${d.theme}` : ''}\n`;
      if (d.morning) md += `**🌅 Morning:** ${d.morning}\n\n`;
      if (d.afternoon) md += `**☀️ Afternoon:** ${d.afternoon}\n\n`;
      if (d.evening) md += `**🌙 Evening:** ${d.evening}\n\n`;
      if (d.meals) {
        md += `**🍽️ Meals:**\n`;
        md += `- Breakfast: ${d.meals.breakfast}\n`;
        md += `- Lunch: ${d.meals.lunch}\n`;
        md += `- Dinner: ${d.meals.dinner}\n\n`;
      }
      if (d.tips) md += `**💡 Tip:** ${d.tips}\n\n`;
      if (d.estimatedCost) md += `*Estimated daily spend: $${d.estimatedCost}*\n\n`;
      md += '---\n\n';
    }

    // Budget breakdown
    md += `## Budget Breakdown\n\n`;
    const alloc = blueprint.budgetAllocation as any;
    for (const [key, val] of Object.entries(alloc)) {
      md += `- ${key.charAt(0).toUpperCase() + key.slice(1)}: $${val}\n`;
    }
    return md;
  }
}
