// src/models/user.model.ts - Usuarios del mercado campesino
import { Schema, model, Document } from 'mongoose';

// 'user'  -> vendedor del puesto: registra productos y edita SOLO los suyos
// 'admin' -> administrador del mercado: edita y elimina cualquier producto, gestiona usuarios
export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      maxlength: [80, 'El nombre no puede superar 80 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [120, 'El email no puede superar 120 caracteres'],
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'user' },
    // Hash de sha256(refreshToken) con bcrypt; nunca el token en claro
    refreshToken: { type: String, select: false },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
