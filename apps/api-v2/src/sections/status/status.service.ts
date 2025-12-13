import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { CachetAPIService } from "src/common/db/external/cachet.service";

@Injectable()
export class StatusService {
  constructor(private readonly cachetAPIService: CachetAPIService) {}

  async testConnection(): Promise<string> {
    try {
      return await this.cachetAPIService.testConnection();
    } catch {
      throw new ServiceUnavailableException("Status API is unreachable");
    }
  }

  async getGlobalStatus(): Promise<{ status: string; message: string }> {
    try {
      return await this.cachetAPIService.getGlobalStatus();
    } catch {
      throw new ServiceUnavailableException("Status API is unreachable");
    }
  }

  async getComponents({
    status,
  }: {
    status?: 1 | 2 | 3 | 4 | 5 | 6;
  }): Promise<any[]> {
    try {
      return (await this.cachetAPIService.getComponents({ status })).map(
        (component) => ({
          id: component.attributes.id,
          name: component.attributes.name,
          link: component.attributes.link,
          description: component.attributes.description,
          status: component.attributes.status,
          type: component.attributes.meta.type,
        }),
      );
    } catch {
      throw new ServiceUnavailableException("Status API is unreachable");
    }
  }

  async getIncidents(): Promise<any[]> {
    try {
      return (await this.cachetAPIService.getIncidents()).map((incident) => ({
        id: incident.attributes.id,
        name: incident.attributes.name,
        message: incident.attributes.message,
        status: incident.attributes.status,
        created_at: incident.attributes.created,
        occurred_at: incident.attributes.occurred,
      }));
    } catch {
      throw new ServiceUnavailableException("Status API is unreachable");
    }
  }
}
