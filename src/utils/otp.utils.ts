export const generateOtp = (): string =>
  Math.floor(1000 + Math.random() * 9000).toString();

export const getOtpExpiry = (minutes = 5): Date =>
  new Date(Date.now() + minutes * 60 * 1000);
