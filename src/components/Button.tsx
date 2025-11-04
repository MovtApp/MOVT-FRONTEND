import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { TouchableOpacity } from "react-native";
import { TextClassContext } from "./Text";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group flex items-center justify-center rounded-[10px] web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-1 web:focus-visible:ring-ring web:focus-visible:ring-offset-0",
  {
    variants: {
      variant: {
        default: "bg-system h-14",
        destructive: "bg-destructive web:hover:opacity-90 active:opacity-90",
        outline:
          "border border-input bg-background web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent",
        secondary: "bg-secondary web:hover:opacity-80 active:opacity-80",
        ghost: "web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent",
        link: "web:underline-offset-4 web:hover:underline web:focus:underline ",
      },
      size: {
        default: "h-14",
        sm: "h-6 rounded-md px-3",
        lg: "h-16 rounded-2xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const buttonTextVariants = cva(
  "web:whitespace-nowrap text-sm native:text-base font-medium text-foreground web:transition-colors",
  {
    variants: {
      variant: {
        default: "text-primary-foreground bg-chathams_blue-1000 h-16",
        destructive: "text-destructive-foreground",
        outline: "group-active:text-accent-foreground",
        secondary: "text-secondary-foreground group-active:text-secondary-foreground",
        ghost: "group-active:text-accent-foreground",
        link: "text-primary group-active:underline",
      },
      size: {
        default: "",
        sm: "",
        lg: "h-16",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ComponentPropsWithoutRef<typeof TouchableOpacity> &
  VariantProps<typeof buttonVariants>;

const Button = forwardRef<ElementRef<typeof TouchableOpacity>, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <TextClassContext.Provider
        value={buttonTextVariants({
          variant,
          size,
          className: "web:pointer-events-none",
        })}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            borderRadius: 10,
          }}
        >
          <TouchableOpacity
            className={cn(
              props.disabled && "opacity-50 web:pointer-events-none",
              buttonVariants({ variant, size, className }),
              "bg-[#192126]"
            )}
            ref={ref}
            role="button"
            style={{
              shadowColor: "#253EA7",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.48,
              shadowRadius: 2,
              elevation: 2,
              borderRadius: 10,
            }}
            {...props}
          >
            {props.children}
          </TouchableOpacity>
        </LinearGradient>
      </TextClassContext.Provider>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
