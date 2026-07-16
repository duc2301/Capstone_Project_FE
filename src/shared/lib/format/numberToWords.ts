const defaultNumbers = 'không một hai ba bốn năm sáu bảy tám chín';
const chuSo = defaultNumbers.split(' ');
const tien = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];

function docBlock(so: string, dayDu: boolean) {
  let chuoi = '';
  const tram = Math.floor(parseInt(so) / 100);
  so = (parseInt(so) % 100).toString().padStart(2, '0');
  const chuc = Math.floor(parseInt(so) / 10);
  const donVi = parseInt(so) % 10;

  if (dayDu || tram > 0) {
    chuoi += ' ' + chuSo[tram] + ' trăm';
    chuoi += ' ' + (chuc === 0 ? (donVi === 0 ? '' : 'lẻ') : chuSo[chuc] + ' mươi');
  } else {
    if (chuc > 0) chuoi += ' ' + chuSo[chuc] + ' mươi';
  }

  if (chuc !== 1 && chuc !== 0 && donVi === 1) chuoi += ' mốt';
  else if (chuc !== 0 && donVi === 5) chuoi += ' lăm';
  else if (chuc !== 0 && chuc !== 1 && donVi === 4) chuoi += ' tư';
  else if (donVi !== 0) chuoi += ' ' + chuSo[donVi];

  return chuoi.replace('một mươi', 'mười').replace('mười không', 'mười').replace('mươi không', 'mươi');
}

export function numberToWordsVN(number: number | string | null | undefined): string {
  if (number === null || number === undefined || number === '') return '';
  const num = Number(number);
  if (isNaN(num)) return '';
  if (num === 0) return 'Không đồng';

  let so = Math.abs(num).toString();
  let chuoi = '';
  let hauto = 0;

  while (so.length > 0) {
    const start = Math.max(so.length - 3, 0);
    const end = so.length;
    const block = so.slice(start, end);
    so = so.slice(0, start);

    if (parseInt(block) > 0) {
      const blockStr = docBlock(block, so.length > 0);
      chuoi = blockStr + tien[hauto] + chuoi;
    }
    hauto++;
  }

  chuoi = chuoi.trim().replace(/\s+/g, ' ');
  return chuoi.charAt(0).toUpperCase() + chuoi.slice(1) + (num < 0 ? ' (Âm)' : '') + ' đồng';
}
