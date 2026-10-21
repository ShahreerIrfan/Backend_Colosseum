import { Ticket } from '../models/Ticket.js';
import * as TicketDTO from '@dtos/ticketDTO.js';

export default class TicketRepository {
  async Create(data: TicketDTO.CreateTicket): Promise<TicketDTO.Ticket> {
    const doc = new Ticket({
      token: data.token.trim().toUpperCase(),
      tier: data.tier || 'full_access',
      allowedFloorIds: data.allowedFloorIds || [
        'floor_underground',
        'floor_1',
        'floor_2',
        'floor_3',
      ],
      validFrom: data.validFrom || new Date(),
      validUntil: data.validUntil,
      maxActivations: data.maxActivations || 1,
      currentActivations: 0,
      activatedDevices: [],
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    const saved = await doc.save();
    return this.mapToDTO(saved);
  }

  async GetAll(queryData: TicketDTO.QueryTicket): Promise<{
    tickets: TicketDTO.Ticket[];
    total: number;
  }> {
    const page = queryData.page || 1;
    const limit = queryData.limit || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (queryData.tier) filter.tier = queryData.tier;
    if (queryData.isActive !== undefined) filter.isActive = queryData.isActive;
    if (queryData.token) filter.token = { $regex: queryData.token, $options: 'i' };

    const [tickets, total] = await Promise.all([
      Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      Ticket.countDocuments(filter).exec(),
    ]);

    return {
      tickets: tickets.map((t) => this.mapToDTO(t)),
      total,
    };
  }

  async GetByID(idOrToken: string): Promise<TicketDTO.Ticket | null> {
    const doc = await Ticket.findOne({
      $or: [
        { _id: idOrToken.match(/^[0-9a-fA-F]{24}$/) ? idOrToken : null },
        { token: idOrToken.trim().toUpperCase() },
      ],
    })
      .lean()
      .exec();

    if (!doc) return null;
    return this.mapToDTO(doc);
  }

  async FindByToken(token: string): Promise<TicketDTO.Ticket | null> {
    if (!token) return null;
    const doc = await Ticket.findOne({ token: token.trim().toUpperCase() }).lean().exec();
    if (!doc) return null;
    return this.mapToDTO(doc);
  }

  async Update(idOrToken: string, data: TicketDTO.UpdateTicket): Promise<TicketDTO.Ticket | null> {
    const updateData: Record<string, any> = {};
    if (data.tier !== undefined) updateData.tier = data.tier;
    if (data.allowedFloorIds !== undefined) updateData.allowedFloorIds = data.allowedFloorIds;
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
    if (data.maxActivations !== undefined) updateData.maxActivations = data.maxActivations;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await Ticket.findOneAndUpdate(
      {
        $or: [
          { _id: idOrToken.match(/^[0-9a-fA-F]{24}$/) ? idOrToken : null },
          { token: idOrToken.trim().toUpperCase() },
        ],
      },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();

    if (!updated) return null;
    return this.mapToDTO(updated);
  }

  async Remove(idOrToken: string): Promise<boolean> {
    const res = await Ticket.updateOne(
      {
        $or: [
          { _id: idOrToken.match(/^[0-9a-fA-F]{24}$/) ? idOrToken : null },
          { token: idOrToken.trim().toUpperCase() },
        ],
      },
      { $set: { isActive: false } }
    ).exec();

    return res.modifiedCount > 0;
  }

  async ValidateAndRedeem(
    token: string,
    deviceId?: string | null
  ): Promise<{
    isValid: boolean;
    reason?: string;
    token?: string;
    tier?: string;
    allowedFloorIds?: string[];
    expiresAt?: string;
  }> {
    const cleanToken = token.trim().toUpperCase();
    const ticket = await Ticket.findOne({ token: cleanToken });

    if (!ticket) {
      return { isValid: false, reason: 'Ticket token not found.' };
    }

    if (!ticket.isActive) {
      return { isValid: false, reason: 'Ticket has been deactivated.' };
    }

    const now = new Date();
    if (ticket.validUntil && ticket.validUntil < now) {
      return { isValid: false, reason: 'Ticket has expired.' };
    }

    if (ticket.validFrom && ticket.validFrom > now) {
      return { isValid: false, reason: 'Ticket is not yet active.' };
    }

    // Check activation count / device binding
    if (deviceId && !ticket.activatedDevices.includes(deviceId)) {
      if (ticket.currentActivations >= ticket.maxActivations) {
        return {
          isValid: false,
          reason: 'Ticket maximum device activations exceeded.',
        };
      }
      ticket.activatedDevices.push(deviceId);
      ticket.currentActivations += 1;
      await ticket.save();
    }

    return {
      isValid: true,
      token: ticket.token,
      tier: ticket.tier,
      allowedFloorIds: ticket.allowedFloorIds,
      expiresAt: ticket.validUntil.toISOString(),
    };
  }

  private mapToDTO(doc: any): TicketDTO.Ticket {
    return {
      id: doc._id?.toString(),
      token: doc.token,
      tier: doc.tier,
      allowedFloorIds: doc.allowedFloorIds,
      validFrom: doc.validFrom,
      validUntil: doc.validUntil,
      maxActivations: doc.maxActivations,
      currentActivations: doc.currentActivations,
      activatedDevices: doc.activatedDevices,
      isActive: doc.isActive,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
    };
  }
}
