export var hpToKw = function (hp) {
    return parseFloat((hp * 0.7457).toFixed(1));
};
export var nmToLbFt = function (nm) {
    return parseFloat((nm * 0.73756).toFixed(1));
};
/**
 * Power: Calculate Horsepower from Torque (Nm) and RPM
 * Formula: (Torque_Nm * RPM) / 7121
 * (Derived from: (Torque_lbft * RPM) / 5252)
 */
export var calculateHpFromNm = function (nm, rpm) {
    if (nm <= 0 || rpm <= 0)
        return 0;
    // 7121 is the constant for Nm to HP conversion
    return parseFloat(((nm * rpm) / 7121.23).toFixed(1));
};
/**
 * Torque: Calculate Torque (Nm) from Horsepower and RPM
 * Formula: (HP * 7121) / RPM
 */
export var calculateNmFromHp = function (hp, rpm) {
    if (hp <= 0 || rpm <= 0)
        return 0;
    return parseFloat(((hp * 7121.23) / rpm).toFixed(1));
};
