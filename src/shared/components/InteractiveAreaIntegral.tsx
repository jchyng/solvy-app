interface Props {
  fn?: string
  a?: number
  b?: number
  width?: number
  height?: number
}

export function InteractiveAreaIntegral({ fn = 'f(x)', a = 0, b = 1, width = 200, height = 120 }: Props) {
  return (
    <div
      style={{
        background: 'var(--bg-sunken)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        display: 'inline-block',
      }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-label={`∫${a}^${b} ${fn} dx`}>
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--ink-3)"
          fontSize="16"
          fontFamily="var(--font-mono)"
        >
          {`∫${a}^${b} ${fn} dx`}
        </text>
      </svg>
    </div>
  )
}
