export const formatIndianCompact = (value, decimals = 1) => {
  const num = Number(value) || 0;
  const abs = Math.abs(num);

  const trim = (v) => {
    const fixed = Number(v).toFixed(decimals);
    return fixed.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
  };

  if (abs >= 10000000) {
    return `${trim(num / 10000000)} crore`;
  }
  if (abs >= 100000) {
    return `${trim(num / 100000)} lakh`;
  }
  if (abs >= 1000) {
    return `${trim(num / 1000)} thousand`;
  }

  return trim(num);
};

export const formatINRCompact = (value, decimals = 1) => `₹ ${formatIndianCompact(value, decimals)}`;