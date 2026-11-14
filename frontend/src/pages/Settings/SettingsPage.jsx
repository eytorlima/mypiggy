import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSettings, updateSettings } from '../../services/userService';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { EditNameModal } from '../../components/settings/EditNameModal';
import { ChangePasswordModal } from '../../components/settings/ChangePasswordModal';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';

// Moeda, idioma e fuso são fixos no sistema (CHECK no banco): aparecem só como informação
const CURRENCY_LABELS = { BRL: 'Real brasileiro (BRL)' };
const LANGUAGE_LABELS = { 'pt-BR': 'Português (Brasil)' };
const TIME_ZONE_LABELS = { 'America/Sao_Paulo': 'Brasília (GMT-3)' };

function Section({ icon, title, children }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-gray-300 bg-white p-4 shadow-xs">
      <div className="flex items-center gap-2 text-gray-700">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-700 break-words">{value || '—'}</span>
    </div>
  );
}

// Campo fixo: mostra o valor num select desabilitado (única opção possível)
function FixedSelect({ label, value, labels }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <select
        disabled
        value={value}
        onChange={() => {}}
        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 opacity-60 cursor-not-allowed"
      >
        <option value={value}>{labels[value] || value}</option>
      </select>
    </div>
  );
}

const secondaryButton =
  'flex-1 h-10 rounded-lg border border-primary-500 text-primary-500 text-sm font-semibold ' +
  'hover:cursor-pointer hover:bg-primary-500 hover:text-white transition-colors';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [nameOpen, setNameOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  // Aviso curto no topo (sucesso ou erro); some sozinho
  const [feedback, setFeedback] = useState(null);
  const feedbackTimer = useRef(null);

  useEffect(() => {
    loadSettings();
    return () => clearTimeout(feedbackTimer.current);
  }, []);

  function showFeedback(type, text) {
    clearTimeout(feedbackTimer.current);
    setFeedback({ type, text });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3500);
  }

  async function loadSettings() {
    try {
      setLoading(true);
      setLoadError('');
      setSettings(await getSettings());
    } catch {
      setLoadError('Não foi possível carregar as preferências.');
    } finally {
      setLoading(false);
    }
  }

  // Atualização otimista: o interruptor muda na hora e volta atrás se a API falhar
  async function handleToggleNotifications(next) {
    const previous = settings;
    setSettings({ ...settings, notificationEnabled: next });
    setSavingNotifications(true);

    try {
      const saved = await updateSettings({ notificationEnabled: next });
      setSettings(saved);
    } catch (err) {
      setSettings(previous);
      showFeedback('error', err.response?.data?.message || 'Não foi possível salvar a preferência.');
    } finally {
      setSavingNotifications(false);
    }
  }

  function handleNameSuccess(profile) {
    updateUser({ name: profile.name }); // o nome novo aparece no app sem novo login
    setNameOpen(false);
    showFeedback('success', 'Nome atualizado com sucesso.');
  }

  function handlePasswordSuccess() {
    setPasswordOpen(false);
    showFeedback('success', 'Senha alterada com sucesso.');
  }

  function handleLogout() {
    logout(); // remove o token do localStorage e zera o usuário
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex flex-col gap-4 p-4 w-full max-w-2xl mx-auto">
      <h2 className="font-bold text-gray-700 text-center mt-5">Configurações</h2>

      {feedback && (
        <p
          role="status"
          className={`rounded-lg px-3 py-2 text-sm text-center
                      ${feedback.type === 'success'
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-white border border-red-500 text-red-700'}`}
        >
          {feedback.text}
        </p>
      )}

      {/* Perfil */}
      <Section icon={<PersonOutlined fontSize="small" />} title="Perfil">
        <InfoRow label="Nome" value={user?.name} />
        <InfoRow label="E-mail" value={user?.email} />

        <div className="flex gap-3 mt-1">
          <button type="button" onClick={() => setNameOpen(true)} className={secondaryButton}>
            Editar nome
          </button>
          <button type="button" onClick={() => setPasswordOpen(true)} className={secondaryButton}>
            Alterar senha
          </button>
        </div>
      </Section>

      {/* Preferências */}
      <Section icon={<TuneOutlined fontSize="small" />} title="Preferências">
        {loading && (
          <div className="flex flex-col gap-3">
            <SkeletonCard height="h-10" />
            <SkeletonCard height="h-10" />
            <SkeletonCard height="h-10" />
          </div>
        )}

        {!loading && loadError && (
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-red-700 text-sm text-center">{loadError}</p>
            <button
              type="button"
              onClick={loadSettings}
              className="px-4 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-semibold
                         hover:cursor-pointer hover:bg-primary-600 transition-colors"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {!loading && settings && (
          <>
            <FixedSelect label="Moeda" value={settings.currency} labels={CURRENCY_LABELS} />
            <FixedSelect label="Idioma" value={settings.language} labels={LANGUAGE_LABELS} />
            <FixedSelect label="Fuso horário" value={settings.timeZone} labels={TIME_ZONE_LABELS} />

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">Notificações</span>
                <span className="text-xs text-gray-500">Lembretes e avisos dentro do sistema</span>
              </div>
              <ToggleSwitch
                label="Ativar notificações"
                checked={settings.notificationEnabled}
                disabled={savingNotifications}
                onChange={handleToggleNotifications}
              />
            </div>
          </>
        )}
      </Section>

      {/* Categorias */}
      <Section icon={<CategoryOutlined fontSize="small" />} title="Categorias">
        <button
          type="button"
          onClick={() => navigate('/categories')}
          className="flex items-center justify-between rounded-lg border border-gray-300 px-3 h-11 text-sm
                     text-gray-700 hover:cursor-pointer hover:border-primary-500 transition-colors"
        >
          Gerenciar categorias personalizadas
          <ChevronRightOutlined fontSize="small" className="text-gray-400" />
        </button>
      </Section>

      {/* Conta */}
      <Section icon={<LogoutOutlined fontSize="small" />} title="Conta">
        <button
          type="button"
          onClick={handleLogout}
          className="h-10 rounded-lg border border-red-500 text-red-500 text-sm font-semibold
                     hover:cursor-pointer hover:bg-red-500 hover:text-white transition-colors"
        >
          Sair
        </button>
      </Section>

      <EditNameModal
        open={nameOpen}
        currentName={user?.name}
        onClose={() => setNameOpen(false)}
        onSuccess={handleNameSuccess}
      />

      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
}