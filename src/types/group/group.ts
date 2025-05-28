import type { GroupType } from "../groupType";

export type Group = {
    id: string;
    title: string;
    description: string;
    type: GroupType;
    whatsappLink?: string;
    location?: string;
    banner_url?: string;
    banner_public_id?: string;
    updated_at?: string;
    created_at?: string;
}