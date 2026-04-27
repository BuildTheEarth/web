export class ClaimDto {
  id: string;
  ownerId: string | null;
  area: string[];
  center: string | null;
  size: number;
  active: boolean;
  finished: boolean;
  buildTeamId: string;
  name: string;
  createdAt: string;
  externalId: string | null;
  description: string | null;
  buildings: number;
  city: string | null;
  osmName: string | null;

  _count: {
    builders: number;
    images: number;
  };

  images: {
    id: string;
    name: string;
    hash: string;
  }[];
}
