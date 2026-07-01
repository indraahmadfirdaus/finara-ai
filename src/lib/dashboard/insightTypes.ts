export type InsightTag = 'warning' | 'danger' | 'good' | 'info'
export type VizType = 'bar' | 'progress' | 'sparkline' | 'donut' | null

export interface BarItem {
  label: string
  value: number
  percent: number
}
export interface BarData {
  items: BarItem[]
}

export interface ProgressData {
  label: string
  value: number
  max: number
  percent: number
}

export interface SparklineData {
  points: number[]
}

export interface DonutSegment {
  label: string
  value: number
  color: string
}
export interface DonutData {
  segments: DonutSegment[]
  center_label: string
}

export type VizData = BarData | ProgressData | SparklineData | DonutData

export interface InsightCard {
  icon: string
  title: string
  description: string
  tag: InsightTag
  viz_type: VizType
  viz_data: VizData | null
}

export interface InsightResponse {
  insights: InsightCard[]
  generated_at: string
  error?: string
}
