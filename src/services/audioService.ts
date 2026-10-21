import AudioRepository from '@repositories/audioRepository.js';
import * as AudioDTO from '@dtos/audioDTO.js';
import * as Error from '@errors/concreteErrors.js';
import { MessageConstants } from '@constants/allConstant.js';

const Message = MessageConstants.errorMessage.audioService;

export default class AudioService {
  private audioRepository: AudioRepository;

  constructor() {
    this.audioRepository = new AudioRepository();
  }

  async CreateAudioTrack(data: AudioDTO.CreateAudio): Promise<AudioDTO.Audio> {
    return this.audioRepository.Create(data);
  }

  async GetAllAudioTracks(query: AudioDTO.QueryAudio): Promise<{
    audioTracks: AudioDTO.Audio[];
    total: number;
  }> {
    return this.audioRepository.GetAll(query);
  }

  async GetAudioTrackByID(id: string): Promise<AudioDTO.Audio> {
    const track = await this.audioRepository.GetByID(id);
    if (!track) {
      throw new Error.NotFoundError(Message.audioTrackNotFound);
    }
    return track;
  }

  async UpdateAudioTrack(id: string, data: AudioDTO.UpdateAudio): Promise<AudioDTO.Audio> {
    const existing = await this.audioRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(Message.audioTrackNotFound);
    }

    const updated = await this.audioRepository.Update(id, data);
    if (!updated) {
      throw new Error.NotFoundError(Message.audioTrackNotFound);
    }
    return updated;
  }

  async RemoveAudioTrack(id: string): Promise<boolean> {
    const existing = await this.audioRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(Message.audioTrackNotFound);
    }
    return this.audioRepository.Remove(id);
  }
}
