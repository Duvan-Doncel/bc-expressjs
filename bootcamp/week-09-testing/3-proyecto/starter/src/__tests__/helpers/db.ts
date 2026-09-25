// Helpers de MongoDB Memory Server para los integration tests
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | undefined;

export async function connectTestDB(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Construye los indices (sku y email unique) antes de empezar
  await Promise.all(Object.values(mongoose.connection.models).map((model) => model.init()));
}

export async function clearTestDB(): Promise<void> {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function closeTestDB(): Promise<void> {
  await mongoose.disconnect();
  await mongod?.stop();
}
