import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react"

const notificationVariants = cva(
  "relative w-full rounded-lg border p-4 shadow-md",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
        warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
        alert: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
        success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  title?: string
  onClose?: () => void
  icon?: React.ReactNode
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, variant, title, children, onClose, icon, ...props }, ref) => {
    // Determine icon based on variant
    const variantIcon = React.useMemo(() => {
      if (icon) return icon
      
      switch (variant) {
        case "info":
          return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        case "warning":
          return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        case "alert":
          return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        case "success":
          return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        default:
          return <Info className="h-5 w-5" />
      }
    }, [variant, icon])

    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">
            {variantIcon}
          </div>
          <div className="flex-1">
            {title && <h4 className="mb-1 font-medium">{title}</h4>}
            <div className="text-sm opacity-90">{children}</div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="ml-auto flex-shrink-0 rounded-full p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
Notification.displayName = "Notification"

export { Notification, notificationVariants }