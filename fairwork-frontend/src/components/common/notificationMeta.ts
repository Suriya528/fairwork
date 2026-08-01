import type { ComponentType, SVGProps } from "react"
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiInfo,
  FiMessageSquare,
  FiShield,
  FiUnlock,
  FiUpload,
} from "react-icons/fi"
import type { NotificationType } from "@/types"

export type IconType = ComponentType<SVGProps<SVGSVGElement>>

export interface NotificationMeta {
  icon: IconType
  tone: "neutral" | "success" | "danger"
}

/**
 * Icon + tone per notification type. Shared by the full Notifications page
 * and the Topbar's notification dropdown so the two never drift apart.
 */
export const NOTIFICATION_META: Record<NotificationType, NotificationMeta> = {
  milestone_submitted: { icon: FiUpload, tone: "neutral" },
  milestone_approved: { icon: FiCheckCircle, tone: "success" },
  funds_released: { icon: FiUnlock, tone: "success" },
  escrow_funded: { icon: FiShield, tone: "neutral" },
  dispute_opened: { icon: FiAlertTriangle, tone: "danger" },
  dispute_resolved: { icon: FiCheckCircle, tone: "success" },
  new_message: { icon: FiMessageSquare, tone: "neutral" },
  contract_ready: { icon: FiFileText, tone: "neutral" },
  system: { icon: FiInfo, tone: "neutral" },
}