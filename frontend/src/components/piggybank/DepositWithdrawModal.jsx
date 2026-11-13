import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { depositToPiggyBank, withdrawFromPiggyBank } from '../../services/PiggyBankService';
import { InputField } from '../ui/InputField';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import { formatBRL } from '../../utils/formatCurrency';
import { formatMoney, parseMoney, sanitizeMoney } from '../../utils/moneyUtils';
import { moneyTextToCents } from '../../utils/piggyBankUtils';
import CloseOutlined from '@mui/icons-material/CloseOutlined';

const schema = z.object({
  amount: z
    .string()
    .refine((v) => !Number.isNaN(parseMoney(v)), 'Valor inválido')
    .refine((v) => parseMoney(v) > 0, 'Informe um valor maior que zero'),
});

// mode: 'deposit' (guardar) | 'withdraw' (retirar)
export function DepositWithdrawModal({ open, mode, piggy, accounts, onClose, onSuccess }) {
  const isDeposit = mode === 'deposit';
  const [accountId, setAccountId] = useState('');
  const [apiError, setApiError] = useState('');
  const { mounted, visible } = useModalTransition(open, onClose);

  // Guarda o último porquinho/modo: o pai zera ao fechar e o texto sumiria na animação de saída
  const last = useRef({ piggy, isDeposit });
  if (piggy) last.current = { piggy, isDeposit };
  const shownPiggy = piggy ?? last.current.piggy;
  const shownIsDeposit = piggy ? isDeposit : last.current.isDeposit;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { amount: '0,00' } });

  const amountText = watch('amount');
  const account = accounts.find((a) => a.id === accountId);

  // A cada abertura: limpa o valor e escolhe a primeira conta
  useEffect(() => {
    if (!open) return;
    setApiError('');
    setAccountId(accounts[0]?.id ?? '');
    reset({ amount: '0,00' });
  }, [open, piggy, accounts, reset]);

  const amountCents = (() => {
    const value = parseMoney(amountText);
    return Number.isNaN(value) ? 0 : Math.round(value * 100);
  })();

  // Quanto a conta pode gastar: saldo + limite do cheque especial (o backend usa a mesma regra)
  const accountAvailable = account
    ? (account.balanceInCents || 0) + (account.creditLimitInCents || 0)
    : 0;

  async function onSubmit(data) {
    setApiError('');
    const cents = moneyTextToCents(data.amount);

    // Mesmas regras do backend, para avisar antes de enviar
    if (shownIsDeposit && cents > accountAvailable) {
      setError('amount', { message: 'Saldo insuficiente na conta escolhida' });
      return;
    }
    if (!shownIsDeposit && cents > shownPiggy.balanceInCents) {
      setError('amount', { message: 'Maior que o valor guardado no porquinho' });
      return;
    }

    try {
      const payload = { accountId, amountInCents: cents };
      const updated = shownIsDeposit
        ? await depositToPiggyBank(shownPiggy.id, payload)
        : await withdrawFromPiggyBank(shownPiggy.id, payload);

      onSuccess(updated);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Não foi possível concluir a operação.');
    }
  }

  if (!mounted || !shownPiggy) return null;

  const newBalance = shownPiggy.balanceInCents + (shownIsDeposit ? amountCents : -amountCents);

  return (
    <ModalShell visible={visible} onClose={onClose} size="sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-gray-800">
          {shownIsDeposit ? 'Guardar em' : 'Retirar de'} {shownPiggy.name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
        >
          <CloseOutlined />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {shownIsDeposit
          ? 'O valor sai da conta escolhida e vai para o porquinho.'
          : 'O valor sai do porquinho e volta para a conta escolhida.'}
      </p>

      {accounts.length === 0 ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Cadastre uma conta antes de {shownIsDeposit ? 'guardar' : 'retirar'} dinheiro.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 [&_label]:text-gray-700"
        >
          {/* Conta */}
          <div className="flex flex-col gap-1">
            <label htmlFor="piggy-account" className="text-sm font-medium text-gray-700">
              {shownIsDeposit ? 'Conta de origem' : 'Conta de destino'}
            </label>
            <select
              id="piggy-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-[40px] px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-700
                         shadow-md focus:outline-none focus:border-primary-500 hover:cursor-pointer"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {formatBRL(a.balanceInCents || 0)}
                </option>
              ))}
            </select>
          </div>

          {/* Valor: seleciona o conteúdo ao focar para a digitação substituir o 0,00 */}
          <div
            onFocus={(e) => {
              const el = e.target;
              setTimeout(() => el.select(), 0);
            }}
          >
            <InputField
              label="Valor (R$)"
              type="text"
              placeholder="0,00"
              register={register('amount', {
                onChange: (e) => setValue('amount', sanitizeMoney(e.target.value)),
                onBlur: (e) => setValue('amount', formatMoney(parseMoney(e.target.value) || 0)),
              })}
              error={errors.amount?.message}
            />
          </div>

          {/* Atalho: retirar tudo o que está guardado */}
          {!shownIsDeposit && (
            <button
              type="button"
              onClick={() => setValue('amount', formatMoney(shownPiggy.balanceInCents / 100))}
              className="self-start -mt-2 text-xs font-semibold text-primary-600 hover:underline hover:cursor-pointer"
            >
              Retirar tudo ({formatBRL(shownPiggy.balanceInCents)})
            </button>
          )}

          {/* Resumo */}
          <div className="text-xs text-gray-500 flex flex-col gap-0.5 -mt-1">
            {shownIsDeposit && account && (
              <span>
                Disponível na conta:{' '}
                <span className="font-semibold text-gray-700">{formatBRL(accountAvailable)}</span>
              </span>
            )}
            <span>
              Guardado no porquinho depois:{' '}
              <span className="font-semibold text-gray-700">{formatBRL(Math.max(0, newBalance))}</span>
            </span>
            {!shownIsDeposit && (
              <span>O rendimento estimado ainda não pode ser retirado, só o valor guardado.</span>
            )}
          </div>

          {apiError && <p className="text-red-500 text-sm text-center">{apiError}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !accountId}
            className="w-full py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600
                       disabled:opacity-50 transition-colors hover:cursor-pointer"
          >
            {isSubmitting ? 'Processando...' : shownIsDeposit ? 'Guardar' : 'Retirar'}
          </button>
        </form>
      )}
    </ModalShell>
  );
}