import type { TravelBlueprint } from "../types.js";
export declare class PlannerAgent {
    generateBlueprint(input: {
        destination: string;
        budget: number;
        duration: number;
    }): Promise<TravelBlueprint>;
    toMarkdown(blueprint: TravelBlueprint): string;
}
