export interface IUser {
  _id?: string;
  role: ("user" | "driver")[];
  phone: string;
  isPhoneVerified: boolean;

  otp?: string;
  otpExpiresAt?: Date;

  firstName?: string;
  lastName?: string;
  email?: string;

  onboardingComplete: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
