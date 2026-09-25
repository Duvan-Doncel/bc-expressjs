// src/models/user.model.ts - Usuarios del mercado campesino (vendedores del puesto y administrador)
import mongoose, { Document, Schema } from 'mongoose';

// 'user'  -> vendedor del puesto: consulta y registra productos
// 'admin' -> administrador del mercado (se usara para autorizacion en la semana 08)
export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [120, 'El email no puede superar 120 caracteres'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      select: false, // nunca se devuelve en queries por defecto
    },
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      maxlength: [80, 'El nombre no puede superar 80 caracteres'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    refreshToken: {
      type: String,
      select: false, // hash del refresh token; nunca se devuelve por defecto
    },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
