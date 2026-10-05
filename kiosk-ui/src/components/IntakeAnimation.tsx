/** Instructional loop only: illustrates inserting one empty item, not a sensor result. */
export function IntakeAnimation() {
  return <div className="intake-art" aria-hidden="true"><svg viewBox="0 0 340 218" role="presentation">
    <defs>
      <linearGradient id="intakeBottle" x1="0" x2="1"><stop stopColor="#c0e4dc"/><stop offset=".45" stopColor="#f1fffa"/><stop offset="1" stopColor="#9bc9be"/></linearGradient>
      <linearGradient id="intakeCan" x1="0" x2="1"><stop stopColor="#9baeb6"/><stop offset=".45" stopColor="#f0f6f7"/><stop offset="1" stopColor="#b2c3ca"/></linearGradient>
      <linearGradient id="intakeFrame" x2="0" y2="1"><stop stopColor="#fafff9"/><stop offset="1" stopColor="#dcebdc"/></linearGradient>
      <clipPath id="intakeClip"><rect x="70" y="0" width="200" height="174" rx="24"/></clipPath>
    </defs>
    <circle cx="170" cy="94" r="78" fill="#e0f0e6" opacity=".6"/>
    <circle className="intake-ring" cx="170" cy="94" r="83" fill="none" stroke="#a3c2ae" strokeDasharray="3 8"/>
    <g className="intake-sparkles" fill="#9ab684"><path d="m78 47 4-10 4 10 10 4-10 4-4 10-4-10-10-4Z"/><path d="m248 99 3-7 3 7 7 3-7 3-3 7-3-7-7-3Z"/></g>
    <ellipse className="intake-shadow" cx="170" cy="176" rx="46" ry="7" fill="#345c43" opacity=".14"/>
    <g clipPath="url(#intakeClip)">
      <g className="intake-bottle">
        <rect x="155" y="21" width="30" height="12" rx="4" fill="#558670"/>
        <path d="M159 33h22v17c0 8 19 17 19 29v61c0 10-7 14-15 14h-30c-8 0-15-4-15-14V79c0-12 19-21 19-29Z" fill="url(#intakeBottle)" stroke="#87b4a7" strokeWidth="1.5"/>
        <path d="M141 91h58M141 128h58" stroke="#b2d4c8" strokeWidth="2"/>
        <rect x="142" y="93" width="56" height="33" rx="4" fill="#518674"/>
        <path d="M165 104c17-5 15 12 2 12-8 0-8-9-2-12Z" fill="#e5f5e3"/><path d="m160 120 13-13" stroke="#e5f5e3" strokeWidth="2" strokeLinecap="round"/>
        <path d="M151 78v9m0 47v9M164 42v10" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".8"/>
      </g>
      <g className="intake-can">
        <rect x="142" y="54" width="56" height="92" rx="13" fill="url(#intakeCan)" stroke="#94a9ab" strokeWidth="1.5"/>
        <ellipse cx="170" cy="58" rx="27" ry="7" fill="#dee7e6" stroke="#94a9ab"/>
        <ellipse cx="170" cy="59" rx="8" ry="3" fill="none" stroke="#84989c" strokeWidth="2"/>
        <path d="M143 80h54v45h-54Z" fill="#b6c58e"/>
        <path d="m162 94 9-4 8 9-7 12-13-3Z" fill="none" stroke="#faffed" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M151 72v65" stroke="white" strokeWidth="3" opacity=".45"/>
      </g>
    </g>
    <rect x="71" y="165" width="198" height="37" rx="18" fill="url(#intakeFrame)" stroke="#b1ccb5" strokeWidth="1.5"/>
    <rect x="92" y="168" width="156" height="9" rx="4.5" fill="#355e48"/>
    <path d="M111 170h118" stroke="#70967a" strokeWidth="2" strokeLinecap="round"/>
    <g className="intake-chevron" stroke="#659177" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="m252 136 5 5 5-5m-5-7v12"/></g>
    <text x="170" y="191" textAnchor="middle" fill="#54735c" fontSize="10" fontFamily="Prompt,sans-serif" fontWeight="600">ช่องรับด้านหน้า · ทีละ 1 ชิ้น</text>
  </svg><span className="intake-caption">ขวด PET หรือกระป๋อง • เทน้ำให้หมดก่อนหยอด</span></div>;
}
