import { User, IUser, UserRole } from '../models/user.model.js';
import { toAppError } from '../errors/mongoErrors.js';

export async function findUserByEmail(email: string): Promise<IUser | null> {
  return User.findOne({ email });
}

export async function findUserByEmailWithPassword(email: string): Promise<IUser | null> {
  // password tiene select: false, hay que pedirla explicitamente
  return User.findOne({ email }).select('+password');
}

export async function findUserByIdWithRefresh(id: string): Promise<IUser | null> {
  return User.findById(id).select('+refreshToken');
}

export async function findUserById(id: string): Promise<IUser | null> {
  try {
    return await User.findById(id);
  } catch (err) {
    throw toAppError(err, 'usuario');
  }
}

export async function listUsers(): Promise<IUser[]> {
  return User.find().sort({ createdAt: -1 });
}

export async function createUser(data: { name: string; email: string; password: string }): Promise<IUser> {
  try {
    return await User.create(data);
  } catch (err) {
    throw toAppError(err, 'usuario');
  }
}

export async function updateRole(id: string, role: UserRole): Promise<IUser | null> {
  try {
    return await User.findByIdAndUpdate(id, { role }, { returnDocument: 'after', runValidators: true });
  } catch (err) {
    throw toAppError(err, 'usuario');
  }
}

export async function updateRefreshToken(userId: string, hashedToken: string | null): Promise<void> {
  await User.findByIdAndUpdate(userId, { refreshToken: hashedToken });
}
