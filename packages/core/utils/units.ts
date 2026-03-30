export const hpToKw = (hp: number): number =>
  parseFloat((hp * 0.7457).toFixed(1));

export const nmToLbFt = (nm: number): number =>
  parseFloat((nm * 0.73756).toFixed(1));

/**
 * Power: Calculate Horsepower from Torque (Nm) and RPM
 * Formula: (Torque_Nm * RPM) / 7121
 * (Derived from: (Torque_lbft * RPM) / 5252)
 */
export const calculateHpFromNm = (nm: number, rpm: number): number => {
  if (nm <= 0 || rpm <= 0) return 0;
  // 7121 is the constant for Nm to HP conversion
  return parseFloat(((nm * rpm) / 7121.23).toFixed(1));
};

/**
 * Torque: Calculate Torque (Nm) from Horsepower and RPM
 * Formula: (HP * 7121) / RPM
 */
export const calculateNmFromHp = (hp: number, rpm: number): number => {
  if (hp <= 0 || rpm <= 0) return 0;
  return parseFloat(((hp * 7121.23) / rpm).toFixed(1));
};
