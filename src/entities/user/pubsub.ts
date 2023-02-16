import { Info } from "@nestjs/graphql";
import { $$asyncIterator } from 'iterall';


// const iterator = {
//   queue: [
//     [{id: 1, email: '1', fname: '1'}],
//     // [{id: 1, email: '1', fname: '1'}],
//   ],
//   next: async function() {
//     const value = this.queue[0];
//     this.queue.shift();
//     const res =  {
//       value: {
//         usersSubscription: value
//       },
//       done: !value || value?.length === 0
//     }

//     return res;
//   },
//   [$$asyncIterator]: function() {
//     return this;
//   }
// }

class PubSubQueue{
  pullQueue = [];
  pushQueue = [];
  running = true;

  async getValue() {
    // let value = this.queue[0];
    // this.queue.shift();

    return new Promise(
      resolve => {
        if (this.pushQueue.length !== 0) {
          const value = this.pushQueue.shift();
          console.log(value);
          resolve(this.running
            ? { value, done: false }
            : { value: undefined, done: true },
          );
        }
        else {
          this.pullQueue.push(resolve);
        }
      },
    );
  }

  async next() {
    return this.getValue();
  }

  [$$asyncIterator]() {
    return this;
  }

  throw(error) {
    this.emptyQueue();
    return Promise.reject(error);
  }

  async return() {
    this.emptyQueue();
    return { value: undefined, done: true };
  }

  private async emptyQueue() {
    if (this.running) {
      this.running = false;
      this.pullQueue.forEach(resolve => resolve({ value: undefined, done: true }));
      this.pullQueue.length = 0;
      this.pushQueue.length = 0;
    }
  }
  push(value) {
    this.running = true;
    if (this.pullQueue.length !== 0) {
      this.pullQueue.shift()(this.running
        ? { value, done: false }
        : { value: undefined, done: true },
      );
    } else {
      this.pushQueue.push(value);
    }
  }
}

class PubSubTest {
  queues = new Map<string, PubSubQueue>();
  publish(eventName: string, payload) {
    let queue = this.queues.get(eventName);
    if (!queue) {
      queue = new PubSubQueue();
      this.queues.set(eventName, queue);
    }
    queue.push(payload);
  }

  asyncIterator(eventName: string) {
    let queue = this.queues.get(eventName);
    if (!queue) {
      queue = new PubSubQueue();
      this.queues.set(eventName, queue);
    }

    return queue;
  }
}

// import { PubSub } from 'graphql-subscriptions';
// export const pubSub = new PubSub();
export const pubSub = new PubSubTest();

export const GraphqlSubscription = () => {
  return (target, property, descriptor) => {
    const actualDescriptor = descriptor.value;
    Info()(target, property, 100); 

    descriptor.value = async function(...args) {
      console.log(args);
      const t = args;
      const prop = property;
      const info = args.find(x => x?.fieldName === property);
      
      

      if (info.parentType.name === 'Subscription') {
        const result = await actualDescriptor.call(this, ...args);
        console.log('here');
        
        await pubSub.publish('users', { 'users': result });
        const iterator = pubSub.asyncIterator('users');
        
        // const t = await iterator.next();
        // const t1 = await t.value.usersSubscription.next();
        return iterator;
      } else {
        const result = await actualDescriptor.call(this, ...args);
        return result;
      }

      // return result;
    }
  }
}