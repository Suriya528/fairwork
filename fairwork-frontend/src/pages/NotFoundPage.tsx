import { useNavigate } from "react-router-dom"
import { FiCompass } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Card, CardBody } from "@/components/ui/Card"

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated text-primary">
            <FiCompass className="h-7 w-7" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              404
            </p>
            <p className="text-sm text-muted text-pretty">
              We couldn&apos;t find the page you&apos;re looking for. It may have
              moved or never existed.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate("/dashboard")}>
            Back to dashboard
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
