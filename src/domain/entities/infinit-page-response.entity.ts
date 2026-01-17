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

  constructor(data: T[], query: InfinitePageQueryDto) {
    super();
    this.data = data;
    this.cursor = query.cursor;
    this.size = query.size;
  }
}
