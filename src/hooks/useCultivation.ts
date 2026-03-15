import { useGameStore } from '../store/gameStore';

export const useCultivation = () => {
  const { tuVi, tuViMax, root, absorbQi, levelUp } = useGameStore();

  const getAbsorptionRate = () => {
    // Logic tính tốc độ hấp thụ dựa trên linh căn
    let rate = 10;
    if (root.includes('Ngũ Hành')) rate = 5;
    else if (root.includes('Thiên Linh Căn')) rate = 20;
    return rate;
  };

  const cultivate = () => {
    const rate = getAbsorptionRate();
    absorbQi(rate);
    
    if (tuVi + rate >= tuViMax) {
      levelUp();
      return true; // Thăng cấp
    }
    return false;
  };

  return { cultivate, getAbsorptionRate };
};
