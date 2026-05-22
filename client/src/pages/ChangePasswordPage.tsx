import { useState } from "react";
import { trpc } from "../lib/trpc.js";
import { useAuthStore } from "../hooks/useAuth.js";

export default function ChangePasswordPage() {
  const { user, setUser } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const changePassword = trpc.auth.changePassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    if (newPassword.length < 6) {
      setError("新密码至少6个字符");
      return;
    }

    setLoading(true);
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }
    } catch (err: any) {
      setError(err.message || "修改密码失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-hairline p-8">
          <div className="text-center mb-6">
            <p className="eyebrow mb-1">SECURITY</p>
            <h1 className="editorial-heading text-xl">修改密码</h1>
            <div className="h-[1.5px] bg-ink mt-3 mb-2" />
            <p className="text-sm text-muted mt-3">首次登录请修改初始密码</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="eyebrow block mb-1.5">CURRENT PASSWORD</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-hairline bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">NEW PASSWORD</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-hairline bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">CONFIRM PASSWORD</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-hairline bg-paper px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-[#991B1B] bg-[#FEE2E2] px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-ink text-card rounded-full text-sm font-medium hover:bg-ink-soft disabled:opacity-50 transition-colors"
            >
              {loading ? "修改中..." : "确认修改"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
