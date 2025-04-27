import { useTheme } from "next-themes"
// Rename the imported Sonner to avoid conflict with the component name
import { Toaster as SonnerPrimitive, toast } from "sonner"

// Use the renamed SonnerPrimitive for props type
type ToasterProps = React.ComponentProps<typeof SonnerPrimitive>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    // Use the renamed SonnerPrimitive here
    <SonnerPrimitive
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Explicitly set the position to top-right
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

// Export the wrapper component and the toast function
export { Toaster, toast }
