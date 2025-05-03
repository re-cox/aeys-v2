"use client";

import * as React from "react";
import { Check, ChevronsUpDown, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Employee {
  id: string;
  name: string;
  surname: string;
  department?: {
    name: string;
  };
}

interface EmployeeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function EmployeeCombobox({
  value,
  onChange,
  disabled = false,
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/employees");
        
        if (!response.ok) {
          throw new Error("Failed to fetch employees");
        }
        
        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const selectedEmployee = employees.find((emp) => emp.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || loading}
        >
          {loading ? (
            <Skeleton className="h-4 w-[150px]" />
          ) : value && selectedEmployee ? (
            <div className="flex items-center">
              <UserIcon className="mr-2 h-4 w-4 shrink-0" />
              <span>
                {selectedEmployee.name} {selectedEmployee.surname}
              </span>
              {selectedEmployee.department && (
                <span className="ml-2 text-xs text-gray-500">
                  ({selectedEmployee.department.name})
                </span>
              )}
            </div>
          ) : (
            "Select employee..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search employees..." />
          <CommandEmpty>
            {error ? error : "No employee found."}
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {employees.map((employee) => (
              <CommandItem
                key={employee.id}
                value={`${employee.name} ${employee.surname}`}
                onSelect={() => {
                  onChange(employee.id === value ? "" : employee.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === employee.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>
                    {employee.name} {employee.surname}
                  </span>
                  {employee.department && (
                    <span className="text-xs text-gray-500">
                      {employee.department.name}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 