import OpenAI from "openai";
import "dotenv/config";
export declare const ai: OpenAI;
export declare const MODEL: string;
export declare function ask(system: string, user: string): Promise<string>;
export declare function askJSON<T>(system: string, user: string): Promise<T>;
