import { ClipboardCheck, Calculator, Radio, Trophy } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: ClipboardCheck,
    title: '심사위원 점수 입력',
    description: '모바일 앱으로 즉시 점수 입력. 별도 교육 불필요한 직관적 UI'
  },
  {
    number: '02',
    icon: Calculator,
    title: '자동 집계',
    description: '입력과 동시에 실시간 집계. 수작업 계산 완전 제거'
  },
  {
    number: '03',
    icon: Radio,
    title: '실시간 공개',
    description: '참가자와 관객이 현황을 즉시 확인. 문의 폭주 방지'
  },
  {
    number: '04',
    icon: Trophy,
    title: '즉시 시상',
    description: '대회 종료와 동시에 시상 진행. 대기 시간 제로'
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-[#0F2A44] mb-4">
            사용 시나리오
          </h2>
          <p className="text-lg text-gray-600">
            대회 시작부터 시상까지, 4단계로 완성되는 완벽한 운영
          </p>
        </div>
        
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] opacity-20" style={{ width: '85%', margin: '0 auto' }} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 h-full">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center mb-4 shadow-md relative z-10">
                        <span className="text-[#0F2A44] font-bold text-xl">
                          {step.number}
                        </span>
                      </div>
                      
                      <div className="w-14 h-14 bg-[#0F2A44] rounded-lg flex items-center justify-center mb-6">
                        <Icon className="w-7 h-7 text-[#D4AF37]" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-[#0F2A44] mb-3">
                        {step.title}
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-16 bg-white p-8 rounded-xl shadow-sm border-2 border-[#D4AF37]/20">
          <p className="text-center text-xl text-gray-700">
            <span className="font-bold text-[#0F2A44]">소요 시간:</span> 전체 프로세스 <span className="text-[#D4AF37] font-bold">5분 이내 완료</span>
          </p>
        </div>
      </div>
    </section>
  );
}
