"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Clock, FileCheck, Upload, Download } from "lucide-react"

interface TransactionStepperProps {
  status: "submitted" | "accepted" | "pending" | "confirmed"
  startTime?: number
}

export function TransactionStepper({
  status,
  startTime,
}: TransactionStepperProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!startTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const steps = [
    {
      id: "submitted",
      label: "Submitted",
      icon: Upload,
      active: status === "submitted",
      completed: ["accepted", "pending", "confirmed"].includes(status),
    },
    {
      id: "accepted",
      label: "Accepted on L2",
      icon: Download,
      active: status === "accepted",
      completed: ["pending", "confirmed"].includes(status),
    },
    {
      id: "pending",
      label: "Pending",
      icon: Clock,
      active: status === "pending",
      completed: status === "confirmed",
    },
    {
      id: "confirmed",
      label: "Confirmed",
      icon: FileCheck,
      active: status === "confirmed",
      completed: status === "confirmed",
    },
  ]

  const currentStepIndex = steps.findIndex((step) => step.active)
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100

  return (
    <div className="w-full py-6">
      {/* Progress Bar Container */}
      <div className="relative mb-16 h-12">
        {/* Background Line */}
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-slate-800" />

        {/* Animated Progress Line */}
        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        >
          {/* Animated gradient effect */}
          <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isActive = step.active
            const isCompleted = step.completed

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCompleted
                      ? "border-cyan-500 bg-cyan-500"
                      : isActive
                        ? "animate-pulse border-cyan-600 bg-cyan-600"
                        : "border-slate-700 bg-slate-800"
                  } `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : (
                    <StepIcon
                      className={`h-5 w-5 ${
                        isActive ? "text-white" : "text-slate-500"
                      }`}
                    />
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <p
                    className={`text-xs font-medium ${
                      isActive || isCompleted
                        ? "text-slate-100"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Show timer on active step */}
                  {isActive && startTime && (
                    <p className="mt-1 font-mono text-xs text-cyan-400">
                      {formatTime(elapsedTime)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-8 flex items-center justify-center gap-2">
        <div className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5">
          <div className="relative mr-2">
            <div className="h-2 w-2 rounded-full bg-cyan-400" />
            <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-cyan-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
            Processing
          </span>
        </div>
      </div>
    </div>
  )
}
