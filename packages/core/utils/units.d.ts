export declare const hpToKw: (hp: number) => number;
export declare const nmToLbFt: (nm: number) => number;
/**
 * Power: Calculate Horsepower from Torque (Nm) and RPM
 * Formula: (Torque_Nm * RPM) / 7121
 * (Derived from: (Torque_lbft * RPM) / 5252)
 */
export declare const calculateHpFromNm: (nm: number, rpm: number) => number;
/**
 * Torque: Calculate Torque (Nm) from Horsepower and RPM
 * Formula: (HP * 7121) / RPM
 */
export declare const calculateNmFromHp: (hp: number, rpm: number) => number;
//# sourceMappingURL=units.d.ts.map