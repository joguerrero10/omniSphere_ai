import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class StreamService {
  streamText(text: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const chunks = text.match(/.{1,20}/g) ?? [text];
      let index = 0;

      const interval = setInterval(() => {
        if (index >= chunks.length) {
          subscriber.next({
            data: { done: true },
          });
          subscriber.complete();
          clearInterval(interval);
          return;
        }

        subscriber.next({
          data: {
            token: chunks[index],
            done: false,
          },
        });

        index++;
      }, 80);

      return () => clearInterval(interval);
    });
  }
}