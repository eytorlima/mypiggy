import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCategory, updateCategory } from '../../services/categoryService';
import { InputField } from '../ui/InputField';
import { ModalShell } from '../ui/ModalShell';
import { useModalTransition } from '../../hooks/useModalTransition';
import { useToast } from '../../contexts/ToastContext';
import { colorMap } from '../../utils/accountUtils';
import { categoryIconMap, EXPENSE_ICONS, INCOME_ICONS } from '../../utils/categoryUtils';
import CloseOutlined from '@mui/icons-material/CloseOutlined';

/* ---------- Configuração ---------- */

const TYPES = [
  {
    value: 'EXPENSE',
    label: 'Despesa',
    text: 'text-red-600',
    hint: 'Aparece apenas ao registrar despesas.',
  },
  {
    value: 'INCOME',
    label: 'Receita',
    text: 'text-primary-700',
    hint: 'Aparece apenas ao registrar receitas.',
  },
];

// O tipo NÃO é salvo no back-end: ele só decide quais ícones ficam disponíveis.
// Quem define onde a categoria aparece é o ícone (ver filterCategoriesByType).
// 'other' e 'transfer' ficam de fora de propósito: 'other' apareceria nos dois
// tipos e 'transfer' é reservado para a categoria de sistema.
const ICONS_BY_TYPE = { EXPENSE: EXPENSE_ICONS, INCOME: INCOME_ICONS };
const COLOR_KEYS = Object.keys(colorMap);

function typeOfIcon(icon) {
  return INCOME_ICONS.includes(icon) ? 'INCOME' : 'EXPENSE';
}

/* ---------- Schema ---------- */

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Nome é obrigatório')
      .max(18, 'Máximo de 18 letras')
      .regex(/^\p{L}+$/u, 'Use apenas letras, sem espaços, números ou símbolos'),
    type: z.enum(['EXPENSE', 'INCOME']),
    color: z.string().refine((v) => COLOR_KEYS.includes(v), 'Escolha uma cor'),
    icon: z.string().min(1, 'Escolha um ícone'),
  })
  // O ícone precisa pertencer ao tipo escolhido
  .refine((d) => ICONS_BY_TYPE[d.type].includes(d.icon), {
    message: 'Escolha um ícone',
    path: ['icon'],
  });

const EMPTY_VALUES = {
  name: '',
  type: 'EXPENSE',
  color: 'green',
  icon: EXPENSE_ICONS[0],
};

/* ---------- Modal ---------- */

export function CategoryFormModal({ open, category, onClose, onSuccess }) {
  const isEdit = !!category;
  const [apiError, setApiError] = useState('');
  const titleId = useId();
  const toast = useToast();

  // mounted: está no DOM | visible: está na posição final (dispara a transição)
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

  const nameValue = watch('name');
  const selectedType = watch('type');
  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const activeType = TYPES.find((t) => t.value === selectedType) || TYPES[0];
  const activeIndex = TYPES.findIndex((t) => t.value === selectedType);

  /* Preenche (edição) ou limpa (criação) a cada abertura */
  useEffect(() => {
    if (!open) return;
    setApiError('');

    if (category) {
      // O tipo é deduzido do ícone salvo
      const type = typeOfIcon(category.icon);
      reset({
        name: category.name,
        type,
        color: COLOR_KEYS.includes(category.color) ? category.color : 'green',
        icon: ICONS_BY_TYPE[type].includes(category.icon)
          ? category.icon
          : ICONS_BY_TYPE[type][0],
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [category, open, reset]);

  function handleTypeChange(type) {
    if (type === selectedType) return;
    setValue('type', type);
    // O ícone atual não existe no outro tipo: seleciona o primeiro disponível
    setValue('icon', ICONS_BY_TYPE[type][0], { shouldValidate: true });
  }

  async function onSubmit(data) {
    setApiError('');
    try {
      // `type` não é enviado: o back-end só conhece nome, cor e ícone
      const payload = {
        name: data.name.trim(),
        color: data.color,
        icon: data.icon,
      };

      const saved = isEdit
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);

      toast.success(isEdit ? 'Categoria atualizada.' : 'Categoria criada com sucesso!');
      onSuccess(saved, isEdit);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erro ao salvar categoria.');
    }
  }

  if (!mounted) return null;

  return (
    <ModalShell visible={visible} onClose={onClose} titleId={titleId}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 id={titleId} className="text-lg font-bold text-gray-800">
          {isEdit ? 'Editar categoria' : 'Nova categoria'}
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
        {/* Campos que guardam os valores dos seletores customizados */}
        <input type="hidden" {...register('type')} />
        <input type="hidden" {...register('color')} />
        <input type="hidden" {...register('icon')} />

        {/* Prévia */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          <div
            aria-hidden="true"
            className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: colorMap[selectedColor] || colorMap.gray }}
          >
            {categoryIconMap[selectedIcon] || categoryIconMap.other}
          </div>
          <p className="min-w-0 font-semibold text-gray-800 truncate">
            {nameValue?.trim() || 'Nome da categoria'}
          </p>
        </div>

        {/* Tipo (Despesa | Receita) */}
        <div className="flex flex-col gap-1" role="group" aria-label="Tipo da categoria">
          <span className="text-sm font-medium text-gray-700">Tipo</span>

          <div className="relative grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
            <div
              aria-hidden="true"
              className="absolute top-1 bottom-1 left-1 rounded-md bg-white shadow transition-transform duration-200 ease-out"
              style={{
                width: 'calc((100% - 8px) / 2)',
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
            {TYPES.map((t) => {
              const active = t.value === selectedType;
              const locked = isEdit && !active; // na edição o tipo não muda
              return (
                <button
                  key={t.value}
                  type="button"
                  disabled={locked}
                  aria-pressed={active}
                  onClick={() => handleTypeChange(t.value)}
                  className={`relative z-10 py-1.5 text-sm font-semibold rounded-md transition-colors
                              ${active ? t.text : 'text-gray-500'}
                              ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:cursor-pointer hover:text-gray-700'}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-500">
            {activeType.hint}
            {isEdit && ' O tipo não pode ser alterado depois de criada.'}
          </p>
        </div>

        {/* Nome */}
        <InputField
          className="text-black"
          label="Nome"
          placeholder="Ex: Academia, Freelas"
          maxLength={18}
          register={register('name')}
          error={errors.name?.message}
        />

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

        {/* Seletor de ícone: só os ícones do tipo escolhido */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Ícone</span>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Ícone">
            {ICONS_BY_TYPE[selectedType].map((key) => (
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
                {categoryIconMap[key]}
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
          {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar categoria'}
        </button>
      </form>
    </ModalShell>
  );
}