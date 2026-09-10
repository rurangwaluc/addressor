import RequireAccess from "@/components/auth/RequireAccess";
import AccountShell from "@/components/account/AccountShell";

export default function CustomerAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAccess mode="auth">
      <AccountShell>{children}</AccountShell>
    </RequireAccess>
  );
}
