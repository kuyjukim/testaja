import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onCtaClick: () => void;
}

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section className="relative bg-[#0F2A44] text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-4xl">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
            대회 운영, 아직도<br />
            <span className="text-[#D4AF37]">엑셀과 종이</span>로 하십니까?
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-300 mb-12 leading-relaxed">
            지연, 오류, 혼잡을 한 번에 해결하는<br />
            오프라인 대회 운영 플랫폼
          </p>
          
          <button
            onClick={onCtaClick}
            className="group bg-[#D4AF37] text-[#0F2A44] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#C5A028] transition-all duration-200 inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            상담 요청하기
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-gradient-to-tl from-[#D4AF37]/10 to-transparent pointer-events-none" />
    </section>
  );
}
