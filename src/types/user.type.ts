import { ObjectId } from "mongoose";

export interface IUser {
  _id?: string;
  role: ("user" | "driver")[];
  phone: string;
  isPhoneVerified: boolean;

  otpReference?: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  driverId: ObjectId;

  onboardingComplete: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
