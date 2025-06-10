export type User = {
    id?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    is_baptized?: boolean;
    is_member?: boolean;
    address?: string;
    email: string;
    profile_public_id?: string;
    profile_url?: string;
    created_at?: string;
    updated_at?: string;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  USER = 'user'
}
