function LogomarkPaths() {
  return (
    <g>
      <path className="fill-slate-700 dark:fill-sky-400" d="M213.5,433.49c-83.02-.71-162.19-53.67-194.67-129.58C-32.97,182.84,31.91,45.81,157.74,9.99c-43.25,23.51-77.09,63.61-91.37,111.13-27.97,93.08,20.74,192.95,111.38,227.38,116.46,44.24,242.25-35.78,251.76-159,2.42,8.8,2.71,19.01,2.7,28.25-.09,119-97.08,215.03-215.71,215.75-1,0-2,0-3,0Z"/>
      <path className="fill-orange-500" d="M75.51,222c54.07,103.87,200.01,115.97,269.4,20.15,57.03-78.75,30.11-189.71-55.4-234.15,122.03,32.93,169.7,183.78,86.75,281-91.17,106.86-264.33,66.89-300.75-67Z"/>
      <path className="fill-slate-700 dark:fill-sky-400" d="M301.78,27.72c60.37,42.42,79.46,123.82,45.07,189.38-40.18,76.59-139.85,102.17-211.85,53.65,5.96.82,12.24,3.13,18.39,4.11,95.28,15.24,182.23-70.2,165.97-165.97C308.15,42.83,247.66-.39,181.5,5.25c40.91-11.06,85.92-1.68,120.28,22.47Z"/>
    </g>
  )
}

export function Logomark(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 433.5 433.5" fill="none" {...props}>
      <LogomarkPaths />
    </svg>
  )
}

export function Logo(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <div className="flex items-center gap-3">
      <svg aria-hidden="true" viewBox="0 0 433.5 433.5" className="h-9 w-9" fill="none" {...props}>
        <LogomarkPaths />
      </svg>
      <span className="font-condensed text-2xl font-bold tracking-wider text-slate-700 dark:text-indigo-200">NESTLED</span>
    </div>
  )
}
