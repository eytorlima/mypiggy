import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createPiggyBank, updatePiggyBank } from '../../services/PiggyBankService';
import { InputField } from '../ui/InputField';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import { colorMap } from '../../utils/accountUtils';
import { formatMoney, parseMoney, sanitizeMoney } from '../../utils/moneyUtils';
import {
  DEFAULT_EMERGENCY_ICON,
  DEFAULT_PIGGY_ICON,
  getPiggyIcon,
  moneyTextToCents,
  piggyIconMap,
  todayInput,
} from '../../utils/piggyBankUtils';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';

const COLOR_KEYS = Object.keys(colorMap);
const ICON_KEYS = Object.keys(piggyIconMap);

/* ---------- Taxa de rendimento ("10,5" -> 10.5) ---------- */

function parseRate(text) {
  const clean = (text ?? '').trim();
  return clean === '' ? null : Number(clean.replace(',', '.'));
}

// Só dígitos e uma vírgula
function sanitizeRate(text) {
  const [integer, ...rest] = text.replace(/[^\d,]/g, '').split(',');
  return rest.length ? `${integer},${rest.join('')}` : integer;
}

/* ---------- Schema ---------- */

// originalDate: prazo atual do porquinho em edição. Ele continua válido mesmo vencido,
// para dar para editar outros campos de uma meta antiga (o backend segue a mesma regra)
function buildSchema(originalDate) {
  return z
    .object({
      name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Máximo de 100 caracteres'),
      description: z.string().max(255, 'Máximo de 255 caracteres'),
      hasGoal: z.boolean(),
      goal: z.string(),
      targetDate: z.string(),
      annualRate: z.string(),
      color: z.string().refine((v) => COLOR_KEYS.includes(v), 'Escolha uma cor'),
      icon: z.string().refine((v) => ICON_KEYS.includes(v), 'Escolha um ícone'),
    })
    .superRefine((data, ctx) => {
      if (data.hasGoal) {
        const goal = parseMoney(data.goal);
        if (Number.isNaN(goal) || goal <= 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['goal'],
            message: 'Informe o valor da meta (maior que zero)',
          });
        }
        if (data.targetDate && data.targetDate < todayInput() && data.targetDate !== originalDate) {
          ctx.addIssue({
            code: 'custom',
            path: ['targetDate'],
            message: 'O prazo deve ser hoje ou uma data futura',
          });
        }
      }

      const rate = parseRate(data.annualRate);
      if (rate !== null && (Number.isNaN(rate) || rate < 0 || rate > 999.9999)) {
        ctx.addIssue({
          code: 'custom',
          path: ['annualRate'],
          message: 'Taxa inválida (de 0 a 999,9999)',
        });
      }
    });
}

const EMPTY_VALUES = {
  name: '',
  description: '',
  hasGoal: false,
  goal: '0,00',
  targetDate: '',
  annualRate: '',
  color: 'green',
  icon: DEFAULT_PIGGY_ICON,
};

/* ---------- Seletor "Porquinho livre / Meta" ---------- */

function GoalToggle({ hasGoal, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Tipo</label>

      <div className="relative grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
        <div
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-md bg-white shadow
                      transition-transform duration-200 ease-out
                      ${hasGoal ? 'translate-x-full' : 'translate-x-0'}`}
        />
        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={!hasGoal}
          className={`relative z-10 py-2 text-sm font-semibold rounded-md transition-colors hover:cursor-pointer
                      ${!hasGoal ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Porquinho livre
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={hasGoal}
          className={`relative z-10 py-2 text-sm font-semibold rounded-md transition-colors hover:cursor-pointer
                      ${hasGoal ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Meta
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {hasGoal
          ? 'Tem um valor-alvo e mostra a barra de progresso.'
          : 'Guarde sem valor-alvo, como uma caixinha.'}
      </p>
    </div>
  );
}

/* ---------- Modal ---------- */

export function PiggyBankFormModal({ open, piggy, onClose, onSuccess }) {
  const isEdit = !!piggy;
  const isEmergency = !!piggy?.isEmergency;
  const [apiError, setApiError] = useState('');
  const { mounted, visible } = useModalTransition(open, onClose);

  // O resolver lê o prazo original por ref: o schema acompanha o porquinho aberto
  const originalDateRef = useRef('');
  const resolver = (values, context, options) =>
    zodResolver(buildSchema(originalDateRef.current))(values, context, options);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver, defaultValues: EMPTY_VALUES });

  const nameValue = watch('name');
  const hasGoal = watch('hasGoal');
  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  // Preenche (edição) ou limpa (criação) a cada abertura
  useEffect(() => {
    if (!open) return;
    setApiError('');
    originalDateRef.current = piggy?.targetDate ?? '';

    if (piggy) {
      reset({
        name: piggy.name,
        description: piggy.description ?? '',
        hasGoal: piggy.goalInCents != null,
        goal: formatMoney((piggy.goalInCents ?? 0) / 100),
        targetDate: piggy.targetDate ?? '',
        annualRate: piggy.annualRate != null ? String(Number(piggy.annualRate)).replace('.', ',') : '',
        color: COLOR_KEYS.includes(piggy.color) ? piggy.color : 'green',
        icon: ICON_KEYS.includes(piggy.icon)
          ? piggy.icon
          : piggy.isEmergency ? DEFAULT_EMERGENCY_ICON : DEFAULT_PIGGY_ICON,
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [piggy, open, reset]);

  async function onSubmit(data) {
    setApiError('');
    try {
      const payload = {
        // O nome da reserva de emergência é fixo: sempre o original
        name: isEmergency ? piggy.name : data.name.trim(),
        description: data.description.trim() || null,
        icon: data.icon,
        color: data.color,
        goalInCents: data.hasGoal ? moneyTextToCents(data.goal) : null,
        // Prazo só existe junto com a meta
        targetDate: data.hasGoal && data.targetDate ? data.targetDate : null,
        annualRate: parseRate(data.annualRate),
      };

      const saved = isEdit
        ? await updatePiggyBank(piggy.id, payload)
        : await createPiggyBank(payload);

      onSuccess(saved, isEdit);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erro ao salvar porquinho.');
    }
  }

  if (!mounted) return null;

  return (
    <ModalShell visible={visible} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">
          {isEdit ? 'Editar porquinho' : 'Novo porquinho'}
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

      {/* [&_label]:text-gray-700 sobrescreve a label branca do InputField */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 [&_label]:text-gray-700"
      >
        <input type="hidden" {...register('color')} />
        <input type="hidden" {...register('icon')} />

        {/* Prévia */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: colorMap[selectedColor] || colorMap.green }}
          >
            {getPiggyIcon(selectedIcon)}
          </div>
          <p className="font-semibold text-gray-800 truncate">
            {(isEmergency ? piggy.name : nameValue?.trim()) || 'Nome do porquinho'}
          </p>
        </div>

        {/* Nome (fixo na reserva de emergência) */}
        {isEmergency ? (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <div className="flex items-center gap-2 h-[40px] px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500">
              <LockOutlined style={{ fontSize: 16 }} />
              {piggy.name}
            </div>
            <p className="text-xs text-gray-500">
              O nome da reserva de emergência não pode ser alterado.
            </p>
          </div>
        ) : (
          <InputField
            label="Nome"
            placeholder="Ex: Viagem, Notebook novo..."
            register={register('name')}
            error={errors.name?.message}
          />
        )}

        <InputField
          label="Descrição (opcional)"
          placeholder="Para que é este dinheiro?"
          register={register('description')}
          error={errors.description?.message}
        />

        {/* Porquinho livre ou meta */}
        <GoalToggle
          hasGoal={hasGoal}
          onChange={(v) => setValue('hasGoal', v, { shouldDirty: true, shouldValidate: true })}
        />

        {hasGoal && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Seleciona o conteúdo ao focar para a digitação substituir o 0,00 */}
            <div
              onFocus={(e) => {
                const el = e.target;
                setTimeout(() => el.select(), 0);
              }}
            >
              <InputField
                label="Valor da meta (R$)"
                type="text"
                placeholder="0,00"
                register={register('goal', {
                  onChange: (e) => setValue('goal', sanitizeMoney(e.target.value)),
                  onBlur: (e) =>
                    setValue('goal', formatMoney(parseMoney(e.target.value) || 0)),
                })}
                error={errors.goal?.message}
              />
            </div>

            <InputField
              label="Prazo (opcional)"
              type="date"
              register={register('targetDate')}
              error={errors.targetDate?.message}
            />
          </div>
        )}

        {/* Rendimento */}
        <div className="flex flex-col gap-1">
          <InputField
            label="Rendimento anual (% a.a., opcional)"
            type="text"
            placeholder="Ex: 10,5"
            register={register('annualRate', {
              onChange: (e) => setValue('annualRate', sanitizeRate(e.target.value)),
            })}
            error={errors.annualRate?.message}
          />
          <p className="text-xs text-gray-500">
            Usado para estimar quanto o dinheiro rende (juros compostos). Deixe em branco se não rende.
          </p>
        </div>

        {/* Seletor de cor */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Cor</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(colorMap).map(([key, hex]) => (
              <button
                key={key}
                type="button"
                aria-label={key}
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
            {Object.entries(piggyIconMap).map(([key, icon]) => (
              <button
                key={key}
                type="button"
                aria-label={key}
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
          {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar porquinho'}
        </button>
      </form>
    </ModalShell>
  );
}