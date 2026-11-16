import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createAccount, updateAccount } from '../../services/accountService';
import { InputField } from '../ui/InputField';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import { useToast } from '../../contexts/ToastContext';
import { formatBRL } from '../../utils/formatCurrency';
import {toCents, parseMoney, formatMoney, sanitizeMoney} from '../../utils/moneyUtils';
import { colorMap, accountIconMap } from '../../utils/accountUtils';
import { SelectField } from './SelectField';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';

const accountTypes = [
  { value: 'BANK_ACCOUNT', label: 'Conta Bancária' },
  { value: 'WALLET', label: 'Carteira' },
];

// Primeiro ícone da lista é sempre o padrão
const DEFAULT_ICON = Object.keys(accountIconMap)[0];

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
  accountType: '',
  balance: '0,00',
  isDebt: false,
  color: 'green',
  icon: DEFAULT_ICON,
};

/* ---------- Seletor Positivo / Devedor (segmented control animado) ---------- */

function BalanceSignToggle({ isDebt, onChange }) {
  return (
    <div className="flex flex-col gap-1" role="group" aria-label="Situação do saldo">
      <span className="text-sm font-medium text-gray-700">Situação do saldo</span>

      <div className="relative grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
        {/* Pílula deslizante */}
        <div
          aria-hidden="true"
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
                      ${!isDebt ? 'text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <TrendingUpOutlined fontSize="small" aria-hidden="true" />
          Saldo positivo
        </button>

        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={isDebt}
          className={`relative z-10 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold
                      rounded-md transition-colors hover:cursor-pointer
                      ${isDebt ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <TrendingDownOutlined fontSize="small" aria-hidden="true" />
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
  const titleId = useId();
  const toast = useToast();

  const { mounted, visible } = useModalTransition(open, onClose);

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

      toast.success(isEdit ? 'Conta atualizada.' : 'Conta criada com sucesso!');
      onSuccess(saved, isEdit);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erro ao salvar conta.');
    }
  }

  if (!mounted) return null;

  return (
    <ModalShell visible={visible} onClose={onClose} titleId={titleId}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 id={titleId} className="text-lg font-bold text-gray-800">
          {isEdit ? 'Editar conta' : 'Nova conta'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="-mr-2 w-10 h-10 rounded-full flex items-center justify-center
                     text-gray-500 hover:text-gray-700 hover:cursor-pointer"
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
        <p className="text-xs text-gray-500 -mt-2" aria-live="polite">
          Saldo da conta:{' '}
          <span className={`font-semibold ${previewCents < 0 ? 'text-red-600' : 'text-primary-700'}`}>
            {formatBRL(previewCents)}
          </span>
        </p>

        {/* Seletor de cor */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Cor</span>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Cor">
            {Object.entries(colorMap).map(([key, hex]) => (
              <button
                key={key}
                type="button"
                aria-label={`Cor ${key}`}
                aria-pressed={selectedColor === key}
                onClick={() => setValue('color', key, { shouldValidate: true })}
                className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full border-2 transition-all hover:cursor-pointer
                  ${selectedColor === key ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
          {errors.color && <p className="text-red-600 text-xs">{errors.color.message}</p>}
        </div>

        {/* Seletor de ícone */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Ícone</span>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Ícone">
            {Object.entries(accountIconMap).map(([key, icon]) => (
              <button
                key={key}
                type="button"
                aria-label={`Ícone ${key}`}
                aria-pressed={selectedIcon === key}
                onClick={() => setValue('icon', key, { shouldValidate: true })}
                className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all hover:cursor-pointer
                  ${selectedIcon === key
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
              >
                {icon}
              </button>
            ))}
          </div>
          {errors.icon && <p className="text-red-600 text-xs">{errors.icon.message}</p>}
        </div>

        {apiError && (
          <p role="alert" className="text-red-600 text-sm text-center">
            {apiError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600
                     disabled:opacity-50 transition-colors hover:cursor-pointer"
        >
          {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar conta'}
        </button>
      </form>
    </ModalShell>
  );
}