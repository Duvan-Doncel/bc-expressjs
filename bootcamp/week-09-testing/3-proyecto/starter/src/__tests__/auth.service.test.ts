// ============================================================
// UNIT TESTS — auth.service.ts
// ============================================================
// Se mockean el repositorio de usuarios, bcrypt y la firma del JWT:
// no se prueba la libreria, solo las decisiones del servicio.
// ============================================================

import { Types } from 'mongoose';

jest.mock('../repositories/users.repository');
jest.mock('bcrypt');
jest.mock('../utils/jwt');

import bcrypt from 'bcrypt';
import * as usersRepo from '../repositories/users.repository';
import * as jwtUtils from '../utils/jwt';
import * as authService from '../services/auth.service';
import type { IUser } from '../models/user.model';

const mockFindByEmail = usersRepo.findUserByEmail as jest.MockedFunction<typeof usersRepo.findUserByEmail>;
const mockFindByEmailWithPassword = usersRepo.findUserByEmailWithPassword as jest.MockedFunction<
  typeof usersRepo.findUserByEmailWithPassword
>;
const mockCreateUser = usersRepo.createUser as jest.MockedFunction<typeof usersRepo.createUser>;
const mockFindById = usersRepo.findUserById as jest.MockedFunction<typeof usersRepo.findUserById>;
const mockHash = bcrypt.hash as jest.MockedFunction<(data: string, rounds: number) => Promise<string>>;
const mockCompare = bcrypt.compare as jest.MockedFunction<(data: string, encrypted: string) => Promise<boolean>>;
const mockSign = jwtUtils.signAccessToken as jest.MockedFunction<typeof jwtUtils.signAccessToken>;

const USER_ID = new Types.ObjectId();
const seller: IUser = {
  _id: USER_ID,
  name: 'Dona Rosa',
  email: 'dona.rosa@mercado.co',
  password: '$2b$12$hash',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const registerDto = { name: 'Dona Rosa', email: 'dona.rosa@mercado.co', password: 'Campesina2026' };

describe('AuthService — Unit Tests', () => {
  describe('register()', () => {
    it('hashea la contraseña y crea al usuario como vendedor', async () => {
      mockFindByEmail.mockResolvedValue(null);
      mockHash.mockResolvedValue('$2b$12$hash');
      mockCreateUser.mockResolvedValue(seller);

      const result = await authService.register(registerDto);

      expect(mockHash).toHaveBeenCalledWith('Campesina2026', 12);
      expect(mockCreateUser).toHaveBeenCalledWith({ ...registerDto, password: '$2b$12$hash', role: 'user' });
      expect(result).toEqual({ id: USER_ID.toString(), name: 'Dona Rosa', email: 'dona.rosa@mercado.co', role: 'user' });
      expect(result).not.toHaveProperty('password');
    });

    it('lanza AppError 409 si el email ya esta registrado', async () => {
      mockFindByEmail.mockResolvedValue(seller);

      await expect(authService.register(registerDto)).rejects.toMatchObject({ statusCode: 409 });
      expect(mockHash).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });

  describe('login()', () => {
    it('devuelve el accessToken con el rol del usuario', async () => {
      mockFindByEmailWithPassword.mockResolvedValue(seller);
      mockCompare.mockResolvedValue(true);
      mockSign.mockReturnValue('jwt.firmado.token');

      const result = await authService.login({ email: seller.email, password: 'Campesina2026' });

      expect(mockSign).toHaveBeenCalledWith({ sub: USER_ID.toString(), role: 'user' });
      expect(result.accessToken).toBe('jwt.firmado.token');
      expect(result.user.role).toBe('user');
    });

    it('lanza AppError 401 con contraseña invalida', async () => {
      mockFindByEmailWithPassword.mockResolvedValue(seller);
      mockCompare.mockResolvedValue(false);

      await expect(authService.login({ email: seller.email, password: 'Otra2026' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciales invalidas',
      });
      expect(mockSign).not.toHaveBeenCalled();
    });

    it('lanza el MISMO AppError 401 si el email no existe (sin user enumeration)', async () => {
      mockFindByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login({ email: 'nadie@mercado.co', password: 'x' })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciales invalidas',
      });
      expect(mockCompare).not.toHaveBeenCalled();
    });
  });

  describe('getMe()', () => {
    it('devuelve el perfil publico del usuario', async () => {
      mockFindById.mockResolvedValue(seller);

      const result = await authService.getMe(USER_ID.toString());

      expect(result).toEqual({ id: USER_ID.toString(), name: 'Dona Rosa', email: 'dona.rosa@mercado.co', role: 'user' });
    });

    it('lanza AppError 404 si el usuario ya no existe', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(authService.getMe(USER_ID.toString())).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
