"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  value?: string;
  required?: boolean;
};
export function ApiForm({
  endpoint,
  fields,
  label,
  method = "POST",
  redirect,
  resetToken = false,
}: {
  endpoint: string;
  fields: Field[];
  label: string;
  method?: string;
  redirect?: string;
  resetToken?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = event.currentTarget;
    const data: Record<string, unknown> = Object.fromEntries(
      new FormData(form),
    );
    if (resetToken)
      data.token =
        new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    try {
      const response = await fetch(`/api/v1/${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) {
        setMessage(result.error.message);
        return;
      }
      if (result.data.requiresTwoFactor) {
        router.push("/2fa");
        router.refresh();
        return;
      }
      if (redirect) {
        router.push(redirect);
        router.refresh();
        return;
      }
      setMessage(result.data.message ?? "Changes saved.");
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      {fields.map((field) => (
        <label key={field.name}>
          {field.label}
          <Input
            name={field.name}
            type={field.type ?? "text"}
            autoComplete={field.autoComplete}
            defaultValue={field.value}
            required={field.required !== false}
          />
        </label>
      ))}
      <Button disabled={busy} type="submit">
        {busy ? "Please wait…" : label}
      </Button>
      <p role="status" className="form-message">
        {message}
      </p>
    </form>
  );
}
