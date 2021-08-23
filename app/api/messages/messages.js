const Messages = require("./messages.schema");
const newMessage = async ({messageId, userId, text = ''}) => {
  const newMessage = new Messages({
    messageId,
    userId,
    text,
    messagesType: 'delete'
  })
  await newMessage.save()
}
module.exports = {
  newMessage
}
