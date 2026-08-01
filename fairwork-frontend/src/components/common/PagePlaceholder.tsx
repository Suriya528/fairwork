import type { IconType } from "react-icons"
import { PageHeader } from "./PageHeader"
import { Card, CardBody } from "@/components/ui/Card"

interface PagePlaceholderProps {
  title: string
  description: string
  icon: IconType
}

/**
 * Temporary scaffold for routes that don't have full pages yet.
 * Keeps navigation functional while the design standard is established.
 */
export function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardBody className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated text-primary">
            <Icon className="h-7 w-7" aria-hidden />
          </span>
          <div className="max-w-sm">
            <p className="text-sm font-medium text-foreground">{title} coming soon</p>
            <p className="mt-1 text-sm text-muted text-pretty">
              This screen is scaffolded and ready. We&apos;ll build it out next once the foundation
              is approved.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
