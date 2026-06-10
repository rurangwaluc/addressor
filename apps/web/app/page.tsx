import CategoryDiscoverySection from "@/components/landing/CategoryDiscoverySection";
import CompactWorkflowTrustSection from "@/components/landing/CompactWorkflowTrustSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import HeroSection from "@/components/landing/HeroSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <main className="relative">
      <HeroSection />
      <CategoryDiscoverySection />
      <CompactWorkflowTrustSection />
      <FinalCTASection />
      <LandingFooter />
    </main>
  );
}