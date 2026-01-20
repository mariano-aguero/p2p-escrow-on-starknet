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
      <div className="relative h-12 mb-16">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2" />

        {/* Animated Progress Line */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-cyan-500 to-cyan-400 -translate-y-1/2 transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        >
          {/* Animated gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
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
                  className={`
                    relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-cyan-500 border-cyan-500"
                        : isActive
                          ? "bg-cyan-600 border-cyan-600 animate-pulse"
                          : "bg-slate-800 border-slate-700"
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <StepIcon
                      className={`w-5 h-5 ${
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
                    <p className="text-xs text-cyan-400 font-mono mt-1">
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
      <div className="flex items-center justify-center gap-2 mt-8">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <div className="relative mr-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
            Processing
          </span>
        </div>
      </div>
    </div>
  )
}
