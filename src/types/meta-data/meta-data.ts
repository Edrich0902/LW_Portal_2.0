export type MetaData = {
    id?: string;
    key: string;
    title: string;
    content: string;
    created_at?: string;
}

// VisonMission is extension of MetaData - VisionMission used for readability and sensibility
export type VisionMission = MetaData;