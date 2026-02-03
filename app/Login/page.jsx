"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3020";

  // Login States
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Change Password States
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [tempUserData, setTempUserData] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");

  // Validation Logic: 8+ characters, letters and numbers
  const validatePassword = (pass) => {
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return hasLetter && hasNumber && pass.length >= 8;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // ✅ FLOW: Check if password is default "123456"
      if (password === "123456") {
        setTempUserData(data); // Store tokens temporarily
        setShowChangePassword(true); // Open Modal
        setLoading(false);
        return; // 🛑 Stop and wait for password change
      }

      // ✅ FLOW: Correct & Not default -> Dashboard
      saveSessionAndRedirect(data);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError("");

    if (newPassword !== confirmPassword) {
      setChangePasswordError("Passwords do not match.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setChangePasswordError("Password must be 8+ characters with letters and numbers.");
      return;
    }

    setChangePasswordLoading(true);

    try {
      const userId = tempUserData.user.id;
      // PUT to update password via your API
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tempUserData.accessToken}`
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) throw new Error("Could not update password.");

      // Success -> Finalize login
      saveSessionAndRedirect(tempUserData);
    } catch (err) {
      setChangePasswordError(err.message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const saveSessionAndRedirect = (data) => {
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    router.push("/pages/dashboard");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('images/xsim-bg.png')" }}
    >
      <div className="absolute inset-0 bg-black/60" />

      {/* --- Main Login UI --- */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <img src="images/aotavsec_logo.png" alt="AOT" className="h-20 object-contain" />
        </div>

        <h1 className="text-xl font-bold text-center text-gray-200">
          Airport Security Training System
        </h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xl font-medium text-gray-200">
              Employee ID / Citizen ID
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white/10 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xl font-medium text-gray-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white/10 text-white outline-none"
            />
          </div>

          {error && <p className="text-red-400 text-center font-bold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-md transition disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN"}
          </button>
        </form>
      </div>

      {/* --- Mandatory Change Password Modal --- */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          
          <div className="relative z-110 w-full max-w-md rounded-xl bg-white/20 backdrop-blur-xl border border-white/40 shadow-2xl p-8 text-white">
            <h2 className="text-2xl font-bold text-center text-red-400 mb-2 uppercase italic">
              Security Update Required
            </h2>
            <p className="text-center text-gray-200 mb-6 text-sm">
              You are using a default password. <br/> Please set a new password to continue.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">NEW PASSWORD</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 8 chars (Letter + Number)"
                  className="mt-1 w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-white outline-none"
                />
              </div>

              {changePasswordError && (
                <p className="text-red-400 text-center font-bold text-xs bg-red-900/40 py-2 rounded">
                  {changePasswordError}
                </p>
              )}

              <button
                type="submit"
                disabled={changePasswordLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition shadow-lg mt-2"
              >
                {changePasswordLoading ? "SAVING..." : "UPDATE & SIGN IN"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}