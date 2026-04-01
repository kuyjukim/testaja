import { Clock, AlertTriangle, Users, FileSpreadsheet } from 'lucide-react';

const painPoints = [
  {
    icon: Clock,
    title: '지연',
    description: '시상 2~3시간 지연',
    detail: '수기 집계로 인한 대기 시간'
  },
  {
    icon: AlertTriangle,
    title: '오류',
    description: '점수 입력 오류 발생',
    detail: '수작업 입력으로 인한 실수'
  },
  {
    icon: Users,
    title: '혼잡',
    description: '참가자 문의 폭주',
    detail: '진행 상황 불투명으로 인한 혼란'
  },
  {
    icon: FileSpreadsheet,
    title: '반복작업',
    description: '엑셀 10개 이상 관리',
    detail: '비효율적인 데이터 처리'
  }
];

export function PainSection() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-[#0F2A44] mb-4">
            지금 이런 문제로 고민하고 계신가요?
          </h2>
          <p className="text-lg text-gray-600">
            전통적인 대회 운영 방식의 한계
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {painPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="w-14 h-14 bg-red-50 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-[#0F2A44] mb-2">
                  {point.title}
                </h3>
                <p className="text-lg font-semibold text-red-600 mb-2">
                  {point.description}
                </p>
                <p className="text-gray-600">
                  {point.detail}
                </p>
              </div>
            );
          })}
        </div>
        
        <div className="mt-16 bg-white border-l-4 border-red-600 p-8 rounded-lg shadow-sm">
          <p className="text-xl text-gray-700 leading-relaxed">
            <span className="font-bold text-[#0F2A44]">결과:</span> 운영진 피로도 증가, 참가자 불만 발생, 인건비 증가, 대회 평판 하락
          </p>
        </div>
      </div>
    </section>
  );
}
