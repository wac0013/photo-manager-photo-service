import type { PrismaService } from './prisma.service';

let prismaServiceInstance: PrismaService | null = null;

export function setPrismaServiceInstance(instance: PrismaService): void {
  prismaServiceInstance = instance;
}

export function getPrismaServiceInstance(): PrismaService | null {
  return prismaServiceInstance;
}
