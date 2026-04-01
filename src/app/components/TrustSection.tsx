import { CheckCircle2, Target, Wrench } from 'lucide-react';

const trustPoints = [
  {
    icon: CheckCircle2,
    title: '실제 대회 운영 경험 기반',
    description: '현장에서 직접 겪은 문제를 해결하기 위해 개발된 솔루션입니다.'
  },
  {
    icon: Target,
    title: '현장 문제 해결 중심 설계',
    description: '화려한 기능이 아닌, 실무에서 즉시 사용 가능한 기능만 담았습니다.'
  },
  {
    icon: Wrench,
    title: '지속적인 업데이트',
    description: '현장 피드백을 즉시 반영하여 더 나은 솔루션으로 발전합니다.'
  }
];

export function TrustSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-[#0F2A44] mb-4">
            왜 AWARDY를 선택해야 하나요?
          </h2>
          <p className="text-lg text-gray-600">
            현장 경험이 만든 실전형 솔루션
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {trustPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200 hover:border-[#D4AF37]/40 transition-all duration-200"
              >
                <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F2A44] mb-3">
                  {point.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>
        
        <div className="bg-[#0F2A44] rounded-2xl p-12 text-white">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-[#D4AF37] mb-2">100%</p>
                <p className="text-gray-300">현장 검증 완료</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#D4AF37] mb-2">5분</p>
                <p className="text-gray-300">도입 및 세팅 시간</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-[#D4AF37] mb-2">24/7</p>
                <p className="text-gray-300">기술 지원</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
