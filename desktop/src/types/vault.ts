// Vault types matching Rust models

export interface Vault {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateVaultParams {
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
}

export interface UpdateVaultParams {
    name?: string | null;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
}
