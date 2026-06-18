# CountdownDeadline

`CountdownDeadline` renders a live, accessible countdown for vault deadlines. It exports both the component and a pure `timeRemaining(deadline, now)` helper so vault surfaces can share the same urgency thresholds.

## Thresholds

| State | Threshold | Tone |
| --- | --- | --- |
| Normal | More than 24 hours remaining | `--muted` |
| Urgent | More than 0 and less than 24 hours remaining | `--warning` |
| Expired | Deadline is now or in the past | `--danger` |
| Invalid | Deadline cannot be parsed as a date | `--danger` |

The component sets `title` and `aria-label` to include the absolute deadline and uses `aria-live="off"` so the interval updates do not create noisy announcements for assistive technology users.

## Usage

```tsx
<CountdownDeadline deadline={vault.deadline} />
```

Use the helper in tests or non-React logic:

```ts
timeRemaining(vault.deadline, new Date())
```
