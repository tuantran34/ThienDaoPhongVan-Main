import { useMutation } from '@tanstack/react-query';
import { aiService } from '../services/aiService';
import { StoryContext } from '../types';
import { useGameStore } from '../store/gameStore';

export const useStoryEngine = () => {
  const updateStoryState = useGameStore((state) => state.updateStoryState);

  return useMutation({
    mutationFn: (context: StoryContext) => aiService.generateStoryStep(context),
    retry: 3, // Retry 3 times
    onSuccess: (data) => {
      updateStoryState(data);
    },
  });
};
