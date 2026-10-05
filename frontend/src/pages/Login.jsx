import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import {
  HeartPulse,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  ShieldCheck,
  Activity,
  Cpu,
  KeyRound,
  CheckCircle,
  X,
  ArrowLeft
} from "lucide-react";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: email.trim(),
        password
      });
      localStorage.setItem("token", res.data.token);
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      navigate("/dashboard");
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      if (serverMessage) {
        setError(serverMessage);
      } else if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to server. Please check if backend is running on port 5001.");
      } else {
        setError("Invalid credentials. Please check your email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email);
    setForgotStep(1);
    setForgotError("");
    setForgotSuccess("");
    setResetCode("");
    setNewPassword("");
    setShowForgotModal(true);
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);
    try {
      const res = await API.post("/auth/forgot-password", { email: forgotEmail.trim() });
      setForgotSuccess(res.data.message || "Reset code generated!");
      if (res.data.resetCode) {
        setResetCode(res.data.resetCode);
      }
      setForgotStep(2);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg) {
        setForgotError(msg);
      } else if (err.code === "ERR_NETWORK") {
        setForgotError("Cannot connect to server. Please ensure backend is running.");
      } else {
        setForgotError("Failed to request reset code. Please try again.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);
    try {
      const res = await API.post("/auth/reset-password", {
        email: forgotEmail.trim(),
        resetCode,
        newPassword
      });
      setSuccessMsg(res.data.message || "Password updated successfully! Log in with your new password.");
      setEmail(forgotEmail.trim());
      setShowForgotModal(false);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg) {
        setForgotError(msg);
      } else if (err.code === "ERR_NETWORK") {
        setForgotError("Cannot connect to server. Please ensure backend is running.");
      } else {
        setForgotError("Failed to reset password. Please check your verification code.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Illustration Panel */}
      <div className="auth-left-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-panel-content">
          <div className="auth-panel-icon">
            <HeartPulse size={36} color="#fff" />
          </div>
          <h1 className="auth-panel-title">MedPulse Analytics</h1>
          <p className="auth-panel-subtitle">
            Real-time clinical intelligence platform powered by AI for modern healthcare professionals
          </p>

          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-dot" />
              <span className="auth-feature-text">AI-powered risk prediction engine</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-dot" />
              <span className="auth-feature-text">Real-time patient vitals monitoring</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-dot" />
              <span className="auth-feature-text">Advanced clinical analytics & insights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-right-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <Link to="/" className="auth-card-logo">
              <div className="auth-card-logo-icon">
                <HeartPulse size={20} />
              </div>
              <span className="auth-card-logo-text">MedPulse</span>
            </Link>
            <h2 className="auth-card-title">Welcome back</h2>
            <p className="auth-card-desc">Sign in to your clinical analytics portal</p>
          </div>

          {successMsg && (
            <div className="auth-success-alert">
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="auth-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-icon" size={17} />
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label>Password</label>
                <button
                  type="button"
                  className="auth-forgot"
                  onClick={openForgotModal}
                  style={{ background: "none", border: "none", padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="auth-input-wrapper">
                <Lock className="auth-icon" size={17} />
                <input
                  id="login-password"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button id="login-submit" type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <LogIn size={18} />
              )}
              <span>{loading ? "Authenticating..." : "Sign In to Portal"}</span>
            </button>
          </form>

          <div className="auth-trust-row">
            <div className="auth-trust-item">
              <ShieldCheck size={14} />
              <span>HIPAA Compliant</span>
            </div>
            <div className="auth-trust-item">
              <Activity size={14} />
              <span>99.9% Uptime</span>
            </div>
            <div className="auth-trust-item">
              <Cpu size={14} />
              <span>AI Powered</span>
            </div>
          </div>

          <div className="auth-footer">
            <span>New to MedPulse?</span>
            <Link to="/register" className="auth-link">Create account</Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="auth-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShowForgotModal(false)}>
              <X size={20} />
            </button>

            {forgotStep === 1 ? (
              <>
                <div className="auth-modal-header">
                  <div className="auth-modal-icon">
                    <KeyRound size={24} />
                  </div>
                  <h3>Reset Password</h3>
                  <p>Enter your registered email address to request a 6-digit password reset code.</p>
                </div>

                {forgotError && (
                  <div className="auth-error-alert">
                    <AlertCircle size={16} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleRequestResetCode} className="auth-form">
                  <div className="auth-field">
                    <label>Registered Email Address</label>
                    <div className="auth-input-wrapper">
                      <Mail className="auth-icon" size={17} />
                      <input
                        type="email"
                        className="auth-input"
                        placeholder="doctor@hospital.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-modal-actions">
                    <button
                      type="button"
                      className="auth-btn-secondary"
                      onClick={() => setShowForgotModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="auth-btn" disabled={forgotLoading}>
                      {forgotLoading ? <span className="auth-spinner" /> : "Send Reset Code"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="auth-modal-header">
                  <div className="auth-modal-icon">
                    <ShieldCheck size={24} />
                  </div>
                  <h3>Set New Password</h3>
                  <p>Verification code generated for <strong>{forgotEmail}</strong></p>
                </div>

                {forgotSuccess && (
                  <div className="auth-success-alert">
                    <CheckCircle size={16} />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                {forgotError && (
                  <div className="auth-error-alert">
                    <AlertCircle size={16} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="auth-form">
                  <div className="auth-field">
                    <label>6-Digit Verification Code</label>
                    <div className="auth-input-wrapper">
                      <KeyRound className="auth-icon" size={17} />
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="123456"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>New Password</label>
                    <div className="auth-input-wrapper">
                      <Lock className="auth-icon" size={17} />
                      <input
                        type="password"
                        className="auth-input"
                        placeholder="Enter new password (min 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="auth-modal-actions">
                    <button
                      type="button"
                      className="auth-btn-secondary"
                      onClick={() => setForgotStep(1)}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button type="submit" className="auth-btn" disabled={forgotLoading}>
                      {forgotLoading ? <span className="auth-spinner" /> : "Confirm New Password"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;