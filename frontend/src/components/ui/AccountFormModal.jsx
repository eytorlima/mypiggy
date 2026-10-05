import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createAccount, updateAccount } from '../../services/accountService';
import { InputField } from '../ui/InputField';
import { formatBRL } from '../../utils/formatCurrency';
import { colorMap, accountIconMap } from '../../utils/accountUtils';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';

const accountTypes = [
  { value: 'BANK_ACCOUNT', label: 'Conta Bancária' },
  { value: 'WALLET', label: 'Carteira' },
];

// Primeiro ícone da lista é sempre o padrão
const DEFAULT_ICON = Object.keys(accountIconMap)[0];

/* ---------- Helpers de dinheiro (podem ir para utils/moneyUtils.js) ---------- */

// Aceita "1234,56", "1.234,56", "1234.56" e devolve number (ou NaN)
function parseMoney(str) {
  if (!str) return 0;
  let s = String(str).trim();
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return Number(s);
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2).replace('.', ',');
}

// Só dígitos, um único separador (. ou ,) e no máximo 2 casas decimais
function sanitizeMoney(str) {
  const s = str.replace(/[^\d.,]/g, '');
  const idx = s.search(/[.,]/);
  if (idx === -1) return s;

  const separator = s[idx];
  const intPart = s.slice(0, idx);
  const decPart = s.slice(idx + 1).replace(/[.,]/g, '').slice(0, 2);

  return `${intPart}${separator}${decPart}`;
}

/* ---------- Schema ---------- */

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  accountType: z.string().min(1, 'Tipo é obrigatório'),
  // O campo guarda apenas o valor (módulo). O sinal vem de isDebt.
  balance: z
    .string()
    .refine((v) => !Number.isNaN(parseMoney(v)), 'Valor inválido')
    .refine((v) => parseMoney(v) >= 0, 'Digite apenas o valor, sem sinal'),
  isDebt: z.boolean(),
  color: z.string().min(1, 'Cor é obrigatória'),
  icon: z.string().min(1, 'Ícone é obrigatório'),
});

const EMPTY_VALUES = {
  name: '',
  accountType: 'WALLET',
  balance: '0,00',
  isDebt: false,
  color: 'green',
  icon: DEFAULT_ICON,
};

/* ---------- Select customizado com animação ---------- */

function SelectField({ label, options, value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 pl-3 pr-4 py-2 rounded-lg border border-gray-300
                     bg-white text-sm text-gray-700 hover:cursor-pointer focus:outline-none focus:border-primary-500"
        >
          <span>{selected?.label ?? 'Selecione...'}</span>
          <ExpandMoreOutlined
            fontSize="small"
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <ul
          role="listbox"
          className={`absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden
                      origin-top transition-all duration-200 ease-out z-60
                      ${isOpen
                        ? 'opacity-100 translate-y-0 scale-100'
                        : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-sm hover:cursor-pointer transition-colors
                          ${opt.value === value
                            ? 'bg-primary-50 text-primary-600 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

/* ---------- Seletor Positivo / Devedor (segmented control animado) ---------- */

function BalanceSignToggle({ isDebt, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Situação do saldo</label>

      <div className="relative grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
        {/* Pílula deslizante */}
        <div
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-md bg-white shadow
                      transition-transform duration-200 ease-out
                      ${isDebt ? 'translate-x-full' : 'translate-x-0'}`}
        />

        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={!isDebt}
          className={`relative z-10 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold
                      rounded-md transition-colors hover:cursor-pointer
                      ${!isDebt ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <TrendingUpOutlined fontSize="small" />
          Saldo positivo
        </button>

        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={isDebt}
          className={`relative z-10 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold
                      rounded-md transition-colors hover:cursor-pointer
                      ${isDebt ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <TrendingDownOutlined fontSize="small" />
          Devedor
        </button>
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */

export function AccountFormModal({ open, account, onClose, onSuccess }) {
  const isEdit = !!account;
  const [apiError, setApiError] = useState('');

  // mounted: está no DOM | visible: está na posição final (dispara a transição)
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  const accountType = watch('accountType');
  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const isDebt = watch('isDebt');
  const balanceText = watch('balance');

  // Prévia do saldo final com sinal
  const previewCents = (() => {
    const value = parseMoney(balanceText);
    if (Number.isNaN(value)) return 0;
    const cents = Math.round(value * 100);
    return isDebt && cents > 0 ? -cents : cents;
  })();

  // Animação de entrada/saída
  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  // Fechar com ESC
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Preenche (edição) ou limpa (criação) a cada abertura
  useEffect(() => {
    if (!open) return;
    setApiError('');
    if (account) {
      const cents = account.balanceInCents || 0;
      reset({
        name: account.name,
        accountType: account.accountType,
        balance: formatMoney(Math.abs(cents) / 100),
        isDebt: cents < 0,
        color: account.color || 'green',
        icon: account.icon || DEFAULT_ICON,
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [account, open, reset]);

  async function onSubmit(data) {
    setApiError('');
    try {
      const cents = Math.round(parseMoney(data.balance) * 100);
      const signedCents = data.isDebt && cents > 0 ? -cents : cents;

      const payload = {
        name: data.name,
        accountType: data.accountType,
        balanceInCents: signedCents,
        color: data.color,
        icon: data.icon,
      };

      const saved = isEdit
        ? await updateAccount(account.id, payload)
        : await createAccount(payload);

      onSuccess(saved, isEdit);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erro ao salvar conta.');
    }
  }

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center
                  transition-opacity duration-200 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[95vh] overflow-y-auto
                    shadow-2xl transition-all duration-300 ease-out
                    ${visible ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Editar conta' : 'Nova conta'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
          >
            <CloseOutlined />
          </button>
        </div>

        {/* [&_label]:text-gray-700 sobrescreve a label branca do InputField */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 [&_label]:text-gray-700"
        >
          {/* Campos "escondidos" que guardam valores dos seletores customizados */}
          <input type="hidden" {...register('accountType')} />
          <input type="hidden" {...register('color')} />
          <input type="hidden" {...register('icon')} />

          {/* Nome */}
          <InputField
            className="text-black"
            label="Nome da conta"
            placeholder="Ex: Nubank, Carteira..."
            register={register('name')}
            error={errors.name?.message}
          />

          {/* Tipo */}
          <SelectField
            label="Tipo de conta"
            options={accountTypes}
            value={accountType}
            onChange={(v) => setValue('accountType', v, { shouldValidate: true })}
            error={errors.accountType?.message}
          />

          {/* Positivo / Devedor */}
          <BalanceSignToggle
            isDebt={isDebt}
            onChange={(v) => setValue('isDebt', v, { shouldDirty: true })}
          />

          {/* Saldo: seleciona o conteúdo ao focar para a digitação substituir o 0,00 */}
          <div
            onFocus={(e) => {
              const el = e.target;
              setTimeout(() => el.select(), 0);
            }}
          >
            <InputField
              className={isDebt ? 'text-red-600' : 'text-black'}
              label={
                isEdit
                  ? isDebt ? 'Valor devido atual (R$)' : 'Saldo atual (R$)'
                  : isDebt ? 'Valor devido (R$)' : 'Saldo inicial (R$)'
              }
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              register={register('balance', {
                onChange: (e) => setValue('balance', sanitizeMoney(e.target.value)),
                onBlur: (e) =>
                  setValue('balance', formatMoney(parseMoney(e.target.value) || 0)),
              })}
              error={errors.balance?.message}
            />
          </div>

          {/* Prévia do saldo final */}
          <p className="text-xs text-gray-500 -mt-2">
            Saldo da conta:{' '}
            <span className={`font-semibold ${previewCents < 0 ? 'text-red-600' : 'text-primary-600'}`}>
              {formatBRL(previewCents)}
            </span>
          </p>

          {/* Seletor de cor */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(colorMap).map(([key, hex]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setValue('color', key, { shouldValidate: true })}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:cursor-pointer
                    ${selectedColor === key ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
            {errors.color && <p className="text-red-500 text-xs">{errors.color.message}</p>}
          </div>

          {/* Seletor de ícone */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Ícone</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(accountIconMap).map(([key, icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setValue('icon', key, { shouldValidate: true })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all hover:cursor-pointer
                    ${selectedIcon === key
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
            {errors.icon && <p className="text-red-500 text-xs">{errors.icon.message}</p>}
          </div>

          {apiError && <p className="text-red-500 text-sm text-center">{apiError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600
                       disabled:opacity-50 transition-colors hover:cursor-pointer"
          >
            {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}