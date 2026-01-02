export interface ISecret {
  _id: string;
  kid: string;
  key?: string; // Only returned on create
  name: string;
  scopes: string[];
  lastFour: string;
  isEnabled: boolean;
  expiresAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastUsedAt?: string | Date | null;
  masked?: boolean; // UI state
  maskedKey?: string; // UI state
}

export interface CreateKeyRequest {
  name: string;
  scopes: string[];
  expiresAt?: Date | null;
}
