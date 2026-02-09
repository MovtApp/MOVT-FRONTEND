import { z } from "zod";

export const postFormSchema = z.object({
    id_post: z.string().optional(),
    legenda: z.string().min(1, "Legenda é obrigatória").max(500, "Legenda muito longa"),
    imageurl: z.string().min(1, "Imagem é obrigatória"),
});

export type PostFormInputs = z.infer<typeof postFormSchema>;
