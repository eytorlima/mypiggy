import RestaurantOutlined from '@mui/icons-material/RestaurantOutlined';
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import SentimentSatisfiedAltOutlined from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import RepeatOutlined from '@mui/icons-material/RepeatOutlined';
import PetsOutlined from '@mui/icons-material/PetsOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import WorkOutlineOutlined from '@mui/icons-material/WorkOutlineOutlined';
import LaptopMacOutlined from '@mui/icons-material/LaptopMacOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import CardGiftcardOutlined from '@mui/icons-material/CardGiftcardOutlined';
import SwapHorizOutlined from '@mui/icons-material/SwapHorizOutlined';
import MoreHorizOutlined from '@mui/icons-material/MoreHorizOutlined';

// Chave do ícone (campo `icon` da categoria no back-end) -> elemento MUI
export const categoryIconMap = {
  utensils:  <RestaurantOutlined />,
  car:       <DirectionsCarOutlined />,
  home:      <HomeOutlined />,
  heart:     <FavoriteBorderOutlined />,
  school:    <SchoolOutlined />,
  smile:     <SentimentSatisfiedAltOutlined />,
  shirt:     <CheckroomOutlined />,
  repeat:    <RepeatOutlined />,
  pet:       <PetsOutlined />,
  tax:       <ReceiptLongOutlined />,
  briefcase: <WorkOutlineOutlined />,
  laptop:    <LaptopMacOutlined />,
  trending:  <TrendingUpOutlined />,
  gift:      <CardGiftcardOutlined />,
  transfer:  <SwapHorizOutlined />,
  other:     <MoreHorizOutlined />,
};

// O back-end ainda não tem campo "tipo" na categoria.
// Solução temporária: separamos pelo ícone.
// TODO: quando a categoria tiver um campo de tipo, remover isto e filtrar por ele.
const INCOME_ICONS = ['briefcase', 'laptop', 'trending', 'gift'];

/**
 * Categorias válidas para o tipo de transação.
 * type: 'CREDIT' | 'DEBIT' | 'TRANSFER'
 *  - CREDIT:   categorias de receita + 'other'
 *  - DEBIT:    categorias de despesa + 'other' (sem receitas e sem 'transfer')
 *  - TRANSFER: somente a categoria 'transfer'
 */
export function filterCategoriesByType(categories, type) {
  return (categories || []).filter((c) => {
    const isIncome = INCOME_ICONS.includes(c.icon);
    const isTransfer = c.icon === 'transfer';

    if (type === 'CREDIT') return isIncome || c.icon === 'other';
    if (type === 'DEBIT') return !isIncome && !isTransfer;
    if (type === 'TRANSFER') return isTransfer;
    return true;
  });
}