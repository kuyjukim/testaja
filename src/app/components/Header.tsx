interface HeaderProps {
  onCtaClick: () => void;
}

export function Header({ onCtaClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a href="#" className="flex items-center gap-3 min-w-0" aria-label="AWARDY 홈">
            <img
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 object-contain shrink-0"
            />
            <span className="text-2xl font-bold text-[#0F2A44]">AWARDY</span>
          </a>
          
          <button
            onClick={onCtaClick}
            className="hidden sm:block bg-[#0F2A44] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a4068] transition-colors"
          >
            상담 요청하기
          </button>
        </div>
      </div>
    </header>
  );
}
