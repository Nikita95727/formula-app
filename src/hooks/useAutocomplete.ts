import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Operand } from '../utils/types';
import { removeSpaces } from '../utils';

export const useAutocomplete = (search: string) =>
  useQuery({
    queryKey: ['autocomplete', search],
    queryFn: async () => {
      const { data } = await axios.get<Operand[]>(
        'https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete'
      );
      return data.filter((item) =>
        removeSpaces(item.name).toLowerCase().includes(removeSpaces(search.toLowerCase()))
      );
    },
    enabled: !!search,
  });