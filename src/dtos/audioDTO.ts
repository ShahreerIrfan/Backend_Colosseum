import { z } from 'zod';
import { MessageConstants } from '@constants/allConstant.js';
import { BaseQuerySchema } from './commonItemDTO.js';

const Message = MessageConstants.validation.audio;

export const AudioSchema = z.object({
  id: z.string().optional(),
  viewpointId: z.string().min(1, 'Viewpoint ID is required'),
  language: z.string().min(2, Message.languageRequired),
  audioUrl: z.string().min(1, Message.audioUrlRequired),
  duration: z.string().default('3 min'),
  transcript: z.string().optional().default(''),
  fileSize: z.number().optional().default(0),
  isPublished: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CreateAudioSchema = AudioSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateAudioSchema = CreateAudioSchema.partial();

export const QueryAudioSchema = BaseQuerySchema.extend({
  viewpointId: z.string().optional(),
  language: z.string().optional(),
});

export type Audio = z.infer<typeof AudioSchema>;
export type CreateAudio = z.infer<typeof CreateAudioSchema>;
export type UpdateAudio = z.infer<typeof UpdateAudioSchema>;
export type QueryAudio = z.infer<typeof QueryAudioSchema>;
