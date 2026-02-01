import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: [true, "Chat ID is required"],
      index: true
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
    },

    text: {
      type: String,
      trim: true,
      default: "",
      maxlength: [5000, "Message cannot exceed 5000 characters"]
    },

    type: {
      type: String,
      enum: {
        values: ["text", "image", "video", "file"],
        message: "{VALUE} is not a valid message type"
      },
      default: "text",
    },
    
    // Media attachments (URLs)
    attachments: [
      {
         type: String,
         validate: {
           validator: function(v) {
             // Basic URL validation
             return !v || v.startsWith('/public/') || v.startsWith('http');
           },
           message: "Invalid attachment URL"
         }
      }
    ],

    // Read Receipts 
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    
    // Message Reactions
    reactions: [
       {
         user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
         emoji: { 
           type: String, 
           required: true,
           maxlength: [10, "Emoji cannot exceed 10 characters"]
         }
       }
    ],
    
    isEdited: {
        type: Boolean,
        default: false
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for efficient message queries (most common query pattern)
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

// Validation: Message must have either text or attachments
messageSchema.pre("save", function (next) {
  if (!this.text && (!this.attachments || this.attachments.length === 0)) {
    next(new Error("Message must have either text or attachments"));
  } else {
    next();
  }
});

// Method to check if a user has seen the message
messageSchema.methods.hasUserSeen = function (userId) {
  return this.seenBy.some(id => id.toString() === userId.toString());
};

// Method to add a user to seenBy
messageSchema.methods.markAsSeenBy = function (userId) {
  if (!this.hasUserSeen(userId)) {
    this.seenBy.push(userId);
  }
  return this.save();
};

const Message = mongoose.model("Message", messageSchema);

export default Message;

