import { User } from '../models/User.js';
import * as AuthDTO from '@dtos/authDTO.js';

export default class AuthRepository {
  async Create(data: AuthDTO.SignUp): Promise<AuthDTO.User> {
    const user = new User({
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      role: data.role || 'USER',
      assignedFloorIds: data.assignedFloorIds || [],
      is_active: true,
      is_deleted: false,
    });
    const saved = await user.save();
    return this.mapToDTO(saved);
  }

  async FindByEmail(email: string): Promise<any | null> {
    return User.findOne({ email: email.toLowerCase(), is_deleted: false }).lean().exec();
  }

  async FindById(id: string): Promise<AuthDTO.User | null> {
    const user = await User.findOne({ _id: id, is_deleted: false }).lean().exec();
    if (!user) return null;
    return this.mapToDTO(user);
  }

  async Update(id: string, data: Partial<AuthDTO.User>): Promise<AuthDTO.User | null> {
    const updated = await User.findOneAndUpdate(
      { _id: id, is_deleted: false },
      { $set: data },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();
    if (!updated) return null;
    return this.mapToDTO(updated);
  }

  async UpdatePassword(id: string, hashedPassword: string): Promise<boolean> {
    const res = await User.updateOne(
      { _id: id, is_deleted: false },
      { $set: { password: hashedPassword } }
    ).exec();
    return res.modifiedCount > 0;
  }

  async GetAll(queryData: { page?: number; limit?: number }): Promise<{
    users: AuthDTO.User[];
    total: number;
  }> {
    const page = queryData.page || 1;
    const limit = queryData.limit || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ is_deleted: false }).skip(skip).limit(limit).sort({ created_at: -1 }).lean().exec(),
      User.countDocuments({ is_deleted: false }).exec(),
    ]);

    return {
      users: users.map((u) => this.mapToDTO(u)),
      total,
    };
  }

  async Remove(id: string): Promise<boolean> {
    const res = await User.updateOne(
      { _id: id, is_deleted: false },
      { $set: { is_deleted: true, is_active: false, deleted_at: new Date() } }
    ).exec();
    return res.modifiedCount > 0;
  }

  private mapToDTO(doc: any): AuthDTO.User {
    return {
      id: doc._id?.toString() || doc.id,
      name: doc.name,
      email: doc.email,
      role: doc.role as AuthDTO.Role,
      assignedFloorIds: doc.assignedFloorIds || [],
      is_active: doc.is_active,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };
  }
}
