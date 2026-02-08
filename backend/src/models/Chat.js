import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    
    // Group Chat Fields
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    
    chatName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [100, "Chat name cannot exceed 100 characters"]
    },
    
    groupAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    groupImage: {
      type: String,
      default: "",
    },

    lastMessage: {
      type: String,
      default: "",
      maxlength: [500, "Last message preview cannot exceed 500 characters"]
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
chatSchema.index({ members: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ isGroupChat: 1 });

// Validation: Group chats must have a name
chatSchema.path('chatName').validate(function (value) {
  if (this.isGroupChat) {
    return typeof value === 'string' && value.trim().length > 0;
  }
  return true;
}, 'Group chat must have a name');

// Virtual for participant count
chatSchema.virtual("participantCount").get(function () {
  return this.members ? this.members.length : 0;
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;

