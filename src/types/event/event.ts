import type { EventCategory } from "../eventCategory";
import type { EventType } from "../eventType";
import type { Weekday } from "../weekday";

export type Event = {
    id: string;
    title: string;
    description: string;
    time: string;
    type: EventType;
    day: Weekday;
    category: EventCategory;
    start_date?: string;
    end_date?: string;
    banner_url?: string;
    banner_public_id?: string;
    created_at?: string;
    updated_at?: string;
}