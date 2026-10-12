"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VentilatorFormState } from "@/app/actions";

type WardOption = { id: string; label: string };
type VendorOption = { id: string; name: string };

export type VentilatorFormValues = {
  assetNumber: string;
  serialNumber: string;
  deviceCode: string;
  brand: string;
  model: string;
  registrationDate: string;
  purchaseDate: string;
  purchasePrice: string;
  warrantyExpiryDate: string;
  vendorId: string;
};

const EMPTY_VALUES: VentilatorFormValues = {
  assetNumber: "",
  serialNumber: "",
  deviceCode: "",
  brand: "",
  model: "",
  registrationDate: "",
  purchaseDate: "",
  purchasePrice: "",
  warrantyExpiryDate: "",
  vendorId: "",
};

export function VentilatorForm({
  action,
  wards,
  vendors,
  initialValues,
  submitLabel,
}: {
  action: (state: VentilatorFormState, formData: FormData) => Promise<VentilatorFormState>;
  wards?: WardOption[];
  vendors: VendorOption[];
  initialValues?: Partial<VentilatorFormValues>;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const values = { ...EMPTY_VALUES, ...initialValues };
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="เลขครุภัณฑ์" htmlFor="assetNumber" error={fieldErrors.assetNumber}>
          <Input id="assetNumber" name="assetNumber" defaultValue={values.assetNumber} required />
        </Field>
        <Field label="Serial number" htmlFor="serialNumber" error={fieldErrors.serialNumber}>
          <Input id="serialNumber" name="serialNumber" defaultValue={values.serialNumber} required />
        </Field>
        <Field label="ID เครื่อง" htmlFor="deviceCode" error={fieldErrors.deviceCode}>
          <Input id="deviceCode" name="deviceCode" defaultValue={values.deviceCode} required />
        </Field>
        <Field label="ยี่ห้อ" htmlFor="brand" error={fieldErrors.brand}>
          <Input id="brand" name="brand" defaultValue={values.brand} required />
        </Field>
        <Field label="รุ่น" htmlFor="model" error={fieldErrors.model}>
          <Input id="model" name="model" defaultValue={values.model} required />
        </Field>
        <Field label="วันที่ลงทะเบียน" htmlFor="registrationDate" error={fieldErrors.registrationDate}>
          <Input
            id="registrationDate"
            name="registrationDate"
            type="date"
            defaultValue={values.registrationDate}
            required
          />
        </Field>
        <Field label="วันที่จัดซื้อ (ถ้ามี)" htmlFor="purchaseDate" error={fieldErrors.purchaseDate}>
          <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={values.purchaseDate} />
        </Field>
        <Field label="ราคาจัดซื้อ (ถ้ามี)" htmlFor="purchasePrice" error={fieldErrors.purchasePrice}>
          <Input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={values.purchasePrice}
          />
        </Field>
        <Field
          label="วันหมดประกัน (ถ้ามี)"
          htmlFor="warrantyExpiryDate"
          error={fieldErrors.warrantyExpiryDate}
        >
          <Input
            id="warrantyExpiryDate"
            name="warrantyExpiryDate"
            type="date"
            defaultValue={values.warrantyExpiryDate}
          />
        </Field>
        <Field label="บริษัทผู้จำหน่าย (ถ้ามี)" htmlFor="vendorId" error={fieldErrors.vendorId}>
          <Select name="vendorId" defaultValue={values.vendorId || undefined}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) => vendors.find((vd) => vd.id === v)?.name ?? "ไม่ระบุ"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {wards ? (
          <Field label="ตำแหน่งที่ตั้งเริ่มต้น" htmlFor="currentWardId" error={fieldErrors.currentWardId}>
            <Select name="currentWardId" required>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => wards.find((w) => w.id === v)?.label ?? "เลือกตำแหน่ง"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {wards.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "กำลังบันทึก..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" nativeButton={false} render={<Link href="/ventilators" />}>
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
