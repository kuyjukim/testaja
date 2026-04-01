import { Smartphone, Monitor, Zap } from 'lucide-react';

const solutions = [
  {
    icon: Smartphone,
    title: '심사 앱 (Judge App)',
    description: '심사위원이 모바일로 즉시 점수 입력',
    features: ['직관적인 UI', '오프라인 동작 지원', '실시간 동기화']
  },
  {
    icon: Monitor,
    title: '실시간 공개 페이지',
    description: '참가자가 진행 순서와 현황을 실시간 확인',
    features: ['QR 코드 접속', '순서 알림', '투명한 정보 제공']
  },
  {
    icon: Zap,
    title: '자동 점수 집계',
    description: '입력과 동시에 자동 집계 및 순위 산출',
    features: ['오류 제로화', '즉시 결과 확인', '수작업 제거']
  }
];

export function SolutionSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-[#D4AF37]/10 rounded-full mb-6">
            <span className="text-[#D4AF37] font-semibold">해결책</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-[#0F2A44] mb-4">
            AWARDY 하나로<br />대회 운영이 끝납니다
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            참가자 등록부터 시상까지, 모든 과정을 효율화하는 올인원 플랫폼
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-[#0F2A44] to-[#1a4068] p-8 rounded-xl text-white shadow-lg"
              >
                <div className="w-14 h-14 bg-[#D4AF37] rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-[#0F2A44]" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {solution.title}
                </h3>
                <p className="text-gray-300 mb-6">
                  {solution.description}
                </p>
                <ul className="space-y-2">
                  {solution.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-200">
                      <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        
        <div className="bg-[#0F2A44] rounded-2xl p-12 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-2xl lg:text-3xl font-bold mb-4">
              모바일 + 웹 + 관리자 시스템
            </p>
            <p className="text-lg text-gray-300">
            20년 대회 운영 노하우를 담아,<br />
            현장이 멈추지 않도록 설계했습니다
             
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
