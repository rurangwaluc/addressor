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
      capabilities: {
        menu: boolean;
        services: boolean;
        products: boolean;
        bookings: boolean;
        orders: boolean;
      };
      role: string;
      teamStatus: string;
    }
  >;
};

export type BusinessOwnerSummaryResponse = {
  business: BusinessOnboardingResponse["business"];
  overview: {
    profileViews: number;
    newBookings: number;
    reviews: number;
    comments: number;
    hasPublishedMenu: boolean;
    subscribers: number;
  };
  attention: Array<{
    title: string;
    text: string;
    action: string;
    href: string;
    priority: "high" | "medium" | "low";
  }>;
};
