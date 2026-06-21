import type { ExecutionPlan, TravelContext, AgentResponse } from "../types.js";
export declare class SupervisorAgent {
    private planner;
    private treasury;
    private booking;
    private risk;
    handle(input: {
        message: string;
    }): Promise<{
        context: TravelContext;
        plan: ExecutionPlan;
        logs: AgentResponse[];
    }>;
    execute(action: string, sender: string, params: any): Promise<any>;
    private parseMessage;
}
