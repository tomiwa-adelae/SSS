import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  color?: "white" | "green"
  className?: string
}

export const Logo = ({ color = "white", className }: LogoProps) => {
  const src =
    color === "green"
      ? "/assets/images/logo-green.png"
      : "/assets/images/logo.png"

  return (
    <Link
      className="flex items-center justify-start gap-2 transition-all hover:opacity-80"
      href="/"
    >
      <Image
        src={src}
        alt="Leadsage africa logo"
        width={1000}
        height={1000}
        className={cn("w-25 object-cover sm:w-37.5 md:w-40", className)}
      />
    </Link>
  )
}
