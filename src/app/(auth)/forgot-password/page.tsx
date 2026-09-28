import Link from "next/link";
import { ApiForm } from "@/components/shared/api-form";
export default function Forgot() {
  return (
    <>
      <h1>Reset your password</h1>
      <p>Enter your organization and account email.</p>
      <ApiForm
        endpoint="auth/forgot-password"
        label="Request reset link"
        fields={[
          { name: "organization", label: "Organization" },
          {
            name: "email",
            label: "Email address",
            type: "email",
            autoComplete: "email",
          },
        ]}
      />
      <p className="auth-links">
        <Link href="/login">Back to sign in</Link>
      </p>
    </>
  );
}
