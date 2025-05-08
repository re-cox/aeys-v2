"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  disabled?: boolean;
  className?: string;
  width?: string;
  zIndex?: number;
}

export default function TimePicker({
  value = "",
  onChange,
  disabled = false,
  className,
  width = "110px",
  zIndex = 10,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedTime, setSelectedTime] = React.useState(value || "");

  // Saat ve dakikaları listeye ayır
  const formatValue = (val: string) => {
    if (!val) return "Saat seçin";
    return val;
  };

  // Saat listesini oluştur (00:00 - 23:45, 15 dakika aralıklarla)
  const timeList = React.useMemo(() => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        times.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return times;
  }, []);

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    if (onChange) {
      onChange(time);
    }
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Regex ile saat formatını kontrol et
    const inputTime = e.target.value;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    setSelectedTime(inputTime);
    
    if (timeRegex.test(inputTime) && onChange) {
      onChange(inputTime);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("flex items-center relative", className)}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            className={`rounded-md h-10 flex items-center justify-between px-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950`}
            style={{ width: width, zIndex: zIndex }}
            onClick={() => setOpen(true)}
          >
            <span className="mr-2 text-sm">{selectedTime || "hh:mm"}</span>
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" style={{ zIndex: zIndex + 40 }} align="start">
        <ScrollArea className="h-72">
          <div className="flex flex-col">
            {timeList.map((time) => (
              <Button
                key={time}
                variant="ghost"
                className={cn(
                  "justify-start px-3 py-1.5 text-sm font-normal",
                  time === selectedTime && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSelectTime(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 