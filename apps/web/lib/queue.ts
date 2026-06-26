import { Queue } from 'bullmq';
import { getBullMqConnection } from './redis';

export const QUEUE_NAME = 'message-processing';

export const messageQueue = new Queue(QUEUE_NAME, {
  connection: getBullMqConnection(),
});

export const addMessageJob = async (data: {
  messageId: string;
  customerPhoneNumber: string;
  vendorPhoneNumber: string;
  content: string;
  isMedia: boolean;
}) => {
  await messageQueue.add('process-incoming-message', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
};
export default messageQueue;
