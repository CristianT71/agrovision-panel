import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import axios from "axios";
import { authService } from "../../services/auth.service";

type Role = "profesional" | "administrador";
type ApiRole = "admin" | "agronomo" | "productor";

const PREFIXES = [
  { code: "co", dial: "+57" },
  { code: "us", dial: "+1" },
  { code: "mx", dial: "+52" },
  { code: "pe", dial: "+51" },
  { code: "ec", dial: "+593" },
];

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('profesional')
  const [dial, setDial] = useState('+57')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<"enterPhone" | "enterOtp">("enterPhone");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const numericPhone = phone.replace(/\D/g, "");
  const isPhoneValid = numericPhone.length >= 7;
  const formattedPhone = `${dial}${numericPhone}`;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const mapRoleToApi = (r: Role): ApiRole => {
    return r === "profesional" ? "agronomo" : "admin";
  };

  const enviarCodigo = async () => {
    setError(null);
    if (!isPhoneValid) {
      setError("Número inválido");
      return;
    }
    setLoading(true);
    try {
      await authService.solicitarOtp({ telefono: formattedPhone });
      setStep("enterOtp");
      setCountdown(30);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.mensaje ?? err.message);
      } else {
        setError(String(err ?? "Error enviando código"));
      }
    } finally {
      setLoading(false);
    }
  };

  const reenviarCodigo = async () => {
    if (countdown > 0) return;
    await enviarCodigo();
  };

  const validarCodigo = async () => {
    setError(null);
    if (otp.trim().length === 0) {
      setError("Ingresa el código");
      return;
    }
    setLoading(true);
    try {
      const rolSeleccionado = mapRoleToApi(role);
      const { accessToken } = await authService.validarOtp({
        telefono: formattedPhone,
        codigo: otp.trim(),
        rolSeleccionado,
      });
      localStorage.setItem("token", accessToken);
      navigate("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.mensaje ?? err.message);
      } else {
        setError(String(err ?? "Código inválido"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-3xl font-bold text-gray-900">Iniciar sesión</h2>
      <p className="mt-2 text-sm text-gray-500">
        Ingresa tu número de celular para recibir un código de verificación.
      </p>

      <div className="mt-8">
        <label className="text-sm font-medium text-gray-700">
          Acceder como
        </label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Button
            variant="toggle"
            active={role === "profesional"}
            onClick={() => setRole("profesional")}
          >
            Agrónomo
          </Button>
          <Button
            variant="toggle"
            active={role === "administrador"}
            onClick={() => setRole("administrador")}
          >
            Administrador
          </Button>
        </div>
      </div>

      {step === "enterPhone" && (
        <>
          <div className="mt-6">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Número de celular
            </label>
            <div className="mt-2 flex gap-2">
              <select
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-agro-green focus:outline-none"
              >
                {PREFIXES.map((p) => (
                  <option key={p.dial} value={p.dial}>
                    {p.code} {p.dial}
                  </option>
                ))}
              </select>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="311 452 8801"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
              />
            </div>
          </div>

     
          <div className="mt-6">
            <Button disabled={!isPhoneValid || loading} onClick={enviarCodigo}>
              {loading ? "Enviando..." : "Enviar código"}
            </Button>
          </div>
        </>
      )}

      {step === "enterOtp" && (
        <>
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-700">Código de 6 dígitos</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              placeholder="123456"
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-agro-green focus:outline-none"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Enviado a <strong>{formattedPhone}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="text-sm text-agro-green disabled:opacity-40"
                onClick={reenviarCodigo}
                disabled={countdown > 0 || loading}
              >
                {countdown > 0 ? `Reenviar en ${countdown}s` : "Reenviar código"}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <Button disabled={loading} onClick={validarCodigo}>
              {loading ? "Validando..." : "Validar código"}
            </Button>
          </div>
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Eres nuevo?{" "}
        <Link to="/solicitar-acceso" className="font-medium text-agro-green hover:underline">
          Solicitar acceso
        </Link>
      </p>
    </AuthLayout>
  );
}