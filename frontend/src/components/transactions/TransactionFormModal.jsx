import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createTransaction,
  updateTransaction,
} from '../../services/transactionService';
import { InputField } from '../ui/InputField';
import { SelectField } from '../ui/SelectField';
import { parseMoney, formatMoney, sanitizeMoney, toCents } from '../../utils/moneyUtils';
import {
  toLocalDateTime,
  dateInputToLocalDateTime,
  localDateTimeToDateInput,
} from '../../utils/dateUtils';
import { filterCategoriesByType } from '../../utils/categoryUtils';
import CloseOutlined from '@mui/icons-material/CloseOutlined';

/* ---------- Configuração ---------- */

const TABS = [
  { value: 'CREDIT', label: 'Receita', submit: 'Registrar receita', btn: 'bg-primary-500 hover:bg-primary-600', text: 'text-primary-600' },
  { value: 'DEBIT', label: 'Despesa', submit: 'Registrar despesa', btn: 'bg-red-500 hover:bg-red-600', text: 'text-red-600' },
  { value: 'TRANSFER', label: 'Transferência', submit: 'Registrar transferência', btn: 'bg-gray-700 hover:bg-gray-800', text: 'text-gray-700' },
];

const RECURRENCE_OPTIONS = [
  { value: 'DAILY', label: 'Diária' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'ANNUAL', label: 'Anual' },
];

const todayInput = () => toLocalDateTime(new Date()).slice(0, 10);

function emptyValues(type = 'DEBIT', accounts = []) {
  return {
    transactionType: type,
    amount: '0,00',
    accountId: accounts.length === 1 ? accounts[0].id : '',
    destinationAccountId: '',
    categoryId: '',
    transactionDate: todayInput(),
    description: '',
    isRecurring: false,
    recurrencyType: 'MONTHLY',
  };
}

/* ---------- Schema ---------- */

const schema = z
  .object({
    transactionType: z.enum(['CREDIT', 'DEBIT', 'TRANSFER']),
    amount: z
      .string()
      .refine((v) => !Number.isNaN(parseMoney(v)), 'Valor inválido')
      .refine((v) => toCents(v) > 0, 'O valor deve ser maior que zero'),
    accountId: z.string().min(1, 'Conta é obrigatória'),
    destinationAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    transactionDate: z.string().min(1, 'Data é obrigatória'),
    description: z.string().max(255, 'Máximo de 255 caracteres').optional(),
    isRecurring: z.boolean(),
    recurrencyType: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.transactionType === 'TRANSFER') {
      if (!d.destinationAccountId) {
        ctx.addIssue({
          code: 'custom',
          path: ['destinationAccountId'],
          message: 'Conta de destino é obrigatória',
        });
      } else if (d.destinationAccountId === d.accountId) {
        ctx.addIssue({
          code: 'custom',
          path: ['destinationAccountId'],
          message: 'Origem e destino devem ser diferentes',
        });
      }
    } else if (d.isRecurring && !d.recurrencyType) {
      ctx.addIssue({
        code: 'custom',
        path: ['recurrencyType'],
        message: 'Escolha a frequência',
      });
    }
  });

/* ---------- Modal ---------- */

export function TransactionFormModal({
  open,
  transaction, // null = nova | objeto = edição
  accounts,
  categories,
  onClose,
  onSuccess,
}) {
  const isEdit = !!transaction;
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
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: emptyValues('DEBIT', accounts),
  });

  const transactionType = watch('transactionType');
  const accountId = watch('accountId');
  const destinationAccountId = watch('destinationAccountId');
  const categoryId = watch('categoryId');
  const isRecurring = watch('isRecurring');
  const recurrencyType = watch('recurrencyType');

  const activeTab = TABS.find((t) => t.value === transactionType) || TABS[1];
  const activeIndex = TABS.findIndex((t) => t.value === transactionType);
  const isTransfer = transactionType === 'TRANSFER';

  /* Opções dos selects */
  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts]
  );

  const destinationOptions = useMemo(
    () => accountOptions.filter((o) => o.value !== accountId),
    [accountOptions, accountId]
  );

  const categoryOptions = useMemo(() => {
    const items = filterCategoriesByType(categories, transactionType).map((c) => ({
      value: String(c.id),
      label: c.name,
    }));
    // Edição: garante que a categoria atual apareça mesmo se não passar no filtro
    if (categoryId && !items.some((i) => i.value === categoryId)) {
      const extra = categories.find((c) => String(c.id) === categoryId);
      if (extra) items.push({ value: String(extra.id), label: extra.name });
    }
    return [{ value: '', label: 'Sem categoria' }, ...items];
  }, [categories, transactionType, categoryId]);

  /* Animação de entrada/saída */
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

  /* Fechar com ESC */
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  /* Preenche (edição) ou limpa (criação) a cada abertura */
  useEffect(() => {
    if (!open) return;
    setApiError('');

    if (transaction) {
      reset({
        transactionType: transaction.transactionType,
        amount: formatMoney((transaction.amountInCents || 0) / 100),
        accountId: transaction.accountId,
        destinationAccountId: transaction.destinationAccountId ?? '',
        categoryId:
          transaction.categoryId != null ? String(transaction.categoryId) : '',
        transactionDate: localDateTimeToDateInput(transaction.transactionDate),
        description: transaction.description ?? '',
        isRecurring: !!transaction.isRecurring,
        recurrencyType: transaction.recurrencyType || 'MONTHLY',
      });
    } else {
      reset(emptyValues('DEBIT', accounts));
    }
    // accounts fica fora das dependências de propósito: recarregar as contas
    // não deve apagar o que o usuário está digitando
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction, open, reset]);

  function handleTabChange(type) {
    if (type === transactionType) return;
    setValue('transactionType', type);
    setValue('categoryId', '');
    setValue('destinationAccountId', '');
    clearErrors();
  }

  /* Monta o LocalDateTime enviado ao back-end */
  function buildDateTime(dateInput) {
    // Edição sem trocar o dia: preserva a hora original
    const original = transaction?.transactionDate;
    if (original && localDateTimeToDateInput(original) === dateInput) {
      return original.slice(0, 19);
    }
    // Lançamento de hoje: usa a hora atual (mantém a ordem dentro do dia)
    if (dateInput === todayInput()) return toLocalDateTime(new Date());
    return dateInputToLocalDateTime(dateInput);
  }

  async function onSubmit(data) {
    setApiError('');
    try {
      const transfer = data.transactionType === 'TRANSFER';
      const transferCategory = categories.find((c) => c.icon === 'transfer' && c.isDefault);
      const recurring = !transfer && data.isRecurring;

      const payload = {
        transactionType: data.transactionType,
        accountId: data.accountId,
        destinationAccountId: transfer ? data.destinationAccountId : null,
        categoryId: transfer
          ? transferCategory?.id ?? null
          : data.categoryId
            ? Number(data.categoryId)
            : null,
        amountInCents: toCents(data.amount),
        description: data.description?.trim() || null,
        transactionDate: buildDateTime(data.transactionDate),
        isRecurring: recurring,
        recurrencyType: recurring ? data.recurrencyType : null,
      };

      const saved = isEdit
        ? await updateTransaction(transaction.id, payload)
        : await createTransaction(payload);

      onSuccess(saved, isEdit);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erro ao salvar transação.');
    }
  }

  if (!mounted) return null;

  const noAccounts = accounts.length === 0;
  const amountError = errors.amount?.message;

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Editar transação' : 'Nova transação'}
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

        {/* Abas */}
        <div className="relative grid grid-cols-3 p-1 bg-gray-100 rounded-lg mb-3">
          <div
            className="absolute top-1 bottom-1 left-1 rounded-md bg-white shadow transition-transform duration-200 ease-out"
            style={{
              width: 'calc((100% - 8px) / 3)',
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
          {TABS.map((tab) => {
            const active = tab.value === transactionType;
            const locked = isEdit && !active; // na edição o tipo não muda
            return (
              <button
                key={tab.value}
                type="button"
                disabled={locked}
                aria-pressed={active}
                onClick={() => handleTabChange(tab.value)}
                className={`relative z-10 py-1.5 text-sm font-semibold rounded-md transition-colors
                            ${active ? tab.text : 'text-gray-400'}
                            ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:cursor-pointer hover:text-gray-600'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {noAccounts && (
          <p className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Você ainda não tem contas. Crie uma conta antes de registrar transações.
          </p>
        )}

        {/* [&_label]:text-gray-700 sobrescreve a label branca do InputField */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 [&_label]:text-gray-700"
        >
          {/* Campos que guardam os valores dos seletores customizados */}
          <input type="hidden" {...register('transactionType')} />
          <input type="hidden" {...register('accountId')} />
          <input type="hidden" {...register('destinationAccountId')} />
          <input type="hidden" {...register('categoryId')} />
          <input type="hidden" {...register('recurrencyType')} />

          {/* Valor + data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Seleciona o conteúdo ao focar para a digitação substituir o 0,00 */}
            <div
              onFocus={(e) => {
                const el = e.target;
                setTimeout(() => el.select(), 0);
              }}
            >
              <InputField
                className={activeTab.text}
                label="Valor (R$)"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                register={register('amount', {
                  onChange: (e) => setValue('amount', sanitizeMoney(e.target.value)),
                  onBlur: (e) =>
                    setValue('amount', formatMoney(parseMoney(e.target.value) || 0)),
                })}
                error={amountError}
              />
            </div>

            <InputField
              className="text-black"
              label="Data"
              type="date"
              register={register('transactionDate')}
              error={errors.transactionDate?.message}
            />
          </div>

          {/* Conta de origem (ou conta, em receita/despesa) */}
          <SelectField
            label={isTransfer ? 'Conta de origem' : 'Conta'}
            options={accountOptions}
            value={accountId}
            placeholder="Selecione a conta"
            onChange={(v) => {
              setValue('accountId', v, { shouldValidate: true });
              // se o destino ficou igual à nova origem, limpa o destino
              if (v === destinationAccountId) setValue('destinationAccountId', '');
            }}
            error={errors.accountId?.message}
          />

          {/* Transferência: destino | Receita/Despesa: categoria */}
          {isTransfer ? (
            <SelectField
              label="Conta de destino"
              options={destinationOptions}
              value={destinationAccountId}
              placeholder="Selecione a conta de destino"
              onChange={(v) =>
                setValue('destinationAccountId', v, { shouldValidate: true })
              }
              error={errors.destinationAccountId?.message}
            />
          ) : (
            <SelectField
              label="Categoria"
              options={categoryOptions}
              value={categoryId}
              placeholder="Sem categoria"
              onChange={(v) => setValue('categoryId', v)}
            />
          )}

          {/* Descrição */}
          <InputField
            className="text-black"
            label="Descrição (opcional)"
            placeholder={isTransfer ? 'Ex: Reserva do mês' : 'Ex: Mercado, Salário...'}
            register={register('description')}
            error={errors.description?.message}
          />

          {/* Recorrência (somente receita e despesa) */}
          {!isTransfer && (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:cursor-pointer w-fit">
                <input
                  type="checkbox"
                  {...register('isRecurring')}
                  className="w-4 h-4 accent-primary-500 hover:cursor-pointer"
                />
                Transação recorrente
              </label>

              {isRecurring && (
                <SelectField
                  label="Frequência"
                  options={RECURRENCE_OPTIONS}
                  value={recurrencyType}
                  onChange={(v) =>
                    setValue('recurrencyType', v, { shouldValidate: true })
                  }
                  error={errors.recurrencyType?.message}
                />
              )}
            </div>
          )}

          {apiError && (
            <p className="text-red-500 text-sm text-center">{apiError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || noAccounts}
            className={`w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50
                        transition-colors hover:cursor-pointer disabled:cursor-not-allowed ${activeTab.btn}`}
          >
            {isSubmitting
              ? 'Salvando...'
              : isEdit
                ? 'Salvar alterações'
                : activeTab.submit}
          </button>
        </form>
      </div>
    </div>
  );
}