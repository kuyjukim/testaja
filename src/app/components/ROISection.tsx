import { TrendingDown, Clock, DollarSign, Users } from 'lucide-react';

const metrics = [
  {
    icon: Users,
    before: '15명',
    after: '3명',
    label: '운영 인력',
    highlight: '80% 절감'
  },
  {
    icon: Clock,
    before: '2시간',
    after: '즉시',
    label: '시상 대기시간',
    highlight: '100% 단축'
  },
  {
    icon: DollarSign,
    before: '150만원',
    after: '30만원',
    label: '대회당 인건비',
    highlight: '120만원 절감'
  },
  {
    icon: TrendingDown,
    before: '잦은 발생',
    after: '0건',
    label: '점수 오류',
    highlight: '완전 제거'
  }
];

export function ROISection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-[#D4AF37]/10 rounded-full mb-6">
            <span className="text-[#D4AF37] font-semibold">ROI 검증 완료</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-[#0F2A44] mb-4">
            실제 효과는 숫자로 증명됩니다
          </h2>
          <p className="text-lg text-gray-600">
            도입 즉시 확인 가능한 정량적 성과
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border-2 border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-[#0F2A44] rounded-lg flex items-center justify-center mb-6 mx-auto">
                  <Icon className="w-6 h-6 text-[#D4AF37]" />
                </div>
                
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <span className="text-2xl font-bold text-gray-400 line-through">
                      {metric.before}
                    </span>
                    <span className="text-4xl font-bold text-[#0F2A44]">
                      {metric.after}
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium">
                    {metric.label}
                  </p>
                </div>
                
                <div className="bg-[#D4AF37]/10 px-4 py-2 rounded-lg">
                  <p className="text-[#D4AF37] font-bold text-center">
                    {metric.highlight}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-gradient-to-r from-[#0F2A44] to-[#1a4068] rounded-2xl p-12 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-3xl lg:text-4xl font-bold mb-6">
              연간 4회 대회 기준,<br />
              <span className="text-[#D4AF37]">약 480만원 절감</span>
            </p>
            <p className="text-lg text-gray-300">
              인건비 절감 + 오류 감소 + 운영 효율화를 통한 실질적인 비용 절감
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
