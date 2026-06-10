export default class BetterAuthSDK {
  secret: string;
  baseUrl: string;

  constructor(opts: { secret: string; baseUrl: string }) {
    this.secret = opts.secret;
    this.baseUrl = opts.baseUrl;
  }

  async signup({ email, phone, password }: { email: string; phone: string; password: string }) {
    return { id: crypto.randomUUID(), email, phone };
  }

  async login({ email, password }: { email: string; password: string }) {
    return { email, accessToken: "dummy-token", emailVerified: true, phoneVerified: true };
  }

  async sendEmailVerification(userId: string) {}
  async sendPhoneVerification(userId: string) {}
  async verifyEmail(userId: string, token: string) {}
  async verifyPhone(userId: string, otp: string) {}
}