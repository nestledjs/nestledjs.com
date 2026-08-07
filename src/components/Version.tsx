import clsx from 'clsx'

const styles = {
  added:
    'bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  changed:
    'bg-sky-50 text-sky-900 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-400 dark:ring-sky-400/20',
  removed:
    'bg-rose-50 text-rose-900 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-400/20',
  deprecated:
    'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-500 dark:ring-amber-400/20',
}

const labels = {
  added: 'Added in',
  changed: 'Changed in',
  removed: 'Removed in',
  deprecated: 'Deprecated in',
}

type Kind = keyof typeof styles

/**
 * Inline version badge, e.g. `{% version added="2.0.0" /%}`.
 *
 * The docs always describe the latest release. These badges tell a reader on an
 * older version whether a given behavior applies to them, which is why we don't
 * maintain a separate doc set per version.
 */
export function Version({
  added,
  changed,
  removed,
  deprecated,
  note,
}: Readonly<{
  added?: string
  changed?: string
  removed?: string
  deprecated?: string
  note?: string
}>) {
  const entries = (
    [
      ['added', added],
      ['changed', changed],
      ['removed', removed],
      ['deprecated', deprecated],
    ] as Array<[Kind, string | undefined]>
  ).filter((entry): entry is [Kind, string] => Boolean(entry[1]))

  if (entries.length === 0) {
    return null
  }

  return (
    <span className="not-prose inline-flex flex-wrap items-center gap-2 align-middle">
      {entries.map(([kind, version]) => (
        <span
          key={kind}
          className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
            styles[kind],
          )}
        >
          {labels[kind]} {version}
        </span>
      ))}
      {note ? (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {note}
        </span>
      ) : null}
    </span>
  )
}
