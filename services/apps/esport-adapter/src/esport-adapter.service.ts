import { Injectable } from '@nestjs/common';

@Injectable()
export class EsportAdapterService {
  getHello(): string {
    return 'Hello World!';
  }
}
