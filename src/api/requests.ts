import { get } from './api.ts';

// TODO: type this.
export async function delay(): Promise<any> {
  return new Promise((resolve, reject) => {
    get('delay').then(resolve).catch(reject)
  })
}