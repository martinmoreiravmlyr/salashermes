import { createBookingService, createDemoRepository, createInMemoryRepository } from "@/lib/booking-service";
import { bookings, rooms } from "@/lib/schedule";

declare global {
  var __salasDemoRepository: ReturnType<typeof createInMemoryRepository> | undefined;
}

function getDemoRepository() {
  if (!globalThis.__salasDemoRepository) {
    globalThis.__salasDemoRepository = createDemoRepository();
  }

  return globalThis.__salasDemoRepository;
}

export function getBookingService() {
  if (process.env.DATABASE_URL) {
    // Placeholder for next iteration: Prisma-backed repository.
    return createBookingService(createInMemoryRepository({ rooms, bookings }));
  }

  return createBookingService(getDemoRepository());
}
