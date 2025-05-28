export type SocialMedia = {
    id?: string;
    title: string;
    link: string;
    type: SocialMediaType;
    banner_url?: string;
    banner_public_id?: string;
    created_at?: string;
    updated_at?: string;
}

export enum SocialMediaType {
    INSTAGRAM = 'Instagram',
    FACEBOOK = 'Facebook',
    YOUTUBE = 'YouTube',
    TIKTOK = 'TikTok',
    THREADS = 'Threads',
    X = 'X',
}