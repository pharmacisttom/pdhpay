import { ApiForm } from "@/components/shared/api-form";
export default function Reset() {
  return (
    <>
      <h1>Choose a new password</h1>
      <p>Use at least 12 characters.</p>
      <ApiForm
        endpoint="auth/reset-password"
        label="Reset password"
        resetToken
        redirect="/login"
        fields={[
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
          },
        ]}
      />
    </>
  );
}
