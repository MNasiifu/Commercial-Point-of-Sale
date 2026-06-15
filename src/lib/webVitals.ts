import { onCLS, onFCP, onINP, onLCP, onTTFB, type MetricType } from 'web-vitals'

function logMetric(metric: MetricType) {
  if (import.meta.env.DEV) {
    const rating = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌'
    console.info(`[Web Vital] ${rating} ${metric.name}: ${Math.round(metric.value)} (${metric.rating})`)
  }
  // In production, send to your analytics pipeline here.
  // Example: supabase.from('web_vitals_events').insert({ name: metric.name, value: metric.value, rating: metric.rating })
}

export function reportWebVitals() {
  onCLS(logMetric)
  onFCP(logMetric)
  onINP(logMetric)
  onLCP(logMetric)
  onTTFB(logMetric)
}
