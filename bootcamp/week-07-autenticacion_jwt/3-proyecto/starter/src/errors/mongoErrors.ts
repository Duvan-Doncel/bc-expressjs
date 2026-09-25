// src/errors/mongoErrors.ts - Traduce errores de Mongoose/MongoDB a AppError
import mongoose from 'mongoose';
import { AppError } from './AppError';

export function toAppError(err: unknown, entity: string): unknown {
  // _id con formato invalido (ej. 'abc123') -> 400
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, 'ID invalido');
  }
  // Violacion de indice unique -> 409
  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
    const keyValue = (err['keyValue'] as Record<string, unknown> | undefined) ?? {};
    const field = Object.keys(keyValue)[0] ?? 'valor';
    return new AppError(409, `Ya existe un(a) ${entity} con ese ${field}`);
  }
  // Validadores del Schema (min, max, enum...) -> 400
  if (err instanceof mongoose.Error.ValidationError) {
    const first = Object.values(err.errors)[0];
    return new AppError(400, first?.message ?? 'Datos invalidos');
  }
  return err;
}
