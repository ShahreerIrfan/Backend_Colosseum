import { Viewpoint } from '../models/Viewpoint.js';
import * as AudioDTO from '@dtos/audioDTO.js';

export default class AudioRepository {
  async Create(data: AudioDTO.CreateAudio): Promise<AudioDTO.Audio> {
    const key = `translations.${data.language}`;
    await Viewpoint.updateOne(
      { viewpointId: data.viewpointId },
      {
        $set: {
          [`${key}.audioUrl`]: data.audioUrl,
          [`${key}.audioDuration`]: data.duration,
          [`${key}.description`]: data.transcript || '',
        },
      }
    ).exec();

    return {
      id: `${data.viewpointId}_${data.language}`,
      viewpointId: data.viewpointId,
      language: data.language,
      audioUrl: data.audioUrl,
      duration: data.duration,
      transcript: data.transcript || '',
      fileSize: data.fileSize || 0,
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
    };
  }

  async GetAll(queryData: AudioDTO.QueryAudio): Promise<{
    audioTracks: AudioDTO.Audio[];
    total: number;
  }> {
    const filter: Record<string, any> = { isPublished: true };
    if (queryData.viewpointId) {
      filter.viewpointId = queryData.viewpointId;
    }

    const viewpoints = await Viewpoint.find(filter).lean().exec();
    const tracks: AudioDTO.Audio[] = [];

    for (const vp of viewpoints) {
      const translations = vp.translations || {};
      const entries =
        translations instanceof Map
          ? Array.from(translations.entries())
          : Object.entries(translations);

      for (const [lang, content] of entries as [string, any][]) {
        if (queryData.language && queryData.language !== lang) continue;
        if (content?.audioUrl) {
          tracks.push({
            id: `${vp.viewpointId}_${lang}`,
            viewpointId: vp.viewpointId,
            language: lang,
            audioUrl: content.audioUrl,
            duration: content.audioDuration || '3 min',
            transcript: content.description || '',
            fileSize: content.fileSize || 0,
            isPublished: vp.isPublished,
          });
        }
      }
    }

    const page = queryData.page || 1;
    const limit = queryData.limit || 10;
    const skip = (page - 1) * limit;

    return {
      audioTracks: tracks.slice(skip, skip + limit),
      total: tracks.length,
    };
  }

  async GetByID(id: string): Promise<AudioDTO.Audio | null> {
    const [viewpointId, language] = id.split('_');
    if (!viewpointId || !language) return null;

    const vp = await Viewpoint.findOne({ viewpointId, isPublished: true }).lean().exec();
    if (!vp) return null;

    const translations = vp.translations as any;
    const localized = translations?.[language] || (translations instanceof Map ? translations.get(language) : null);
    if (!localized?.audioUrl) return null;

    return {
      id,
      viewpointId: vp.viewpointId,
      language,
      audioUrl: localized.audioUrl,
      duration: localized.audioDuration || '3 min',
      transcript: localized.description || '',
      fileSize: localized.fileSize || 0,
      isPublished: vp.isPublished,
    };
  }

  async Update(id: string, data: AudioDTO.UpdateAudio): Promise<AudioDTO.Audio | null> {
    const [viewpointId, language] = id.split('_');
    if (!viewpointId || !language) return null;

    const updateFields: Record<string, any> = {};
    const key = `translations.${language}`;
    if (data.audioUrl !== undefined) updateFields[`${key}.audioUrl`] = data.audioUrl;
    if (data.duration !== undefined) updateFields[`${key}.audioDuration`] = data.duration;
    if (data.transcript !== undefined) updateFields[`${key}.description`] = data.transcript;

    const res = await Viewpoint.updateOne({ viewpointId }, { $set: updateFields }).exec();
    if (res.matchedCount === 0) return null;

    return this.GetByID(id);
  }

  async Remove(id: string): Promise<boolean> {
    const [viewpointId, language] = id.split('_');
    if (!viewpointId || !language) return false;

    const key = `translations.${language}.audioUrl`;
    const res = await Viewpoint.updateOne({ viewpointId }, { $set: { [key]: '' } }).exec();
    return res.modifiedCount > 0;
  }
}
