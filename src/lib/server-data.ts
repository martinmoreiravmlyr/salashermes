import { PrismaClient } from "@prisma/client";
import { createBookingService, createDemoRepository, createInMemoryRepository } from "@/lib/booking-service";
import { createPrismaRepository } from "@/lib/prisma-repository";
import { bookings, rooms } from "@/lib/schedule";

declare global {
  var __salasDemoRepository: ReturnType<typeof createInMemoryRepository> | undefined;
  var __salasPrismaClient: PrismaClient | undefined;
}

function getDemoRepository() {
  if (!globalThis.__salasDemoRepository) {
    globalThis.__salasDemoRepository = createDemoRepository();
  }

  return globalThis.__salasDemoRepository;
}

function getPrismaClient() {
  if (!globalThis.__salasPrismaClient) {
    globalThis.__salasPrismaClient = new PrismaClient();
  }

  return globalThis.__salasPrismaClient;
}

export function getBookingService() {
  if (process.env.DATABASE_URL && process.env.USE_DEMO_REPOSITORY !== "true") {
    return createBookingService(createPrismaRepository(getPrismaClient()));
  }

  return createBookingService(getDemoRepository());
}

export function getStaticFallbackBookingService() {
  return createBookingService(createInMemoryRepository({ rooms, bookings }));
}
