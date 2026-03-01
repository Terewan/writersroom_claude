"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const GENRES = [
  "Drama",
  "Comedy",
  "Thriller",
  "Sci-Fi",
  "Horror",
  "Fantasy",
  "Crime",
  "Romance",
  "Documentary",
  "Animation",
] as const;

export type Genre = (typeof GENRES)[number];

interface GenreMultiSelectProps {
  value: Genre[];
  onChange: (genres: Genre[]) => void;
  maxSelections?: number;
}

export function GenreMultiSelect({
  value,
  onChange,
  maxSelections = 3,
}: GenreMultiSelectProps) {
  const [open, setOpen] = useState(false);

  function toggleGenre(genre: Genre) {
    if (value.includes(genre)) {
      onChange(value.filter((g) => g !== genre));
    } else if (value.length < maxSelections) {
      onChange([...value, genre]);
    }
  }

  function removeGenre(genre: Genre, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(value.filter((g) => g !== genre));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-9 w-full justify-between font-normal",
            value.length === 0 && "text-muted-foreground",
          )}
        >
          {value.length === 0 ? (
            <span>Select genres...</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {value.map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="gap-1 text-xs"
                >
                  {genre}
                  <span
                    role="button"
                    tabIndex={0}
                    className="rounded-full outline-none hover:text-destructive"
                    onClick={(e) => removeGenre(genre, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        removeGenre(genre, e as unknown as React.MouseEvent);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <div className="space-y-1">
          {GENRES.map((genre) => {
            const isSelected = value.includes(genre);
            const isDisabled = !isSelected && value.length >= maxSelections;

            return (
              <label
                key={genre}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                  isDisabled && "cursor-not-allowed opacity-50",
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleGenre(genre)}
                  disabled={isDisabled}
                />
                <span>{genre}</span>
              </label>
            );
          })}
        </div>
        {value.length >= maxSelections && (
          <p className="mt-2 border-t px-2 pt-2 text-xs text-muted-foreground">
            Maximum {maxSelections} genres selected
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Join selected genres into a display/storage string */
export function joinGenres(genres: Genre[]): string {
  return genres.join(" / ");
}

/** Parse a genre string back into an array */
export function parseGenres(genreString: string): Genre[] {
  if (!genreString) return [];
  return genreString
    .split(/\s*\/\s*/)
    .filter((g): g is Genre => GENRES.includes(g as Genre));
}
