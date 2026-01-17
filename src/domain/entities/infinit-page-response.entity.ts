import { Expose } from 'class-transformer';
import { InfinitePageQueryDto } from 'src/application/dto/page-query.dto';

export class InfinitePageResponseEntity<T> extends InfinitePageQueryDto {
  data: T[];
  nextCursor?: string;
  previousCursor?: string;

  @Expose()
  get hasNextPage(): boolean {
    return this.data.length === this.size;
  }

  constructor(data: T[], query: InfinitePageQueryDto, cursorField: keyof T) {
    super();
    const previousCursorValue = data.length > 0 ? (data[0][cursorField] as string) : undefined;
    const nextCursorValue = data.length > 0 ? (data[data.length - 1][cursorField] as string) : undefined;

    this.data = data;
    this.cursor = query.cursor;
    this.size = query.size;
    this.nextCursor = nextCursorValue ? Buffer.from(nextCursorValue, 'utf-8').toString('base64') : undefined;
    this.previousCursor =
      previousCursorValue ? Buffer.from(previousCursorValue, 'utf-8').toString('base64') : undefined;
  }
}
