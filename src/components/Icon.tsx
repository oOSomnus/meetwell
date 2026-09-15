import type { SVGProps } from 'react'

export type IconName =
  | 'alert-circle'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'calendar'
  | 'check'
  | 'clock'
  | 'close'
  | 'download'
  | 'edit'
  | 'globe'
  | 'help-circle'
  | 'language'
  | 'more-horizontal'
  | 'plus'
  | 'repeat'
  | 'save'
  | 'search'
  | 'settings'
  | 'star'
  | 'trash'
  | 'upload'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export default function Icon({ name, size = 16, ...props }: IconProps) {
  const common = {
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {name === 'alert-circle' ? (
        <>
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M12 8v4" {...common} />
          <path d="M12 16h.01" {...common} />
        </>
      ) : null}
      {name === 'arrow-right' ? <path d="M5 12h14m-6-6 6 6-6 6" {...common} /> : null}
      {name === 'arrow-up-right' ? <path d="M7 17 17 7m-8 0h8v8" {...common} /> : null}
      {name === 'calendar' ? (
        <>
          <rect x="3.5" y="5" width="17" height="16" rx="2" {...common} />
          <path d="M7 3.5v3M17 3.5v3M3.5 9.5h17" {...common} />
        </>
      ) : null}
      {name === 'check' ? <path d="m5 12.5 4.5 4.5L19 7.5" {...common} /> : null}
      {name === 'clock' ? (
        <>
          <circle cx="12" cy="12" r="8.5" {...common} />
          <path d="M12 7v5l3.5 2" {...common} />
        </>
      ) : null}
      {name === 'close' ? <path d="m6 6 12 12M18 6 6 18" {...common} /> : null}
      {name === 'download' ? (
        <>
          <path d="M12 4v11m-4-4 4 4 4-4M5 20h14" {...common} />
        </>
      ) : null}
      {name === 'edit' ? (
        <>
          <path d="m4 16.5-.7 3.7 3.7-.7L18.2 8.3a2.1 2.1 0 0 0-3-3L4 16.5Z" {...common} />
          <path d="m13.5 6.5 4 4" {...common} />
        </>
      ) : null}
      {name === 'globe' ? (
        <>
          <circle cx="12" cy="12" r="8.5" {...common} />
          <path d="M3.8 12h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5s-1.1 6.2-3.2 8.5c-2.1-2.3-3.2-5.1-3.2-8.5S9.9 5.8 12 3.5Z" {...common} />
        </>
      ) : null}
      {name === 'help-circle' ? (
        <>
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-.9 1-1.9 1.2-1.9 2.7M12 16.7h.01" {...common} />
        </>
      ) : null}
      {name === 'language' ? (
        <>
          <path d="M4 5.5h8M8 3.5v2M5.5 5.5c.6 3 2.1 5.2 4.5 6.8M4.5 12.5c2.8-.8 5.1-2.5 6.8-5" {...common} />
          <path d="m14 19 3.2-8 3.2 8M15.1 16.3h4.2" {...common} />
        </>
      ) : null}
      {name === 'more-horizontal' ? (
        <>
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="19" cy="12" r="1" fill="currentColor" />
        </>
      ) : null}
      {name === 'plus' ? <path d="M12 5v14M5 12h14" {...common} /> : null}
      {name === 'repeat' ? <path d="M17 4.5 20 7l-3 2.5M4 7h16M7 19.5 4 17l3-2.5M20 17H4" {...common} /> : null}
      {name === 'save' ? (
        <>
          <path d="M5 4h11l3 3v13H5V4Z" {...common} />
          <path d="M8 4v5h7V4M8 20v-6h8v6" {...common} />
        </>
      ) : null}
      {name === 'search' ? <path d="m20 20-4.4-4.4m2-4.1a6.1 6.1 0 1 1-12.2 0 6.1 6.1 0 0 1 12.2 0Z" {...common} /> : null}
      {name === 'settings' ? (
        <>
          <circle cx="12" cy="12" r="3" {...common} />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.46 15a1.7 1.7 0 0 0-1.56-1.03h-.2v-2.4h.2A1.7 1.7 0 0 0 8.46 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10c.24.62.84 1.03 1.5 1.03h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z" {...common} />
        </>
      ) : null}
      {name === 'star' ? <path d="m12 4 2.45 4.96 5.47.8-3.96 3.86.94 5.45L12 16.5l-4.9 2.57.94-5.45-3.96-3.86 5.47-.8L12 4Z" {...common} /> : null}
      {name === 'trash' ? (
        <>
          <path d="M4.5 7h15M9 4h6l1 3H8l1-3ZM7 7l.8 13h8.4L17 7M10 10.5v6M14 10.5v6" {...common} />
        </>
      ) : null}
      {name === 'upload' ? (
        <>
          <path d="M12 15V4m-4 4 4-4 4 4M5 20h14" {...common} />
        </>
      ) : null}
    </svg>
  )
}
