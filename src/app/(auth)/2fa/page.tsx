import { ApiForm } from "@/components/shared/api-form";
export default function Challenge() {
  return (
    <>
      <h1>Verify it’s you</h1>
      <p>Enter the code from your authenticator or a saved recovery code.</p>
      <ApiForm
        endpoint="auth/2fa"
        label="Verify and sign in"
        redirect="/dashboard"
        fields={[
          {
            name: "code",
            label: "Verification code",
            autoComplete: "one-time-code",
          },
        ]}
      />
    </>
  );
}
