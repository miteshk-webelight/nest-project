import { Queue } from "bullmq";

import { queueConfig } from "src/config/worker.config";

import { EMAIL_QUEUE_TOKEN, QUEUE_NAMES } from "./queue.constants";

export const emailQueueProvider = {
  provide: EMAIL_QUEUE_TOKEN,
  useFactory: () => {
    return new Queue(QUEUE_NAMES.EMAIL, queueConfig);
  },
};
