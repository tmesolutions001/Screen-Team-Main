import * as SheetPrimitive from "@radix-ui/react-dialog"
import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion"
import { IconButton } from "@/components/glass/IconButton"

// Open state is mirrored into context so SheetContent can drive its own
// enter/exit springs (Radix is told to forceMount and stays out of the way).
const SheetOpenContext = React.createContext(false)

const Sheet = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const open = openProp ?? internalOpen
  return (
    <SheetOpenContext.Provider value={open}>
      <SheetPrimitive.Root
        open={open}
        onOpenChange={(next) => {
          setInternalOpen(next)
          onOpenChange?.(next)
        }}
        {...props}
      />
    </SheetOpenContext.Provider>
  )
}

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

type Side = "top" | "bottom" | "left" | "right"

// Floating frosted panel inset from the viewport edge rather than flush to it.
const sidePosition: Record<Side, string> = {
  top: "inset-x-4 top-4",
  bottom: "inset-x-4 bottom-4",
  left: "inset-y-4 left-4 w-3/4 sm:max-w-sm",
  right: "inset-y-4 right-4 w-3/4 sm:max-w-sm",
}

const offscreen: Record<Side, { x?: string; y?: string }> = {
  top: { y: "-110%" },
  bottom: { y: "110%" },
  left: { x: "-110%" },
  right: { x: "110%" },
}

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: Side
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, ...props }, ref) => {
    const open = React.useContext(SheetOpenContext)
    return (
      <AnimatePresence>
        {open && (
          <SheetPrimitive.Portal forceMount key="sheet">
            <SheetPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={springs.smooth}
              />
            </SheetPrimitive.Overlay>
            <SheetPrimitive.Content asChild forceMount {...props}>
              {/* Slides on transform only, so the panel stays frosted while it moves. */}
              <motion.div
                ref={ref}
                className={cn(
                  "fixed z-50 gap-4 glass glass-strong rounded-glass p-6",
                  sidePosition[side],
                  className
                )}
                initial={offscreen[side]}
                animate={{ x: 0, y: 0 }}
                exit={offscreen[side]}
                transition={springs.smooth}
              >
                {children}
                <SheetPrimitive.Close asChild>
                  <IconButton aria-label="Close" className="absolute right-4 top-4 h-9 w-9">
                    <X className="h-4 w-4" />
                  </IconButton>
                </SheetPrimitive.Close>
              </motion.div>
            </SheetPrimitive.Content>
          </SheetPrimitive.Portal>
        )}
      </AnimatePresence>
    )
  }
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger }
