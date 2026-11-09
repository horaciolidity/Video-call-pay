import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  initialTab?: 'login' | 'register';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ initialTab = 'login', onClose }) => {
  const { login, register, quickSwitchAccount } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'recover'>(initialTab);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regAlias, setRegAlias] = useState('');
  const [regRole, setRegRole] = useState<'cliente' | 'prestador'>('cliente');
  const [regAge, setRegAge] = useState<number>(24);
  const [regCountry, setRegCountry] = useState('España');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Recovery
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverSuccess, setRecoverSuccess] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regAge < 18) {
      setError('Debes ser mayor de 18 años para utilizar la plataforma.');
      return;
    }
    if (!termsAccepted) {
      setError('Debes aceptar los términos y condiciones del servicio.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await register({
        email,
        password,
        name: regName,
        alias: regAlias || regName,
        role: regRole,
        age: regAge,
        country: regCountry,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.recoverPassword(recoverEmail);
      setRecoverSuccess(res.message);
    } catch (err: any) {
      setError(err.message || 'Error al enviar recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSwitch = async (id: string) => {
    await quickSwitchAccount(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 flex flex-col my-auto overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tabs */}
        {tab !== 'recover' && (
          <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                tab === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                tab === 'register' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN TAB */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h3 className="text-xl font-extrabold text-white">Bienvenido de nuevo</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ingresa a tu cuenta de GóndolaLive</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400 font-semibold">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setTab('recover')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Iniciando sesión...' : 'Ingresar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Access Bar */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-2 text-center">
                Acceso Rápido con Cuentas Demo
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleDemoSwitch('usr_client_demo')}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-blue-300 hover:border-slate-700 font-medium"
                >
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSwitch('usr_prov_1')}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 hover:border-slate-700 font-medium"
                >
                  Prestador
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSwitch('usr_superadmin')}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-rose-300 hover:border-slate-700 font-medium"
                >
                  SuperAdmin
                </button>
              </div>
            </div>
          </form>
        )}

        {/* REGISTER TAB */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <h3 className="text-xl font-extrabold text-white">Crea tu cuenta</h3>
              <p className="text-xs text-slate-400 mt-0.5">Únete como cliente o publica tu propio escaparate</p>
            </div>

            {/* Role picker */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-xs">¿Qué rol deseas desempeñar?</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRegRole('cliente')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    regRole === 'cliente'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Cliente (Comprar llamadas)
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole('prestador')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    regRole === 'prestador'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Prestador (Ofrecer videollamadas)
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Alias / Nombre Público</label>
                  <input
                    type="text"
                    value={regAlias}
                    onChange={(e) => setRegAlias(e.target.value)}
                    placeholder="Opcional"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Edad (+18 años)</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={regAge}
                    onChange={(e) => setRegAge(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 text-[11px] text-slate-400 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="accent-indigo-500 mt-0.5 rounded"
              />
              <span>
                Confirmo que soy mayor de 18 años y acepto las políticas de privacidad y términos de servicio de GóndolaLive.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Creando cuenta...' : 'Completar Registro'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* RECOVER TAB */}
        {tab === 'recover' && (
          <form onSubmit={handleRecover} className="space-y-4">
            <div>
              <h3 className="text-xl font-extrabold text-white">Recuperar Contraseña</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Te enviaremos un enlace seguro para restablecer el acceso a tu cuenta.
              </p>
            </div>

            {recoverSuccess ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <p>{recoverSuccess}</p>
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="font-bold underline text-white text-xs pt-1 block"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <>
                <div className="text-xs">
                  <label className="block text-slate-400 font-semibold mb-1">Correo Electrónico Registrado</label>
                  <input
                    type="email"
                    required
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs"
                  >
                    {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
