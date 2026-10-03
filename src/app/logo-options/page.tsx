'use client'

function LogoVariant({
  name,
  moonColor1,
  moonColor2,
  circleColor,
}: {
  name: string
  moonColor1: string
  moonColor2: string
  circleColor: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-slate-800 p-8">
      <svg viewBox="0 0 431.48 432.85" fill="none" className="h-32 w-32">
        <g>
          <path
            fill={moonColor1}
            d="M212.76,432.85c-105.45-.74-197.05-82.76-210.87-186.92C-12.22,139.55,53.89,38.05,157,9.34l-22.35,14.03C83.56,60.91,53.82,122.62,58.06,186.43c8.61,129.38,144.85,211.42,263.62,156.6,60.06-27.72,102.61-87.96,107.08-154.17,2.41,8.8,2.72,19.02,2.71,28.25-.19,119.06-96.99,215-215.71,215.75-1,0-2,0-3,0Z"
          />
          <path
            fill={moonColor2}
            d="M74.77,221.35c47.96,92.21,171.67,114.79,248.76,43.51,80.88-74.79,62.01-207.19-34.76-257.51,63.59,16.75,113.57,71.2,125.34,135.91,22.36,123.01-86.08,228.28-208.43,202.43-62.41-13.18-114.72-62.63-130.9-124.34Z"
          />
          <path
            fill={moonColor1}
            d="M301.05,27.07c60.27,42.45,79.54,123.79,45.06,189.38-40.26,76.58-139.73,102.19-211.85,53.65l.75-.25c5.75,1.6,11.74,3.43,17.63,4.37,112.44,17.97,208.17-104.08,151.54-206.42C279.87,23.83,230.54.63,180.77,4.6c40.88-11.04,85.99-1.69,120.28,22.46Z"
          />
          <circle fill={circleColor} cx="173.26" cy="162.91" r="95.13" />
        </g>
      </svg>
      <div className="text-center">
        <p className="font-semibold text-white">{name}</p>
        <p className="mt-1 text-xs text-slate-400">
          Moons: {moonColor1}, {moonColor2}
        </p>
        <p className="text-xs text-slate-400">Circle: {circleColor}</p>
      </div>
    </div>
  )
}

export default function LogoOptionsPage() {
  const variants = [
    {
      name: 'Current (Cyan + Orange)',
      moonColor1: '#0891b2',
      moonColor2: '#0ea5a4',
      circleColor: '#f8951d',
    },
    {
      name: 'Ocean Blues',
      moonColor1: '#3b82f6',
      moonColor2: '#60a5fa',
      circleColor: '#f8951d',
    },
    {
      name: 'Slate Monochrome',
      moonColor1: '#475569',
      moonColor2: '#64748b',
      circleColor: '#f8951d',
    },
    {
      name: 'Indigo Dream',
      moonColor1: '#6366f1',
      moonColor2: '#818cf8',
      circleColor: '#f8951d',
    },
    {
      name: 'Deep Teal',
      moonColor1: '#0d9488',
      moonColor2: '#14b8a6',
      circleColor: '#fbbf24',
    },
    {
      name: 'Purple Haze',
      moonColor1: '#7c3aed',
      moonColor2: '#a78bfa',
      circleColor: '#f472b6',
    },
    {
      name: 'Navy + Gold',
      moonColor1: '#1e3a5f',
      moonColor2: '#2563eb',
      circleColor: '#fbbf24',
    },
    {
      name: 'Emerald Fresh',
      moonColor1: '#059669',
      moonColor2: '#34d399',
      circleColor: '#fbbf24',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 px-8 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold text-white">
        Logo Color Options
      </h1>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
        {variants.map((v) => (
          <LogoVariant key={v.name} {...v} />
        ))}
      </div>
    </div>
  )
}
