import { UserModel, type IUser } from '../models/user.model.js';

export async function findUserByEmail(email: string): Promise<IUser | null> {
  return UserModel.findOne({ email }).lean<IUser>().exec();
}

// password tiene select: false: solo el login la pide explicitamente
export async function findUserByEmailWithPassword(email: string): Promise<IUser | null> {
  return UserModel.findOne({ email }).select('+password').lean<IUser>().exec();
}

// Devuelve el usuario creado SIN la contraseña
export async function createUser(
  data: Pick<IUser, 'name' | 'email' | 'password' | 'role'>,
): Promise<Omit<IUser, 'password'>> {
  const user = await UserModel.create(data);
  const { password: _password, ...safeUser } = user.toObject();
  return safeUser;
}

export async function findUserById(id: string): Promise<IUser | null> {
  return UserModel.findById(id).lean<IUser>().exec();
}
