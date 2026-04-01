import { 
  Calculator, 
  Radio, 
  UserMinus, 
  ShieldCheck, 
  Trophy 
} from 'lucide-react';

const features = [
  {
    icon: Calculator,
    title: '실시간 점수 입력 및 자동 집계',
    description: '심사위원이 입력한 점수가 즉시 집계되어 순위가 자동 산출됩니다. 수작업 계산은 이제 필요 없습니다.'
  },
  {
    icon: Radio,
    title: '진행 순서 실시간 공개',
    description: '참가자와 관객이 언제든지 현재 진행 상황과 다음 순서를 확인할 수 있어 대기 불안이 사라집니다.'
  },
  {
    icon: UserMinus,
    title: '스태프 의존도 감소',
    description: '자동화된 시스템으로 운영 인력을 대폭 줄이고, 핵심 업무에만 집중할 수 있습니다.'
  },
  {
    icon: ShieldCheck,
    title: '오류 방지 구조',
    description: '입력 검증 및 자동 계산으로 사람의 실수를 원천 차단합니다. 점수 정확도 99.9%를 보장합니다.'
  },
  {
    icon: Trophy,
    title: '대회 종료 즉시 결과 발표',
    description: '마지막 심사가 끝나는 순간 바로 시상이 가능합니다. 2~3시간 대기는 이제 과거입니다.'
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-[#0F2A44] mb-4">
            핵심 기능
          </h2>
          <p className="text-lg text-gray-600">
            대회 운영의 모든 과정을 효율화하는 5가지 핵심 기능
          </p>
        </div>
        
        <div className="space-y-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-[#0F2A44] rounded-lg flex items-center justify-center">
                    <Icon className="w-7 h-7 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl lg:text-2xl font-bold text-[#0F2A44] mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
