import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: function (doc, ret: any) {
      if (ret.password) delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  password?: string; // Optional for OAuth users

  @Prop()
  avatar?: string;

  @Prop({ default: 'google' })
  provider: string; // 'google', 'local', etc.

  @Prop()
  providerId?: string; // Google ID, etc.

  @Prop({ default: 'user' })
  role: string; // 'admin', 'user'

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
