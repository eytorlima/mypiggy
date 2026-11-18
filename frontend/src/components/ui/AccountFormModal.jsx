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
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';

// Toda conta criada pelo usuário é bancária (o back-end também força esse tipo)
const NEW_ACCOUNT_TYPE = 'BANK_ACCOUNT';

// Primeiro ícone da lista é sempre o padrão
const DEFAULT_ICON = Object.keys(accountIconMap)[0];

/* ---------- Schema ---------- */

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(30, 'Máximo de 30 caracteres')
    .regex(/^\p{L}+(?: \p{L}+)*$/u, 'Use apenas letras e espaços (sem números ou símbolos)'),
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
  // Carteira (conta padrão): nome fixo e saldo nunca negativo
  const isDefaultAccount = !!account?.isDefault;
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
      const debt = !account.isDefault && cents < 0; // Carteira nunca é devedora
      reset({
        name: account.name,
        balance: formatMoney(Math.abs(cents) / 100),
        isDebt: debt,
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
      const debt = data.isDebt && !isDefaultAccount;
      const signedCents = debt && cents > 0 ? -cents : cents;

      const payload = {
        name: data.name,
        // Na edição mantém o tipo atual; na criação, sempre conta bancária
        accountType: isEdit ? account.accountType : NEW_ACCOUNT_TYPE,
        balanceInCents: signedCents,
        color: data.color,
        icon: data.icon,
      };

      const saved = isEdit
        ? await updateAccount(account.id, payload)
        : await createAccount(payload);

      toast.success(isEdit ? 'Conta atualizada.' : 'Conta bancária criada com sucesso!');
      onSuccess(saved, isEdit);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erro ao salvar conta.');
    }
  }

  if (!mounted) return null;

  const title = !isEdit
    ? 'Nova conta bancária'
    : isDefaultAccount
      ? 'Editar Carteira'
      : 'Editar conta';

  return (
    <ModalShell visible={visible} onClose={onClose} titleId={titleId}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 id={titleId} className="text-lg font-bold text-gray-800">
          {title}
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
        <input type="hidden" {...register('color')} />
        <input type="hidden" {...register('icon')} />

        {/* Aviso: deixa claro que a conta criada aqui é bancária */}
        {!isEdit && (
          <div
            role="note"
            className="flex gap-2 p-3 rounded-lg bg-primary-50 border border-primary-100 text-xs text-primary-700"
          >
            <InfoOutlined fontSize="small" aria-hidden="true" className="flex-shrink-0" />
            <p>
              Você está criando uma <strong>conta bancária</strong> (Nubank, Itaú, poupança...).
              O dinheiro em espécie fica na sua <strong>Carteira</strong>, que já foi criada
              automaticamente.
            </p>
          </div>
        )}

        {/* Nome (na Carteira é somente leitura; readOnly mantém o valor no formulário) */}
        <div className="flex flex-col gap-1">
          <InputField
            className={isDefaultAccount ? 'text-gray-500' : 'text-black'}
            label={isDefaultAccount ? 'Nome' : 'Nome da conta'}
            placeholder="Ex: Nubank, Itaú..."
            maxLength={30}
            readOnly={isDefaultAccount}
            register={register('name', {
              // Impede digitar números e símbolos
              onChange: (e) => setValue('name', e.target.value.replace(/[^\p{L} ]/gu, '')),
            })}
            error={errors.name?.message}
          />
          {isDefaultAccount && (
            <p className="text-xs text-gray-500">
              A Carteira é uma conta padrão: o nome não pode ser alterado e ela não pode ser
              excluída.
            </p>
          )}
        </div>

        {/* Positivo / Devedor: não existe para a Carteira */}
        {!isDefaultAccount && (
          <BalanceSignToggle
            isDebt={isDebt}
            onChange={(v) => setValue('isDebt', v, { shouldDirty: true })}
          />
        )}

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
          <span   className={`font-semibold ${previewCents > 0 ? 'text-primary-700' : previewCents < 0 ? 'text-red-600' : 'text-gray-500'}`}>
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
          {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar conta bancária'}
        </button>
      </form>
    </ModalShell>
  );
}