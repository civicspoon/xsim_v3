export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('images/xsim-bg.png')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Login Card */}
<div className="relative z-10 w-full max-w-md rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="images/aotavsec_logo.png"
            alt="AOT AVSEC"
            className="h-20 object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-center text-gray-200">
          Airport Security Training System
        </h1>
        <p className="text-center text-sm text-gray-200 mt-1">
          Authorized Personnel Login
        </p>

        {/* Form */}
        <form className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Employee ID (EMID) / Citizen ID
            </label>
            <input
              type="text"
              placeholder="Enter EMID or Citizen ID"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-md transition"
          >
            SIGN IN
          </button>
        </form>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-center text-gray-300 leading-relaxed">
          This system is restricted to authorized airport security personnel only.
          <br />
          Unauthorized access is prohibited and monitored.
        </p>
      </div>
    </div>
  );
}
