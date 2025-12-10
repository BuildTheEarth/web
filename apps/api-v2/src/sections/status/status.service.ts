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
}
