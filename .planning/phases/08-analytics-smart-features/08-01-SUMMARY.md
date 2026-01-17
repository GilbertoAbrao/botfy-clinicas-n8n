# Plan 08-01 Summary: Core Analytics Algorithms

**Plan:** 08-01 - Core Analytics Algorithms
**Phase:** 08 - Analytics & Smart Features
**Status:** Complete
**Executed:** 2026-01-17

---

## What Was Built

### 1. Priority Scorer Algorithm (`src/lib/analytics/priority-scorer.ts`)

A heuristic-based priority scoring algorithm that calculates a score from 1-100 for alerts based on four weighted factors:

**Priority Factors:**
| Factor | Max Weight | Description |
|--------|------------|-------------|
| Alert Type | 40 | urgent: +40, high: +25, low: +10 |
| Alert Age | 20 | >24h: +20, >12h: +15, >6h: +10, >2h: +5 |
| Patient History | 25 | High no-show rate: +15, Many cancellations: +10 |
| Appointment Proximity | 25 | Within 2h: +25, 6h: +20, 24h: +15, 48h: +8 |

**Exports:**
- `calculateAlertPriority(alertId)` - Calculate priority for single alert
- `calculateAlertPriorities(alertIds)` - Batch processing with concurrency control
- `PriorityFactors` interface
- `PriorityResult` interface

### 2. Pattern Detector Algorithm (`src/lib/analytics/pattern-detector.ts`)

Identifies recurring failure patterns using SQL aggregation queries:

**Pattern Types:**
| Type | Description | Severity Thresholds |
|------|-------------|---------------------|
| `time_slot_noshow` | No-shows by hour/day | warning: 5, critical: 10 |
| `provider_failure` | Failures by provider | warning: 5, critical: 15 |
| `alert_type_spike` | Spikes in alert types | varies by type |
| `day_of_week` | Days with high failure rates | 1.5x average |

**Exports:**
- `detectPatterns(options)` - Detect all patterns with customizable lookback
- `getPatternSummary(options)` - Get summary statistics
- `Pattern` interface
- `PatternType` type
- `PatternSeverity` type

### 3. KPI Calculator (`src/lib/analytics/kpi-calculator.ts`)

Comprehensive KPI calculations with trend analysis:

**Metrics Calculated:**
| Metric | Description | Target |
|--------|-------------|--------|
| Booking Success Rate | (completed + confirmed) / total | >80% |
| No-Show Rate | no_show / total | <10% |
| Cancellation Rate | cancelled / total | <15% |
| Avg Resolution Time | Mean time to resolve alerts | <120 min |
| Alert Volume by Type | Count per AlertType | - |
| Confirmation Rate Trend | up/down/stable vs previous period | - |

**Exports:**
- `calculateKPIs(options)` - Calculate all KPIs for a period
- `calculateDailyKPIs(days)` - Daily KPIs for trend charts
- `evaluateKPIHealth(kpis)` - Health status evaluation
- `formatResolutionTime(minutes)` - Display formatting
- `KPIMetrics` interface
- `TrendDirection` type
- `KPIHealthStatus` interface

---

## Implementation Details

### Database Queries

All three modules use Prisma for database access:
- `groupBy` for aggregations
- `count` for simple totals
- `findMany` with filters for complex calculations
- Parallel query execution with `Promise.all` for performance

### Date Handling

Uses `date-fns` for all date operations:
- `differenceInHours`, `differenceInMinutes` for time calculations
- `subDays`, `startOfDay`, `endOfDay` for period boundaries
- `getDay`, `getHours` for pattern extraction

### Error Handling

- Graceful degradation on missing relationships (null patient/appointment)
- Default values returned on query failures
- Console logging for debugging without failing operations

---

## Verification Results

- [x] All three files created in `src/lib/analytics/`
- [x] `npx tsc --noEmit` passes without errors
- [x] Each file exports documented interfaces and functions
- [x] No external dependencies added (using existing prisma + date-fns)

**Line Counts:**
| File | Lines | Required |
|------|-------|----------|
| priority-scorer.ts | 362 | 50 |
| pattern-detector.ts | 461 | 80 |
| kpi-calculator.ts | 459 | 60 |

---

## Commits

1. `93590b7` - feat(analytics): add alert priority scoring algorithm
2. `ce81bbb` - feat(analytics): add failure pattern detection algorithm
3. `7573d47` - feat(analytics): add extended KPI calculator

---

## Usage Examples

### Priority Scoring
```typescript
import { calculateAlertPriority } from '@/lib/analytics/priority-scorer'

const result = await calculateAlertPriority(alertId)
// { score: 75, factors: {...}, explanation: "Prioridade urgent (+40) | Consulta em 2h (+25) | ..." }
```

### Pattern Detection
```typescript
import { detectPatterns } from '@/lib/analytics/pattern-detector'

const patterns = await detectPatterns({ lookbackDays: 30, minOccurrences: 3 })
// [{ type: 'time_slot_noshow', description: '5 faltas às 14:00 em segundas', severity: 'warning', ... }]
```

### KPI Calculation
```typescript
import { calculateKPIs, evaluateKPIHealth } from '@/lib/analytics/kpi-calculator'

const kpis = await calculateKPIs({ periodDays: 30 })
const health = evaluateKPIHealth(kpis)
// kpis: { bookingSuccessRate: 82.5, noShowRate: 8.3, ... }
// health: [{ metric: 'Taxa de sucesso', status: 'good', message: 'Excelente taxa de sucesso' }, ...]
```

---

## Next Steps

These algorithms are now ready to be consumed by:
- Plan 08-02: Analytics Dashboard API endpoints
- Future: Smart predictions UI
- Future: Alert queue prioritization

---

*Generated: 2026-01-17*
