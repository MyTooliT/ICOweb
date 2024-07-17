// TODO:  Type this into a generic once it works. For now, only params and
//        return type are somewhat typed.

async function sendRequest(
  endpoint: string, method: string, body: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const protocol = import.meta.env.VITE_APP_TAL_PROTOCOL;
    const hostname = import.meta.env.VITE_APP_TAL_HOSTNAME;
    const port = import.meta.env.VITE_APP_TAL_PORT;
    const version = import.meta.env.VITE_APP_VERSION;

    const requestOptions = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : body,
    };
    fetch(
      `${protocol}://${hostname}:${port}/api/${version}/${endpoint}`,
      requestOptions,
    )
      .then(async (response) => {
        if (response.status !== 200) {
          reject(
            Object.assign(
              {
                error: true,
                status: response.status,
              },
              await response.json(),
            ),
          );
        } else {
          resolve(await response.json());
        }
      })
      .catch((err) => {
        reject({
          error: true,
          message: err.message,
        });
      });
  });
}

export async function get(endpoint: string) {
  return new Promise((resolve, reject) => {
    sendRequest(endpoint, 'GET', undefined)
      .then(resolve)
      .catch(reject);
  });
}

export async function post(endpoint: string, body: any) {
  return new Promise((resolve, reject) => {
    sendRequest(endpoint, 'POST', body)
      .then(resolve)
      .catch(reject);
  });
}

export async function put(endpoint: string, body: any) {
  return new Promise((resolve, reject) => {
    sendRequest(endpoint, 'PUT', body)
      .then(resolve)
      .catch(reject);
  });
}

export async function del(endpoint: string, body: any) {
  return new Promise((resolve, reject) => {
    sendRequest(endpoint, 'DELETE', body)
      .then(resolve)
      .catch(reject);
  });
}
