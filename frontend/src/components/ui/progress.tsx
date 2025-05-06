import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

// Define RGBA color for the ghost bar (approx. primary blue with 30% opacity)
// Calculated from hsl(221.2 83.2% 53.3%)
const ghostBarColor = "rgba(49, 130, 246, 0.3)";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { animationDelay?: number }
>(({ className, value, animationDelay = 400, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState(value || 0);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const rafRef = React.useRef<number | null>(null); // Ref for requestAnimationFrame handle
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    // Skip effect on initial mount, just set initial display value
    if (!isMounted.current) {
      isMounted.current = true;
      setDisplayValue(value || 0);
      return;
    }

    // Clear previous timeouts and animation frame requests
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // Ghost value is updated immediately via the 'value' prop in the ghost indicator style below

    // Delay the update of the main display value
    timeoutRef.current = setTimeout(() => {
      // Use requestAnimationFrame to schedule the state update just before the next paint
      rafRef.current = requestAnimationFrame(() => {
        setDisplayValue(value || 0);
      });
    }, animationDelay); // Use the updated animationDelay

    // Cleanup function to clear timeout and cancel animation frame request
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, animationDelay]); // Dependencies for the effect

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        // Changed background color to a noticeably darker gray
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600",
        className
      )}
      {...props}
    >
      {/* Ghost Indicator: Uses the 'value' prop directly and explicit RGBA color */}
      <ProgressPrimitive.Indicator
        className="absolute h-full w-full flex-1 transition-none" // Removed bg-primary/30
        style={{
            transform: `translateX(-${100 - (value || 0)}%)`,
            backgroundColor: ghostBarColor // Apply explicit RGBA color
        }}
      />
      {/* Main Indicator: Uses the delayed 'displayValue' state and CSS transition */}
      <ProgressPrimitive.Indicator
        className="absolute h-full w-full flex-1 bg-primary transition-transform duration-500 ease-out" // Ensure transition class is present
        style={{
            transform: `translateX(-${100 - displayValue}%)`, // Use delayed displayValue state
            willChange: 'transform' // Keep for potential optimization
        }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
