import { z } from 'zod';

export const dietFormSchema = z.object({
  id_dieta: z.string().optional(),
  nome: z.string().min(1, 'Nome da dieta é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  imageurl: z.string().min(1, 'Imagem é obrigatória'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  calorias: z.coerce.number().min(0, 'Calorias devem ser um número positivo').optional(),
  tempo_preparo: z.coerce.number().int().min(0, 'Tempo de preparo deve ser um número inteiro positivo').optional(),
  gordura: z.coerce.number().min(0, 'Gordura deve ser um número positivo').optional(),
  proteina: z.coerce.number().min(0, 'Proteína deve ser um número positivo').optional(),
  carboidratos: z.coerce.number().min(0, 'Carboidratos devem ser um número positivo').optional(),
  nome_autor: z.string().optional().or(z.literal('')),
  avatar_autor_url: z.string().optional().or(z.literal('')),
});

export type DietFormInputs = z.infer<typeof dietFormSchema>;