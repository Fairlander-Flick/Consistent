// Lucide-style stroked icons (inline SVG)

const Icon = ({ size = 14, fill = 'none', stroke = 'currentColor', sw = 1.6, children, style, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} {...rest}>
    {children}
  </svg>
)

export const IconDashboard = (p) => <Icon {...p}>
  <rect x="3" y="3" width="7" height="9" rx="1.2"/>
  <rect x="14" y="3" width="7" height="5" rx="1.2"/>
  <rect x="14" y="12" width="7" height="9" rx="1.2"/>
  <rect x="3" y="16" width="7" height="5" rx="1.2"/>
</Icon>

export const IconConsistency = (p) => <Icon {...p}>
  <rect x="3" y="3" width="4" height="4" rx="1"/>
  <rect x="10" y="3" width="4" height="4" rx="1"/>
  <rect x="17" y="3" width="4" height="4" rx="1"/>
  <rect x="3" y="10" width="4" height="4" rx="1"/>
  <rect x="10" y="10" width="4" height="4" rx="1"/>
  <rect x="3" y="17" width="4" height="4" rx="1"/>
</Icon>

export const IconWallet = (p) => <Icon {...p}>
  <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z"/>
  <path d="M16 14h2"/>
  <path d="M2 9V6a2 2 0 0 1 2-2h12"/>
</Icon>

export const IconSun = (p) => <Icon {...p}>
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
</Icon>

export const IconMoon = (p) => <Icon {...p}>
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</Icon>

export const IconPlus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>
export const IconMinus = (p) => <Icon {...p}><path d="M5 12h14"/></Icon>
export const IconCheck = (p) => <Icon {...p}><path d="M5 12l4 4L19 7"/></Icon>
export const IconX = (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>
export const IconChevDown = (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>
export const IconChevRight = (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>
export const IconChevLeft = (p) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>
export const IconArrowUp = (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>
export const IconArrowDown = (p) => <Icon {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Icon>

export const IconTrash = (p) => <Icon {...p}>
  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/>
</Icon>

export const IconEdit = (p) => <Icon {...p}>
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</Icon>

export const IconSettings = (p) => <Icon {...p}>
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</Icon>

export const IconScale = (p) => <Icon {...p}>
  <path d="M3 7h18l-3 11a2 2 0 0 1-2 1.5H8a2 2 0 0 1-2-1.5L3 7z"/>
  <path d="M10 11h4"/>
</Icon>

export const IconTarget = (p) => <Icon {...p}>
  <circle cx="12" cy="12" r="9"/>
  <circle cx="12" cy="12" r="5"/>
  <circle cx="12" cy="12" r="1.5"/>
</Icon>

