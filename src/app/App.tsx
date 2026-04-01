import { useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PainSection } from './components/PainSection';
import { SolutionSection } from './components/SolutionSection';
import { FeaturesSection } from './components/FeaturesSection';
import { ROISection } from './components/ROISection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { TrustSection } from './components/TrustSection';
import { FinalCTASection } from './components/FinalCTASection';
import { StickyButton } from './components/StickyButton';
import { ConsultationModal } from './components/ConsultationModal';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleCtaClick = () => {
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
  };
  
  return (
    <div className="min-h-screen bg-white">
      <Header onCtaClick={handleCtaClick} />
      
      <main className="pt-20">
        <HeroSection onCtaClick={handleCtaClick} />
        <PainSection />
        <SolutionSection />
        <FeaturesSection />
        <ROISection />
        <HowItWorksSection />
        <TrustSection />
        <FinalCTASection onCtaClick={handleCtaClick} />
      </main>
      
      <footer className="bg-[#0F2A44] text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <p className="text-2xl font-bold mb-2">AWARDY</p>
            <p className="text-gray-400">오프라인 대회 운영 플랫폼</p>
            <p className="text-gray-500 text-sm mt-8">
              © 2026 AWARDY. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      <StickyButton onClick={handleCtaClick} />
      <ConsultationModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
}
