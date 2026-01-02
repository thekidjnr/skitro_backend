import jwt, { SignOptions } from "jsonwebtoken";
import { IUser } from "../types/user.type";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const generateToken = (user: IUser) => {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

  const payload = {
    id: user._id?.toString(),
    driverId: user?.driverId,
    phone: user.phone,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: "1y",
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string) => {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

  return jwt.verify(token, JWT_SECRET);
};
