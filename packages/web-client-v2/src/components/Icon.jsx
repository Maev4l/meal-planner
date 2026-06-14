// Chalk-styled SVG icons. <ChalkSprite/> is rendered once (in App); <Icon name="…"/> references it.
// Glyphs are roughened by a shared feTurbulence+feDisplacementMap filter so strokes look chalk-drawn.
export const ChalkSprite = () => (
  <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
    <defs>
      <filter id="chalk" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <symbol id="ic-meal" viewBox="4 4 40 40">
        <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)">
          <circle cx="24" cy="24" r="8" />
          <path d="M24 24 L24 19" /><path d="M24 24 L29 24" /><circle cx="24" cy="24" r="0.9" fill="currentColor" stroke="none" />
          <path d="M8 8 L8 12.5 Q8 14.8 10 15.5" /><path d="M10 8 L10 15.5" /><path d="M12 8 L12 12.5 Q12 14.8 10 15.5" /><path d="M10 15.5 L10 40" />
          <path d="M40 8 L40 40" /><path d="M40 8 C 35.5 12.5, 35.5 19.5, 40 23" />
        </g>
      </symbol>
      <symbol id="ic-key" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><circle cx="8.5" cy="8.5" r="4" /><path d="M11.4 11.4 L20 20 M16.5 16.5 l2.2 -2.2 M18.5 18.5 l2 -2" /></g></symbol>
      <symbol id="ic-lock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><rect x="5" y="10" width="14" height="9.5" rx="2" /><path d="M8 10 V7.5 a4 4 0 0 1 8 0 V10" /></g></symbol>
      <symbol id="ic-info" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><circle cx="12" cy="12" r="9" /><path d="M12 11 V16" /><path d="M12 8 h0.01" /></g></symbol>
      <symbol id="ic-logout" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M14 5 H6 a1.2 1.2 0 0 0 -1.2 1.2 V17.8 A1.2 1.2 0 0 0 6 19 H14" /><path d="M17 8 l4 4 -4 4 M21 12 H10" /></g></symbol>
      <symbol id="ic-code" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M9 8 L5 12 L9 16 M15 8 l4 4 -4 4" /></g></symbol>
      <symbol id="ic-branch" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><circle cx="6.5" cy="6" r="2.3" /><circle cx="6.5" cy="18" r="2.3" /><circle cx="17.5" cy="8" r="2.3" /><path d="M6.5 8.3 V15.7" /><path d="M17.5 10.3 v1.2 a4.5 4.5 0 0 1 -4.5 4.5 H9" /></g></symbol>
      <symbol id="ic-copy" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15 V5.5 a1.5 1.5 0 0 1 1.5 -1.5 H15" /></g></symbol>
      <symbol id="ic-back" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M15 6 l-6 6 6 6" /></g></symbol>
      <symbol id="ic-gear" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><circle cx="12" cy="12" r="3.2" /><path d="M12 3.5 v2.5 M12 18 v2.5 M3.5 12 h2.5 M18 12 h2.5 M6 6 l1.8 1.8 M16.2 16.2 l1.8 1.8 M18 6 l-1.8 1.8 M7.8 16.2 l-1.8 1.8" /></g></symbol>
      <symbol id="ic-note" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M5 5 h14 v10 l-4 4 H5 z" /><path d="M15 19 v-4 h4 M8 9 h8 M8 12 h5" /></g></symbol>
      <symbol id="ic-google" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M21 12.2 a9 9 0 1 1 -3.2 -6.4" /><path d="M21 12 H12.5" /></g></symbol>
      <symbol id="ic-refresh" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M19 8 a8 8 0 1 0 1.5 6" /><path d="M19 3 v5 h-5" /></g></symbol>
      <symbol id="ic-repeat" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M7 11 V9.5 A2.5 2.5 0 0 1 9.5 7 H16" /><path d="M13.5 4.5 L16.5 7 L13.5 9.5" /><path d="M17 13 v1.5 A2.5 2.5 0 0 1 14.5 17 H8" /><path d="M10.5 14.5 L7.5 17 L10.5 19.5" /></g></symbol>
      <symbol id="ic-sliders" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M4 8.5 H20" /><path d="M4 15.5 H20" /><circle cx="9" cy="8.5" r="2.4" /><circle cx="15" cy="15.5" r="2.4" /></g></symbol>
      <symbol id="ic-eye" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M2 12 C5 6.5 8.5 4.5 12 4.5 C15.5 4.5 19 6.5 22 12 C19 17.5 15.5 19.5 12 19.5 C8.5 19.5 5 17.5 2 12 Z" /><circle cx="12" cy="12" r="3" /></g></symbol>
      <symbol id="ic-eye-off" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M4 4 L20 20" /><path d="M9.6 5 C10.4 4.7 11.2 4.5 12 4.5 C15.5 4.5 19 6.5 22 12 C21.2 13.4 20.3 14.6 19.3 15.6" /><path d="M6.6 7.1 C4.7 8.4 3.2 10 2 12 C5 17.5 8.5 19.5 12 19.5 C13.3 19.5 14.6 19.2 15.8 18.6" /><path d="M9.9 9.9 a3 3 0 0 0 4.2 4.2" /></g></symbol>
    </defs>
  </svg>
);

const Icon = ({ name, className = 'w-6 h-6', title }) => (
  <svg className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
    <use href={`#ic-${name}`} />
  </svg>
);

export default Icon;
