import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import NotificationModal from "./NotificationModal";
import lottie from "lottie-web";
import animation from "../assets/images/animation.json";

interface LoginProps {
  onLogin: (token: string) => void;
}

/**
 * Developer-only Login component (NO ResVault)
 * - 直接输入任意 publicKey（可伪造），POST 到后端 /api/transactions/login 获取 JWT
 * - 仅用于本地开发 / 调试。不要在生产中使用。
 */
const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // ====== Config ======
  // 若将来用环境变量，请改这里
  const DEV_MODE = true;
  const BACKEND_BASE = "http://localhost:8099";

  // ====== UI State ======
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<string>("");

  const [devKey, setDevKey] = useState<string>("DEV_PUBLIC_KEY_123");
  const [loading, setLoading] = useState<boolean>(false);

  // ====== Lottie 动画 ======
  const animationContainer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!animationContainer.current) return;
    const instance = lottie.loadAnimation({
      container: animationContainer.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: animation,
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? instance.play() : instance.pause()));
    });

    observer.observe(animationContainer.current);

    return () => {
      instance.destroy();
      observer.disconnect();
    };
  }, []);

  // ====== Developer Login Handler ======
  const loginWithPublicKey = async (publicKey: string) => {
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_BASE}/api/transactions/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey }),
      });

      const data = await resp.json();
      if (resp.ok && data?.token) {
        // 保存并回调
        sessionStorage.setItem("publicKey", publicKey);
        sessionStorage.setItem("token", data.token);
        onLogin(data.token);
        return;
      }

      // 失败处理
      setModalTitle("Login Failed");
      setModalMessage(data?.message || "Backend did not return a token.");
      setShowModal(true);
    } catch (e: any) {
      setModalTitle("Network Error");
      setModalMessage(e?.message || "Failed to contact backend.");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    if (!devKey || !devKey.trim()) {
      setModalTitle("Invalid publicKey");
      setModalMessage("请输入一个非空的 publicKey。");
      setShowModal(true);
      return;
    }
    await loginWithPublicKey(devKey.trim());
  };

  const handleCloseModal = () => {
    setShowModal(false);
    localStorage.setItem("currentPage", "home");
  };

  return (
    <>
      <div className="page-container">
        <div className="form-container-login">
          <h2 className="heading">ResCash (Dev Login)</h2>

          <div ref={animationContainer} className="animation-container" />

          {/* 说明 */}
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <small style={{ color: "#666" }}>
              开发者模式：可输入任意 publicKey（仅本地调试用）
            </small>
          </div>

          {/* Developer Login */}
          {DEV_MODE && (
            <div className="form-group text-center mb-4" style={{ marginTop: 8 }}>
              <label className="signin-label">Developer Login</label>
              <input
                className="form-control"
                placeholder="Enter any publicKey (e.g. DEV_PUBLIC_KEY_123)"
                value={devKey}
                onChange={(e) => setDevKey(e.target.value)}
                style={{ marginTop: 8 }}
              />
              <button
                type="button"
                className="btn btn-primary oauth-button"
                onClick={handleDevLogin}
                style={{ marginTop: 8 }}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In (DEV)"}
              </button>
            </div>
          )}

        </div>
      </div>

      <NotificationModal
        show={showModal}
        title={modalTitle}
        message={modalMessage}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default Login;
