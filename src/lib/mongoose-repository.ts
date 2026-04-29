import mongoose, { Schema, type Model } from "mongoose";
import type { BookingRepository, BookingRecord } from "@/lib/booking-service";
import { rooms as scheduleRooms, type BookingStatus, type Room, type RoomType } from "@/lib/schedule";

type MongoRoomDocument = {
  _id: string;
  name: string;
  capacity: number;
  location: string;
  owner: string;
  type: RoomType;
  equipment: string[];
  color: string;
  isReservable?: boolean;
};

type MongoBookingDocument = {
  _id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  title: string;
  requester: string;
  participants: string[];
  status: BookingStatus;
  restricted?: boolean;
  reason?: string;
  createdAt?: Date;
  cancelledAt?: Date | null;
  cancelledBy?: string | null;
};

type MongoAdapter = {
  ensureSeedRooms(seedRooms: MongoRoomDocument[]): Promise<void>;
  listRooms(): Promise<MongoRoomDocument[]>;
  listBookings(): Promise<MongoBookingDocument[]>;
  createBooking(booking: MongoBookingDocument): Promise<MongoBookingDocument>;
  updateBooking(
    bookingId: string,
    updater: (booking: MongoBookingDocument) => MongoBookingDocument,
  ): Promise<MongoBookingDocument | null>;
};

type MongoAdapterProvider = () => Promise<MongoAdapter>;

declare global {
  var __salasMongoConnectionPromise: Promise<typeof mongoose> | undefined;
}

const ROOM_TYPES: RoomType[] = ["sala", "box", "focus"];
const BOOKING_STATUSES: BookingStatus[] = ["CONFIRMED", "PENDING", "CANCELLED"];
const DEFAULT_ROOM_COLOR = "bg-slate-500";

function roomModel(connection: typeof mongoose): Model<MongoRoomDocument> {
  const existing = connection.models.SalasRoom as Model<MongoRoomDocument> | undefined;
  if (existing) {
    return existing;
  }

  const schema = new Schema<MongoRoomDocument>(
    {
      _id: { type: String },
      name: { type: String, required: true },
      capacity: { type: Number, required: true },
      location: { type: String, required: true },
      owner: { type: String, required: true },
      type: { type: String, enum: ROOM_TYPES, required: true },
      equipment: { type: [String], default: [] },
      color: { type: String, default: DEFAULT_ROOM_COLOR },
      isReservable: { type: Boolean, default: true },
    },
    { collection: "rooms", versionKey: false },
  );

  return connection.model<MongoRoomDocument>("SalasRoom", schema);
}

function bookingModel(connection: typeof mongoose): Model<MongoBookingDocument> {
  const existing = connection.models.SalasBooking as Model<MongoBookingDocument> | undefined;
  if (existing) {
    return existing;
  }

  const schema = new Schema<MongoBookingDocument>(
    {
      _id: { type: String },
      roomId: { type: String, required: true, index: true },
      date: { type: String, required: true, index: true },
      start: { type: String, required: true },
      end: { type: String, required: true },
      title: { type: String, required: true },
      requester: { type: String, required: true, index: true },
      participants: { type: [String], default: [] },
      status: { type: String, enum: BOOKING_STATUSES, required: true },
      restricted: { type: Boolean, default: false },
      reason: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now },
      cancelledAt: { type: Date, default: null },
      cancelledBy: { type: String, default: null },
    },
    { collection: "bookings", versionKey: false },
  );

  return connection.model<MongoBookingDocument>("SalasBooking", schema);
}

function toMongoRoomSeed(room: Room): MongoRoomDocument {
  return {
    _id: room.id,
    name: room.name,
    capacity: room.capacity,
    location: room.location,
    owner: room.owner,
    type: room.type,
    equipment: room.equipment,
    color: room.color,
    isReservable: true,
  };
}

function toMongoBookingDocument(booking: BookingRecord, current?: MongoBookingDocument): MongoBookingDocument {
  return {
    _id: booking.id,
    roomId: booking.roomId,
    date: booking.date,
    start: booking.start,
    end: booking.end,
    title: booking.title,
    requester: booking.requester,
    participants: [...booking.participants],
    status: booking.status,
    restricted: booking.restricted ?? false,
    reason: booking.reason ?? "",
    createdAt: booking.createdAt ? new Date(booking.createdAt) : current?.createdAt,
    cancelledAt: booking.cancelledAt ? new Date(booking.cancelledAt) : null,
    cancelledBy: booking.cancelledBy ?? null,
  };
}

async function getMongoConnection() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI no está configurado.");
  }

  if (!globalThis.__salasMongoConnectionPromise) {
    globalThis.__salasMongoConnectionPromise = mongoose.connect(process.env.MONGODB_URI);
  }

  return globalThis.__salasMongoConnectionPromise;
}

async function getMongoAdapter(): Promise<MongoAdapter> {
  const connection = await getMongoConnection();
  const RoomModel = roomModel(connection);
  const BookingModel = bookingModel(connection);

  return {
    async ensureSeedRooms(seedRooms) {
      if (seedRooms.length === 0) {
        return;
      }

      await RoomModel.bulkWrite(
        seedRooms.map((room) => ({
          updateOne: {
            filter: { _id: room._id },
            update: { $set: room },
            upsert: true,
          },
        })),
      );
    },

    async listRooms() {
      const rooms = await RoomModel.find({ isReservable: { $ne: false } }).sort({ name: 1 }).lean().exec();
      return rooms.map((room) => ({ ...room, _id: String(room._id) }));
    },

    async listBookings() {
      const bookings = await BookingModel.find({}).sort({ date: 1, start: 1 }).lean().exec();
      return bookings.map((booking) => ({ ...booking, _id: String(booking._id) }));
    },

    async createBooking(booking) {
      const created = await BookingModel.create(booking);
      const value = created.toObject();
      return { ...value, _id: String(value._id) };
    },

    async updateBooking(bookingId, updater) {
      const current = await BookingModel.findById(bookingId).lean().exec();
      if (!current) {
        return null;
      }

      const next = updater({ ...current, _id: String(current._id) });
      const updated = await BookingModel.findByIdAndUpdate(bookingId, next, {
        new: true,
        runValidators: true,
      })
        .lean()
        .exec();

      return updated ? { ...updated, _id: String(updated._id) } : null;
    },
  };
}

export function mapMongoRoom(room: MongoRoomDocument): Room {
  return {
    id: room._id,
    name: room.name,
    capacity: room.capacity,
    location: room.location,
    owner: room.owner,
    type: room.type,
    equipment: Array.isArray(room.equipment) ? room.equipment : [],
    color: room.color || DEFAULT_ROOM_COLOR,
  };
}

export function mapMongoBooking(booking: MongoBookingDocument): BookingRecord {
  return {
    id: booking._id,
    roomId: booking.roomId,
    date: booking.date,
    start: booking.start,
    end: booking.end,
    title: booking.title,
    requester: booking.requester,
    participants: Array.isArray(booking.participants) ? booking.participants : [],
    status: booking.status,
    restricted: Boolean(booking.restricted),
    reason: booking.reason || undefined,
    createdAt: booking.createdAt?.toISOString(),
    cancelledAt: booking.cancelledAt?.toISOString(),
    cancelledBy: booking.cancelledBy ?? undefined,
  };
}

export function createMongoRepository(adapterProvider: MongoAdapterProvider = getMongoAdapter): BookingRepository {
  const seedRooms = scheduleRooms.map(toMongoRoomSeed);

  return {
    async listRooms() {
      const adapter = await adapterProvider();
      await adapter.ensureSeedRooms(seedRooms);
      const rooms = await adapter.listRooms();
      return rooms.map(mapMongoRoom);
    },

    async listBookings() {
      const adapter = await adapterProvider();
      await adapter.ensureSeedRooms(seedRooms);
      const bookings = await adapter.listBookings();
      return bookings.map(mapMongoBooking);
    },

    async createBooking(booking) {
      const adapter = await adapterProvider();
      await adapter.ensureSeedRooms(seedRooms);
      const created = await adapter.createBooking(toMongoBookingDocument(booking));
      return mapMongoBooking(created);
    },

    async updateBooking(bookingId, updater) {
      const adapter = await adapterProvider();
      const current = (await adapter.listBookings()).find((booking) => booking._id === bookingId);
      if (!current) {
        throw new Error("Reserva no encontrada.");
      }

      const next = updater(mapMongoBooking(current));
      const updated = await adapter.updateBooking(bookingId, () => toMongoBookingDocument(next, current));
      if (!updated) {
        throw new Error("Reserva no encontrada.");
      }

      return mapMongoBooking(updated);
    },
  };
}
