// Miro format icons with brand colors

interface FormatIconProps {
  format: string;
  size?: number;
  className?: string;
}

// Format color configuration (Miro brand colors)
const formatColors: Record<string, string> = {
  diagram: '#7B68EE',      // Purple
  flowchart: '#7B68EE',    // Purple (same as diagram)
  document: '#4A90D9',     // Blue
  doc: '#4A90D9',          // Blue (alias)
  prototype: '#E91E8C',    // Pink/Magenta
  slides: '#F5A623',       // Orange
  table: '#00B388',        // Teal/Green
  timeline: '#FF6B6B',     // Coral/Red
  kanban: '#9B59B6',       // Purple
  stickies: '#FFD93D',     // Yellow
  mindmap: '#00D4AA',      // Mint
  erd: '#6366F1',          // Indigo
  image: '#EC4899',        // Pink
};

const defaultColor = '#6B7280'; // Gray for unknown formats

export default function FormatIcon({ format, size = 20, className = '' }: FormatIconProps) {
  const normalizedFormat = format.toLowerCase();
  const color = formatColors[normalizedFormat] || defaultColor;

  // SVG icons from Miro
  const icons: Record<string, JSX.Element> = {
    diagram: (
      <path fill={color} fillRule="evenodd" d="M18.5 2A2.5 2.5 0 0 1 21 4.5v3a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 13 7.5V6h-3a2.999 2.999 0 0 0-2.826 2H7.5a2.5 2.5 0 0 1 2.5 2.5v3A2.5 2.5 0 0 1 7.5 16H7a2 2 0 0 0 2 2h4v-1.5a2.5 2.5 0 0 1 2.5-2.5h3a2.5 2.5 0 0 1 2.5 2.5v3a2.5 2.5 0 0 1-2.5 2.5h-3a2.501 2.501 0 0 1-2.45-2H9a4 4 0 0 1-4-4h-.5A2.5 2.5 0 0 1 2 13.5v-3A2.5 2.5 0 0 1 4.5 8h.6A5.003 5.003 0 0 1 10 4h3.05a2.5 2.5 0 0 1 2.45-2h3Zm-3 14a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3Zm-11-6a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3Zm11-6a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3Z" clipRule="evenodd" />
    ),
    flowchart: (
      <path fill={color} fillRule="evenodd" d="M18.5 2A2.5 2.5 0 0 1 21 4.5v3a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 13 7.5V6h-3a2.999 2.999 0 0 0-2.826 2H7.5a2.5 2.5 0 0 1 2.5 2.5v3A2.5 2.5 0 0 1 7.5 16H7a2 2 0 0 0 2 2h4v-1.5a2.5 2.5 0 0 1 2.5-2.5h3a2.5 2.5 0 0 1 2.5 2.5v3a2.5 2.5 0 0 1-2.5 2.5h-3a2.501 2.501 0 0 1-2.45-2H9a4 4 0 0 1-4-4h-.5A2.5 2.5 0 0 1 2 13.5v-3A2.5 2.5 0 0 1 4.5 8h.6A5.003 5.003 0 0 1 10 4h3.05a2.5 2.5 0 0 1 2.45-2h3Zm-3 14a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3Zm-11-6a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3Zm11-6a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3Z" clipRule="evenodd" />
    ),
    document: (
      <path fill={color} fillRule="evenodd" d="M5 5a1 1 0 0 1 1-1h9.586L19 7.414V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5Zm1-3a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6.586L16.414 2H6Zm1 7h7V7H7v2Zm0 4h10v-2H7v2Zm0 4h10v-2H7v2Z" clipRule="evenodd" />
    ),
    doc: (
      <path fill={color} fillRule="evenodd" d="M5 5a1 1 0 0 1 1-1h9.586L19 7.414V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5Zm1-3a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6.586L16.414 2H6Zm1 7h7V7H7v2Zm0 4h10v-2H7v2Zm0 4h10v-2H7v2Z" clipRule="evenodd" />
    ),
    prototype: (
      <path fill={color} d="M17 5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5Zm-3 1v2h-4V6h4Zm5 13a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v14Z" />
    ),
    slides: (
      <path fill={color} d="M17 9v2h-3V9h3Zm0 4v2h-3v-2h3Zm-5.857-1.514a.6.6 0 0 1 0 1.028l-3.234 1.94A.6.6 0 0 1 7 13.94v-3.88a.6.6 0 0 1 .909-.515l3.234 1.94ZM19 4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h14ZM5 6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5Z" />
    ),
    table: (
      <path fill={color} fillRule="evenodd" d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5ZM4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3H4V5Zm7 5h9v4h-9v-4Zm-2 4v-4H4v4h5Zm-5 2h5v4H5a1 1 0 0 1-1-1v-3Zm7 0h9v3a1 1 0 0 1-1 1h-8v-4Z" clipRule="evenodd" />
    ),
    timeline: (
      <path fill={color} fillRule="evenodd" d="M11 16a2 2 0 0 1 1.99 1.796L13 18v2a2 2 0 0 1-2 2H7a2 2 0 0 1-1.99-1.796L5 20v-2l.01-.204a2 2 0 0 1 1.785-1.785L7 16h4Zm0 2H7v2h4v-2Zm9-9a2 2 0 0 1 1.99 1.796L22 11v2a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-2l.01-.204a2 2 0 0 1 1.786-1.785L11 9h9Zm0 2h-9v2h9v-2Zm-9-9a2 2 0 0 1 1.99 1.796L13 4v2l-.01.204A2 2 0 0 1 11 8H4l-.204-.01A2 2 0 0 1 2.01 6.203L2 6V4l.01-.204A2 2 0 0 1 3.795 2.01L4 2h7Zm0 2H4v2h7V4Z" clipRule="evenodd" />
    ),
    kanban: (
      <path fill={color} fillRule="evenodd" d="M19.5 2A2.5 2.5 0 0 1 22 4.5v9a2.5 2.5 0 0 1-2.5 2.5H13v3a3 3 0 0 1-3 3H4.5A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2h15ZM5 4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4H5Zm8 0v10h6a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-6Z" clipRule="evenodd" />
    ),
    stickies: (
      <path fill={color} fillRule="evenodd" d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5v3a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V4Zm2 0h12v12h-5a1 1 0 0 0-1 1v3H6V4Z" clipRule="evenodd" />
    ),
    mindmap: (
      <path fill={color} fillRule="evenodd" d="M12 2a3 3 0 0 1 3 3v1.17a3.001 3.001 0 0 1 2.83 2.83H19a3 3 0 1 1 0 6h-1.17a3.001 3.001 0 0 1-2.83 2.83V19a3 3 0 1 1-6 0v-1.17a3.001 3.001 0 0 1-2.83-2.83H5a3 3 0 1 1 0-6h1.17A3.001 3.001 0 0 1 9 6.17V5a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 1 1-1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2a1 1 0 0 1-1-1V5a1 1 0 0 0-1-1Z" clipRule="evenodd" />
    ),
    erd: (
      <path fill={color} fillRule="evenodd" d="M4 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm2 0h4v4H6V5Zm6 8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4Zm2 0h4v4h-4v-4ZM4 13a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4Zm2 0h4v4H6v-4Z" clipRule="evenodd" />
    ),
    image: (
      <path fill={color} fillRule="evenodd" d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm2 0h12v9l-3.5-3.5a1 1 0 0 0-1.4 0L9 14.5l-1.5-1.5a1 1 0 0 0-1.4 0L4 15V5h2Zm0 14h12v-1.6l-4.2-4.2L9 18l-1.5-1.5L4 20h2v-1ZM8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    ),
  };

  // Default icon for unknown formats
  const defaultIcon = (
    <path fill={color} fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Zm-1-13h2v6h-2V7Zm0 8h2v2h-2v-2Z" clipRule="evenodd" />
  );

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      {icons[normalizedFormat] || defaultIcon}
    </svg>
  );
}

// Export color getter for use in other components
export function getFormatColor(format: string): string {
  return formatColors[format.toLowerCase()] || defaultColor;
}
