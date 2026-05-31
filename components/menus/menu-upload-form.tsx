import Link from "next/link";
import { ImageUp, Languages, MapPin } from "lucide-react";
import { createMenuUpload } from "@/lib/actions/menu-actions";
import { menuLanguageOptions } from "@/lib/validations/menu";
import type { Restaurant } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

export function MenuUploadForm({
  restaurants,
  selectedRestaurantId,
}: {
  restaurants: Restaurant[];
  selectedRestaurantId?: string;
}) {
  return (
    <form action={createMenuUpload} className="grid gap-5">
      <Card className="grid gap-5 p-5">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-[var(--food-tangerine)]">
            <ImageUp size={20} />
            <h2 className="text-xl font-black text-[var(--brand-eggplant)]">
              Menu image
            </h2>
          </div>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Upload a clear menu photo. ChiGo will read visible dishes, translate
            them, and flag likely dietary concerns as estimates.
          </p>
        </div>

        <Field
          label="Photo"
          hint="JPEG, PNG, WebP, HEIC, or HEIF. HEIC/HEIF uploads are converted to JPEG. Max 10 MB."
        >
          <Input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
            required
            className="file:mr-3 file:rounded-[8px] file:border-0 file:bg-[var(--brand-eggplant)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Restaurant"
            hint="Optional, but linking helps other diners later."
          >
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3 top-3 text-[var(--text-muted)]"
                size={16}
              />
              <Select
                name="restaurantId"
                defaultValue={selectedRestaurantId ?? ""}
                className="pl-9"
              >
                <option value="">No restaurant selected</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </Select>
            </div>
          </Field>

          <Field label="Translate to">
            <div className="relative">
              <Languages
                className="pointer-events-none absolute left-3 top-3 text-[var(--text-muted)]"
                size={16}
              />
              <Select name="targetLanguage" defaultValue="en" className="pl-9">
                {menuLanguageOptions.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </Select>
            </div>
          </Field>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="secondary">
          <Link href="/menus">Cancel</Link>
        </Button>
        <SubmitButton pendingLabel="Uploading and analyzing...">
          <ImageUp size={17} />
          Analyze menu
        </SubmitButton>
      </div>
    </form>
  );
}
