import { Schema, type Model } from "mongoose";
import type { UserRecord } from "@/lib/auth-credentials";
import { getMongooseConnection } from "@/lib/mongoose-connection";

type MongoUserDocument = UserRecord & {
  _id: string;
};

type UserModel = Model<MongoUserDocument>;

function getUserModel(connection: Awaited<ReturnType<typeof getMongooseConnection>>): UserModel {
  const existing = connection.models.SalasUser as UserModel | undefined;
  if (existing) {
    return existing;
  }

  const schema = new Schema<MongoUserDocument>(
    {
      _id: { type: String },
      email: { type: String, required: true, unique: true, index: true },
      name: { type: String, required: true },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ["ADMIN", "USER"], default: "USER" },
    },
    { collection: "users", versionKey: false, timestamps: true },
  );

  return connection.model<MongoUserDocument>("SalasUser", schema);
}

function toRecord(user: MongoUserDocument | null): UserRecord | null {
  if (!user) return null;
  return {
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    role: user.role,
  };
}

export function createMongoUserRepository() {
  return {
    async findByEmail(email: string) {
      const connection = await getMongooseConnection();
      const User = getUserModel(connection);
      const user = await User.findOne({ email }).lean().exec();
      return toRecord(user as MongoUserDocument | null);
    },
    async createUser(user: UserRecord) {
      const connection = await getMongooseConnection();
      const User = getUserModel(connection);
      const created = await User.create({ _id: user.email, ...user });
      return toRecord(created.toObject() as MongoUserDocument)!;
    },
  };
}
