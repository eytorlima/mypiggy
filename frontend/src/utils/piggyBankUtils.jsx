import SavingsOutlined from '@mui/icons-material/SavingsOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import FlightTakeoffOutlined from '@mui/icons-material/FlightTakeoffOutlined';
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import CardGiftcardOutlined from '@mui/icons-material/CardGiftcardOutlined';
import PhoneIphoneOutlined from '@mui/icons-material/PhoneIphoneOutlined';
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import PetsOutlined from '@mui/icons-material/PetsOutlined';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import { colorMap } from './accountUtils';
import { parseMoney } from './moneyUtils';

/* ---------- Ícones e cores ---------- */

export const piggyIconMap = {
  piggy:      <SavingsOutlined />,
  shield:     <ShieldOutlined />,
  travel:     <FlightTakeoffOutlined />,
  car:        <DirectionsCarOutlined />,
  home:       <HomeOutlined />,
  study:      <SchoolOutlined />,
  gift:       <CardGiftcardOutlined />,
  phone:      <PhoneIphoneOutlined />,
  health:     <FavoriteBorderOutlined />,
  party:      <CelebrationOutlined />,
  pet:        <PetsOutlined />,
  trophy:     <EmojiEventsOutlined />,
  investment: <TrendingUpOutlined />,
};

export const DEFAULT_PIGGY_ICON = 'piggy';
export const DEFAULT_EMERGENCY_ICON = 'shield';

// Cor de destaque quando a meta é atingida
export const GOLD = '#f59e0b';

export function getPiggyIcon(key) {
  return piggyIconMap[key] || piggyIconMap[DEFAULT_PIGGY_ICON];
}

export function colorOf(piggy) {
  return colorMap[piggy?.color] || colorMap.green;
}

/* ---------- Datas ("YYYY-MM-DD", sem passar por UTC) ---------- */

const pad = (n) => String(n).padStart(2, '0');

export function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// "2026-11-12" -> "12/11/2026"
export function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Dias de hoje até a data (negativo = já passou)
export function daysUntil(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

/* ---------- Valores ---------- */

// "1.234,56" -> 123456 (centavos)
export function moneyTextToCents(text) {
  return Math.round(parseMoney(text) * 100);
}

// 10.5 -> "10,5%"
export function formatRate(rate) {
  return `${Number(rate).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`;
}