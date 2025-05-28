export type Announcement = {
    id: string;
    title: string;
    body: string;
    image_url?: string;
    image_public_id?: string;
    state: AnnouncementState;
    created_at?: string;
    updated_at?: string;
}

export enum AnnouncementState {
    SENT = "sent",
    PENDING = "pending",
}