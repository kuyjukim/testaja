import { ArrowRight, Phone, Mail } from 'lucide-react';

interface FinalCTASectionProps {
  onCtaClick: () => void;
}

export function FinalCTASection({ onCtaClick }: FinalCTASectionProps) {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-[#0F2A44] via-[#1a4068] to-[#0F2A44]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center text-white mb-12">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            대회 운영,<br />
            <span className="text-[#D4AF37]">이제 바꾸셔야 합니다</span>
          </h2>
          <p className="text-xl lg:text-2xl text-gray-300 mb-12 leading-relaxed">
            더 이상 지연과 오류로 시간을 낭비하지 마세요.<br />
            AWARDY로 대회 운영의 새로운 기준을 경험하세요.
          </p>
          
          <button
            onClick={onCtaClick}
            className="group bg-[#D4AF37] text-[#0F2A44] px-10 py-5 rounded-lg font-bold text-xl hover:bg-[#C5A028] transition-all duration-200 inline-flex items-center gap-3 shadow-xl hover:shadow-2xl mb-12"
          >
            상담 요청하기
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="border-t border-white/20 pt-12">
            <p className="text-gray-300 mb-6 text-lg">
              궁금한 점이 있으신가요? 언제든 문의해 주세요.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white">
              <a href="tel:1234567890" className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors">
                <Phone className="w-5 h-5" />
                <span className="text-lg">02-1234-5678</span>
              </a>
              <span className="hidden sm:block text-gray-500">|</span>
              <a href="mailto:contact@awardy.com" className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors">
                <Mail className="w-5 h-5" />
                <span className="text-lg">contact@awardy.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
