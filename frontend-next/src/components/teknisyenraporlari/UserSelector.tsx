"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Personel } from "@/types/teknisyen";

interface UserSelectorProps {
  users: Personel[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export default function UserSelector({
  users,
  selectedIds,
  onSelectionChange,
  disabled = false,
}: UserSelectorProps) {
  const [open, setOpen] = useState(false);

  // Seçili kullanıcı isimlerini al
  const selectedUsers = users.filter((user) => 
    selectedIds.includes(user.id)
  );

  // Kullanıcı kimliğinin seçimini değiştir
  const toggleUser = (userId: string) => {
    if (selectedIds.includes(userId)) {
      // Seçimi kaldır
      onSelectionChange(selectedIds.filter((id) => id !== userId));
    } else {
      // Seçime ekle
      onSelectionChange([...selectedIds, userId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedUsers.length > 0 ? (
            <div className="flex flex-wrap gap-1 overflow-hidden">
              {selectedUsers.length <= 2 ? (
                selectedUsers.map((user) => (
                  <Badge key={user.id} variant="secondary">
                    {user.name} {user.surname}
                  </Badge>
                ))
              ) : (
                <>
                  <Badge variant="secondary">
                    {selectedUsers[0].name} {selectedUsers[0].surname}
                  </Badge>
                  <Badge variant="secondary">
                    +{selectedUsers.length - 1} kişi
                  </Badge>
                </>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">Personel seçin</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Personel ara..." />
          <CommandEmpty>Personel bulunamadı.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-72">
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.name} ${user.surname}`}
                  onSelect={() => {
                    toggleUser(user.id);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIds.includes(user.id) 
                        ? "opacity-100" 
                        : "opacity-0"
                    )}
                  />
                  {user.name} {user.surname}
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 