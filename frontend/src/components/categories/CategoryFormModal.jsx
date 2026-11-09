import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCategory, updateCategory } from '../../services/categoryService';
import { InputField } from '../ui/InputField';
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
    text: 'text-primary-600',
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
      .max(50, 'Máximo de 50 caracteres'),
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

  const nameValue = watch('name');
  const selectedType = watch('type');
  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const activeType = TYPES.find((t) => t.value === selectedType) || TYPES[0];
  const activeIndex = TYPES.findIndex((t) => t.value === selectedType);

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

      onSuccess(saved, isEdit);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erro ao salvar categoria.');
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
            {isEdit ? 'Editar categoria' : 'Nova categoria'}
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
          {/* Campos que guardam os valores dos seletores customizados */}
          <input type="hidden" {...register('type')} />
          <input type="hidden" {...register('color')} />
          <input type="hidden" {...register('icon')} />

          {/* Prévia */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: colorMap[selectedColor] || colorMap.gray }}
            >
              {categoryIconMap[selectedIcon] || categoryIconMap.other}
            </div>
            <p className="font-semibold text-gray-800 truncate">
              {nameValue?.trim() || 'Nome da categoria'}
            </p>
          </div>

          {/* Tipo (Despesa | Receita) */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>

            <div className="relative grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
              <div
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
                                ${active ? t.text : 'text-gray-400'}
                                ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:cursor-pointer hover:text-gray-600'}`}
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
            placeholder="Ex: Academia, Freelas..."
            register={register('name')}
            error={errors.name?.message}
          />

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

          {/* Seletor de ícone: só os ícones do tipo escolhido */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Ícone</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS_BY_TYPE[selectedType].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setValue('icon', key, { shouldValidate: true })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all hover:cursor-pointer
                    ${selectedIcon === key
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}
                >
                  {categoryIconMap[key]}
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
            {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar categoria'}
          </button>
        </form>
      </div>
    </div>
  );
}