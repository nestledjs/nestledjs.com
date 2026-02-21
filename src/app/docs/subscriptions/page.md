---
title: Subscriptions
nextjs:
  metadata:
    title: Subscriptions
    description: Subscription-based access control in Nestled — hooks, components, plan features, usage limits, and upgrade prompts.
---

Nestled includes a complete subscription and plan-based access control system built on Stripe. It provides React hooks for checking subscription status, components for protecting UI elements, and modals for prompting upgrades.

---

## Quick start

### Check subscription status

```tsx
import { useSubscription } from '@nestled-template/web'

function MyComponent() {
  const {
    subscription,
    plan,
    hasActiveSubscription,
    isTrialing,
    isCanceled,
    isPastDue,
    trialEndsAt,
    periodEndsAt,
  } = useSubscription()

  if (!hasActiveSubscription) {
    return <div>Please subscribe to access this feature</div>
  }

  return <div>Welcome, {plan?.name} subscriber!</div>
}
```

### Check plan features

```tsx
import { useHasFeature } from '@nestled-template/web'

function AdvancedReportsPage() {
  const hasAdvancedReports = useHasFeature('advanced_reports')

  if (!hasAdvancedReports) {
    return <UpgradePrompt feature="Advanced Reports" />
  }

  return <AdvancedReportsContent />
}
```

### Check plan limits

```tsx
import { useLimit } from '@nestled-template/web'

function CreateProjectButton() {
  const { isWithin, limit, remaining } = useLimit(
    'max_projects',
    currentProjectCount,
  )

  if (!isWithin) {
    return <button disabled>Project limit reached ({limit})</button>
  }

  return (
    <button onClick={createProject}>
      Create Project ({remaining} remaining)
    </button>
  )
}
```

---

## Components

### RequireSubscription

Protects content that requires an active subscription:

```tsx
import { RequireSubscription } from '@nestled-template/web'

<RequireSubscription>
  <PremiumFeature />
</RequireSubscription>

// Allow trial users
<RequireSubscription allowTrial={true}>
  <TrialOrPaidFeature />
</RequireSubscription>

// Custom fallback
<RequireSubscription fallback={<CustomUpgradePrompt />}>
  <PremiumFeature />
</RequireSubscription>

// Inline variant (renders nothing if no subscription)
<RequireSubscriptionInline>
  <PremiumButton />
</RequireSubscriptionInline>
```

### RequirePlan

Protects content based on specific plan features:

```tsx
import { RequirePlan } from '@nestled-template/web'

// Single feature
<RequirePlan feature="advanced_reports">
  <AdvancedReportsPage />
</RequirePlan>

// Multiple features (all required)
<RequirePlan features={['api_access', 'webhooks']} requireAll={true}>
  <APISettings />
</RequirePlan>

// Multiple features (any one required)
<RequirePlan features={['feature_a', 'feature_b']} requireAll={false}>
  <ConditionalFeature />
</RequirePlan>

// Inline variant
<RequirePlanInline feature="export_data">
  <ExportButton />
</RequirePlanInline>
```

### RequireLimit

Protects actions based on usage limits:

```tsx
import { RequireLimit } from '@nestled-template/web'

<RequireLimit limitKey="max_team_members" currentValue={teamSize}>
  <InviteMemberButton />
</RequireLimit>

// Inline variant
<RequireLimitInline limitKey="max_api_calls" currentValue={apiCallCount}>
  <MakeAPICallButton />
</RequireLimitInline>
```

### UsageLimitWarning

Display usage information and warnings:

```tsx
import { UsageLimitWarning, MultiUsageLimitWarning, UsageBadge } from '@nestled-template/web'

// Single limit warning
<UsageLimitWarning
  limitKey="max_projects"
  currentValue={projectCount}
  warningThreshold={80}
  label="Projects"
  showBar={true}
/>

// Multiple limits
<MultiUsageLimitWarning
  limits={{
    max_projects: projectCount,
    max_team_members: teamSize,
    max_storage_gb: storageUsedGB,
  }}
  warningThreshold={80}
/>

// Compact badge
<UsageBadge limitKey="max_api_calls" currentValue={apiCallCount} />
```

### UpgradeModal

Show available plans and prompt upgrading:

```tsx
import { UpgradeModal } from '@nestled-template/web'
import { useState } from 'react'

function MyComponent() {
  const [showUpgrade, setShowUpgrade] = useState(false)

  return (
    <>
      <button onClick={() => setShowUpgrade(true)}>Upgrade Plan</button>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="Advanced Analytics"
        reason="Get deeper insights with advanced analytics"
      />
    </>
  )
}
```

---

## Hooks reference

### useSubscription()

```tsx
const {
  subscription, // Current subscription object
  plan, // Current plan object
  isLoading, // Loading state
  error, // Error state
  hasActiveSubscription, // true if ACTIVE or TRIALING
  isTrialing, // true if in trial period
  isCanceled, // true if canceled or cancel pending
  isPastDue, // true if payment failed
  trialEndsAt, // Date trial ends (null if not trialing)
  periodEndsAt, // Date current period ends
  requireActiveSubscription, // Throws if no active subscription
} = useSubscription()
```

### useHasFeature(feature)

```tsx
const hasAPI = useHasFeature('api_access')
```

### useHasFeatures(features)

Checks if the user has ALL listed features:

```tsx
const hasAllFeatures = useHasFeatures(['api_access', 'webhooks', 'export_data'])
```

### useHasAnyFeature(features)

Checks if the user has ANY of the listed features:

```tsx
const hasAnyPremium = useHasAnyFeature([
  'advanced_reports',
  'api_access',
  'white_label',
])
```

### usePlan()

```tsx
const {
  plan, // Current plan object
  isLoading, // Loading state
  checkLimit, // (key) => { limit, hasLimit }
  isWithinLimit, // (key, value) => boolean
  hasFeature, // (feature) => boolean
  isPlan, // (name) => boolean
  isPlanOneOf, // (names) => boolean
  requireWithinLimit, // Throws if limit exceeded
} = usePlan()
```

### useLimit(limitKey, currentValue)

```tsx
const {
  limit, // The limit value (number)
  hasLimit, // true if limit exists
  isWithin, // true if within limit
  isAtLimit, // true if at or over limit
  remaining, // Number remaining (Infinity if no limit)
  percentUsed, // Percentage used (0-100)
} = useLimit('max_projects', currentProjectCount)
```

### useLimits(currentValues)

Check multiple limits at once:

```tsx
const limits = useLimits({
  max_projects: projectCount,
  max_team_members: teamSize,
  max_storage_gb: storageGB,
})

// limits.max_projects.isWithin
// limits.max_projects.remaining
// limits.max_team_members.percentUsed
```

---

## Plan configuration

Plans are configured in Stripe and synced to your database. Features and limits are stored as JSON.

### Features

```json
["api_access", "webhooks", "advanced_reports", "white_label"]
```

Or as an object with toggles:

```json
{
  "api_access": true,
  "webhooks": true,
  "advanced_reports": true,
  "white_label": false
}
```

### Limits

```json
{
  "max_projects": 10,
  "max_team_members": 5,
  "max_storage_gb": 100,
  "max_api_calls_per_month": 10000
}
```

Special values: `-1` means unlimited, `0` means not allowed, and any positive number is a specific limit.

---

## Common patterns

### Conditional rendering based on plan

```tsx
function Dashboard() {
  const { isPlan } = usePlan()

  return (
    <div>
      {isPlan('Enterprise') && <AdminPanel />}
      {isPlan('Pro') && <AdvancedFeatures />}
      <BasicFeatures />
    </div>
  )
}
```

### Usage-based limits with warnings

```tsx
function ProjectsList() {
  const { isWithin, limit, remaining } = useLimit(
    'max_projects',
    projects.length,
  )

  return (
    <div>
      <h2>
        Projects ({projects.length}/{limit})
      </h2>

      {!isWithin && (
        <Alert type="warning">
          You have reached your project limit. Upgrade to create more.
        </Alert>
      )}

      {isWithin && remaining <= 2 && (
        <Alert type="info">You have {remaining} project slots remaining.</Alert>
      )}

      <RequireLimitInline
        limitKey="max_projects"
        currentValue={projects.length}
      >
        <CreateProjectButton />
      </RequireLimitInline>
    </div>
  )
}
```

### Trial period handling

```tsx
function TrialBanner() {
  const { isTrialing, trialEndsAt, hasActiveSubscription } = useSubscription()

  if (!hasActiveSubscription || !isTrialing || !trialEndsAt) return null

  const daysLeft = Math.ceil(
    (trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )

  return (
    <Banner type="info">
      Your trial ends in {daysLeft} days. Upgrade now to continue using premium
      features.
      <UpgradeButton />
    </Banner>
  )
}
```

---

## Best practices

1. Always check subscription status before rendering premium features
2. Use inline variants for buttons/actions to avoid empty states
3. Show clear upgrade paths when features are locked
4. Warn users before they hit limits (80% threshold recommended)
5. Handle loading states gracefully
6. Test with different plan tiers to ensure proper gating

---

## Next steps

- Configure plans in the Stripe Dashboard
- Sync plans to your database using the admin UI at `/settings/admin/billing`
- Define features and limits for each plan
- Protect premium features using the components above
