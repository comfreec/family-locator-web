export interface FamilyMember {
  uid: string;
  name: string;
  email: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  isOnline: boolean;
  familyId?: string;
  color: string;
}

export interface Family {
  id: string;
  name: string;
  members: Record<string, boolean>;
  createdBy: string;
  inviteCode: string;
}
