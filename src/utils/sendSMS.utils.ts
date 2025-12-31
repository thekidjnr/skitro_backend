import axios from "axios";

interface SendSmsParams {
  phoneNumber: string;
  message: string;
}

export const sendSms = async ({
  phoneNumber,
  message,
}: SendSmsParams): Promise<void> => {
  try {
    await axios.post(
      "https://api.gatekeeperpro.live/api/send_sms",
      {
        phoneNumber,
        message,
      },
      {
        headers: {
          "X-API-Key": process.env.GATEKEEPER_API_KEY as string,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("SMS Service Error:", error?.response?.data || error.message);
    throw new Error("Failed to send SMS");
  }
};
