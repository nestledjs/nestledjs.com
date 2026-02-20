function LogomarkPaths() {
  return (
    <g>
      <path
        className="fill-cyan-600"
        d="M212.76,432.85c-105.45-.74-197.05-82.76-210.87-186.92C-12.22,139.55,53.89,38.05,157,9.34l-22.35,14.03C83.56,60.91,53.82,122.62,58.06,186.43c8.61,129.38,144.85,211.42,263.62,156.6,60.06-27.72,102.61-87.96,107.08-154.17,2.41,8.8,2.72,19.02,2.71,28.25-.19,119.06-96.99,215-215.71,215.75-1,0-2,0-3,0Z"
      />
      <path
        className="fill-[#0ea5a4]"
        d="M74.77,221.35c47.96,92.21,171.67,114.79,248.76,43.51,80.88-74.79,62.01-207.19-34.76-257.51,63.59,16.75,113.57,71.2,125.34,135.91,22.36,123.01-86.08,228.28-208.43,202.43-62.41-13.18-114.72-62.63-130.9-124.34Z"
      />
      <path
        className="fill-cyan-600"
        d="M301.05,27.07c60.27,42.45,79.54,123.79,45.06,189.38-40.26,76.58-139.73,102.19-211.85,53.65l.75-.25c5.75,1.6,11.74,3.43,17.63,4.37,112.44,17.97,208.17-104.08,151.54-206.42C279.87,23.83,230.54.63,180.77,4.6c40.88-11.04,85.99-1.69,120.28,22.46Z"
      />
      <circle className="fill-[#f8951d]" cx="173.26" cy="162.91" r="95.13" />
    </g>
  )
}

export function Logomark(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 431.48 432.85" fill="none" {...props}>
      <LogomarkPaths />
    </svg>
  )
}

export function Logo(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <div className="flex items-center gap-3">
      <svg
        aria-hidden="true"
        viewBox="0 0 431.48 432.85"
        className="h-9 w-9"
        fill="none"
        {...props}
      >
        <LogomarkPaths />
      </svg>
      <span className="font-condensed text-2xl font-bold tracking-wider text-slate-700 dark:text-slate-200">
        NESTLED
      </span>
    </div>
  )
}
