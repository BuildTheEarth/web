import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

/**
 *
 */
@Injectable()
export class CachetAPIService {
  private readonly logger = new Logger(CachetAPIService.name);
  private baseURL: string;
  private apiToken: string;

  constructor(
    private readonly http: HttpService,
    private configService: ConfigService,
  ) {
    if (
      !this.configService.get<string>("CACHET_URL") ||
      !this.configService.get<string>("CACHET_TOKEN")
    ) {
      this.logger.warn(
        "Cachet configuration is missing. CachetAPIService will not function properly.",
      );
    } else {
      this.baseURL = this.configService.get<string>("CACHET_URL") as string;
      this.apiToken = this.configService.get<string>("CACHET_TOKEN") as string;
    }

    this.testConnection().then(() => {
      this.logger.log("Cachet API is reachable");
    });
  }

  async testConnection(): Promise<string> {
    return (await firstValueFrom(this.http.get(`${this.baseURL}/api/ping`)))
      .data.data;
  }

  async getGlobalStatus(): Promise<{ status: string; message: string }> {
    return (await firstValueFrom(this.http.get(`${this.baseURL}/api/status`)))
      .data.data;
  }

  // async getComponents(): Promise<any[]> {
}
