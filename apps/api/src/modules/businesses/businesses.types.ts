export type BusinessOnboardingResponse = {
  business: {
    id: string;
    displayName: string;
    legalName: string;
    slug: string;
    category: string;
    shortDescription: string | null;
    phone: string | null;
    email: string | null;
    websiteUrl: string | null;
    whatsappNumber: string | null;
    country: string;
    city: string;
    district: string | null;
    sector: string | null;
    addressLine: string | null;
    verificationStatus: string;
    onboardingStatus: string;
    subscriptionStatus: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
  };
};

export type MyBusinessesResponse = {
  businesses: Array<
    BusinessOnboardingResponse["business"] & {
      role: string;
      teamStatus: string;
    }
  >;
};
