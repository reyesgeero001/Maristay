import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/** Validates that a route identifier (e.g. `:id`) is a positive integer. */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^\d+$/.test(String(value))) {
      throw new BadRequestException('Identifier must be a positive integer');
    }
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new BadRequestException('Identifier must be a positive integer');
    }
    return id;
  }
}
