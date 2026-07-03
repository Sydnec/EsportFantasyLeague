import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class PandascoreService {
  private readonly logger = new Logger(PandascoreService.name);
  private readonly baseUrl = 'https://api.pandascore.co';

  constructor(private readonly httpService: HttpService) {}

  private getHeaders() {
    return {
      Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}`,
      Accept: 'application/json',
    };
  }

  async getPlayers(gameSlug: string, page = 1, perPage = 50) {
    this.logger.log(`Fetching ${gameSlug} players from Pandascore...`);
    const url = `${this.baseUrl}/${gameSlug}/players?page=${page}&per_page=${perPage}`;
    
    const { data } = await firstValueFrom(
      this.httpService.get(url, { headers: this.getHeaders() }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Error fetching players: ${error.message}`);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }

  async getMatches(gameSlug: string, page = 1, perPage = 50) {
    this.logger.log(`Fetching ${gameSlug} matches from Pandascore...`);
    const url = `${this.baseUrl}/${gameSlug}/matches?page=${page}&per_page=${perPage}&sort=-begin_at`;
    
    const { data } = await firstValueFrom(
      this.httpService.get(url, { headers: this.getHeaders() }).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Error fetching matches: ${error.message}`);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }

  // Example method to fetch detailed stats if available, or we might extract from match data
  // Pandascore generally returns stats in the /matches endpoint if you have the proper subscription plan
}
